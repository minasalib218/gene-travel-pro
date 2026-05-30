import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { planInputSchema } from "@/lib/validations/plan-input";
import { mapPlanInputToPrisma } from "@/lib/plan-input/mapper";
import { buildRecommendationFromInput } from "@/lib/ai/recommendation-engine";
import { Prisma } from "@prisma/client";
import { createRouteClient } from "@/lib/supabase/server";
import { requireActivePass } from "@/lib/require-pass";

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get("cookie") ?? "";
    const isEnvAdmin = cookie.includes("admin_auth=1");
    const supabase = createRouteClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (!isEnvAdmin && (authError || !authData?.user)) {
      return NextResponse.json({ error: "You need to sign in first." }, { status: 401 });
    }

    const userId = isEnvAdmin ? process.env.ADMIN_USER_ID || "trial-admin" : authData!.user.id;

    if (isEnvAdmin) {
      try {
        await prisma.profile.upsert({
          where: { id: userId },
          update: {},
          create: { id: userId, email: process.env.ADMIN_EMAIL ?? null },
        });
      } catch {
        // Keep the admin trial path resilient if profile creation is already satisfied elsewhere.
      }
    }

    if (!isEnvAdmin) {
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

    const planInput = await prisma.planInput.create({
      data: {
        ...mapPlanInputToPrisma(parsed.data),
        userId,
      },
    });

    const recommendation = await buildRecommendationFromInput(parsed.data);

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

    return NextResponse.json({
      ok: true,
      planInput: { id: planInput.id },
      planInputData: JSON.parse(JSON.stringify(planInput)),
      recommendation: {
        headline: recommendation.headline,
        summary: recommendation.summary,
        hotels: recommendation.hotels,
        flights: recommendation.flights,
        activities: recommendation.activities,
        fitBullets: recommendation.fitBullets,
        rawAi: recommendation.rawAi ?? null,
      },
    });
  } catch (error) {
    console.error("POST /api/plan-inputs error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
