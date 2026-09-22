import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { planInputSchema } from "@/lib/validations/plan-input";
import { mapPlanInputToPrisma } from "@/lib/plan-input/mapper";
import { buildRecommendationFromInput } from "@/lib/ai/recommendation-engine";
import { Prisma } from "@prisma/client";
import { createRouteClient } from "@/lib/supabase/server";
import { requireActivePass } from "@/lib/require-pass";
import { isAdmin } from "@/lib/access/canUseAi";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";
import { tableExists } from "@/lib/prisma-safe";
import { recordUserActivity } from "@/lib/customer-activity";

function shouldFallbackToSession(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);

  return [
    "does not exist",
    "Authentication failed against database server",
    "Can't reach database server",
    "Error validating datasource",
    "Schema engine error",
    "prepared statement",
  ].some((fragment) => message.includes(fragment));
}

export async function POST(req: Request) {
  try {
    const supabase = createRouteClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return NextResponse.json({ error: "You need to sign in first." }, { status: 401 });
    }

    const userId = authData.user.id;
    await ensureUserProfile(authData.user, "AI_PLANNER_SUBMITTED");
    const admin = await isAdmin(userId);

    if (!admin) {
      const access = await requireActivePass(userId);
      if (!access.ok) {
        return NextResponse.json(
          {
            error:
              access.code === "PASS_EXHAUSTED"
                ? "Your paid tier has finished. Renew or upgrade to keep using the AI pages."
                : "A paid tier is required to use the AI pages.",
            code: access.code,
          },
          { status: 403 },
        );
      }
    }

    const json = await req.json();
    const normalizedPayload = {
      ...json,
      trip: {
        ...json?.trip,
        departureCity:
          json?.trip?.departureCity || json?.trip?.travellingFrom?.city || "",
        preferredAirport:
          json?.trip?.preferredAirport || json?.trip?.travellingFrom?.airport || "",
      },
      stay: {
        ...json?.stay,
        roomType: json?.stay?.roomType || null,
      },
    };
    const parsed = planInputSchema.safeParse(normalizedPayload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    // Trip-specific planner inputs must not silently overwrite the customer's
    // global profile preferences. A future explicit "save as preferences"
    // action may opt in by sending this flag.
    if (json?.syncTravelPreferences === true && await tableExists("travel_preferences")) {
      await prisma.travelPreference
        .upsert({
          where: { userId },
          update: {
            travelStyles: parsed.data.style.travelStyles,
            preferredBudgetMin: parsed.data.budget.budgetMin,
            preferredBudgetMax: parsed.data.budget.budgetMax,
            preferredCurrency: "USD",
            hotelPreference: parsed.data.stay.stayType,
            preferredTransportation: parsed.data.transport.transportType,
            preferredRegions: parsed.data.trip.destinations.map((destination) => destination.country).filter(Boolean),
            activityIntensity: parsed.data.activities.activityIntensity,
            mealPreferences: parsed.data.constraints.foodPreferences,
            metadata: {
              latestBudget: {
                amount: parsed.data.budget.totalBudget,
                min: parsed.data.budget.budgetMin,
                max: parsed.data.budget.budgetMax,
                scope: parsed.data.budget.budgetPer,
                openBudget: parsed.data.budget.openBudget,
                includesFlights: parsed.data.budget.includeFlights,
              },
              latestTripDestination: parsed.data.trip.destination,
              latestTripDates: {
                startDate: parsed.data.trip.startDate,
                endDate: parsed.data.trip.endDate,
              },
            } as Prisma.InputJsonValue,
          },
          create: {
            userId,
            travelStyles: parsed.data.style.travelStyles,
            preferredBudgetMin: parsed.data.budget.budgetMin,
            preferredBudgetMax: parsed.data.budget.budgetMax,
            preferredCurrency: "USD",
            hotelPreference: parsed.data.stay.stayType,
            preferredTransportation: parsed.data.transport.transportType,
            preferredRegions: parsed.data.trip.destinations.map((destination) => destination.country).filter(Boolean),
            activityIntensity: parsed.data.activities.activityIntensity,
            mealPreferences: parsed.data.constraints.foodPreferences,
            metadata: {
              latestBudget: {
                amount: parsed.data.budget.totalBudget,
                min: parsed.data.budget.budgetMin,
                max: parsed.data.budget.budgetMax,
                scope: parsed.data.budget.budgetPer,
                openBudget: parsed.data.budget.openBudget,
                includesFlights: parsed.data.budget.includeFlights,
              },
              latestTripDestination: parsed.data.trip.destination,
              latestTripDates: {
                startDate: parsed.data.trip.startDate,
                endDate: parsed.data.trip.endDate,
              },
            } as Prisma.InputJsonValue,
          },
        })
        .catch((preferenceError) => {
          console.error("POST /api/plan-inputs preference sync warning", preferenceError);
        });
    }

    const recommendation = await buildRecommendationFromInput(parsed.data);
    const mappedInput = mapPlanInputToPrisma(parsed.data, userId);

    try {
      const planInput = await prisma.planInput.create({
        data: mappedInput,
      });

      await prisma.planRecommendation.create({
        data: {
          planInputId: planInput.id,
          headline: recommendation.headline,
          summary: recommendation.summary,
          hotels: recommendation.hotels as unknown as Prisma.InputJsonValue,
          flights: recommendation.flights as unknown as Prisma.InputJsonValue,
          activities: recommendation.activities as unknown as Prisma.InputJsonValue,
          fitBullets: recommendation.fitBullets,
          rawAi:
            (recommendation.rawAi ?? null) as
              | Prisma.InputJsonValue
              | Prisma.NullableJsonNullValueInput,
        },
      });

      await recordUserActivity({
        userId,
        event: "AI_RECOMMENDATION_GENERATED",
        entityType: "PLAN_INPUT",
        entityId: planInput.id,
        metadata: {
          destination: parsed.data.trip.destination,
          startDate: parsed.data.trip.startDate,
          endDate: parsed.data.trip.endDate,
          storageMode: "database",
        },
      });

      return NextResponse.json({
        ok: true,
        planInput: { id: planInput.id },
        storageMode: "database",
      });
    } catch (persistenceError) {
      if (shouldFallbackToSession(persistenceError)) {
        return NextResponse.json(
          {
            error: "Your planning session could not be saved. Your form is still available in this browser; please retry.",
            code: "PLAN_STORE_UNAVAILABLE",
          },
          { status: 503 },
        );
      }
      throw persistenceError;
    }
  } catch (error) {
    console.error("POST /api/plan-inputs error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
