import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireActivePass } from "@/lib/require-pass";
import { consumeTierAction } from "@/lib/tier-actions";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/access/canUseAi";

function uuidFallback() {
  return String(Date.now()) + "-" + Math.random().toString(16).slice(2);
}

export async function POST(req: Request) {
  try {
    // ✅ ENV admin bypass (must be inside POST)
    const cookie = req.headers.get("cookie") ?? "";
    const isEnvAdmin = cookie.includes("admin_auth=1");

    // ✅ Trial path for ENV admin (no Supabase needed)
    if (isEnvAdmin) {
      const body = await req.json().catch(() => null);

      // If the client passed a planId, reuse it, otherwise create one
      const existingPlanId = body?.planId ? String(body.planId) : null;

      const destination = String(body?.destination ?? "Trial Destination");
      const startDateStr = String(body?.startDate ?? new Date().toISOString());
      const endDateStr = String(body?.endDate ?? new Date().toISOString());

      // We need a userId for DB relations.
      // If you don't want DB writes in trial, tell me and I’ll switch to sessionStorage only.
      const adminUserId = process.env.ADMIN_USER_ID || "trial-admin";

      // Ensure profile exists if using real schema relations (profiles table)
      // If adminUserId is not a real Supabase UUID, this will fail with FK constraints.
      // Best: set ADMIN_USER_ID in .env.local to a real Supabase user UUID.
      // ADMIN_USER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      try {
        await prisma.profile.upsert({
          where: { id: adminUserId },
          update: {},
          create: { id: adminUserId, email: process.env.ADMIN_EMAIL ?? null },
          select: { id: true },
        });
      } catch {
        // ignore if your DB does not enforce FK, otherwise you must set ADMIN_USER_ID properly
      }

      const plan =
        existingPlanId
          ? await prisma.plan.findFirst({
              where: { id: existingPlanId, userId: adminUserId },
              select: { id: true },
            })
          : null;

      const planId =
        plan?.id ??
        (
          await prisma.plan.create({
            data: {
              userId: adminUserId,
              title: String(body?.title ?? "Trial Gene Plan"),
              destination,
              startDate: new Date(startDateStr),
              endDate: new Date(endDateStr),
              inputsJson: body?.inputs ?? body ?? null,
            },
            select: { id: true },
          })
        ).id;

      const analysis = {
        generatedAt: new Date().toISOString(),
        promptInstructions: [
          "Generate Smart Booking Scores for every selected hotel, flight, and activity.",
          "Score Value, Location, Walking, Comfort, Family, Transport, and Worth the Money from 0 to 100.",
          "Use only real available item data from provider/API results and the user's inputs.",
          "Do not invent price, rating, distance, or availability.",
          "If data is missing, lower confidence and explain what is missing.",
          "Generate a Travel Happiness Score for the selected itinerary.",
          "Predict enjoyment probability, stress probability, and compatibility score from pace, budget, crowd density, walking load, weather, traveler personality, fatigue signals, comfort, and route practicality.",
          "Use only real trip data already available in the planner, recommendation results, and day-by-day itinerary.",
          "Do not invent fake prices, weather, or distances.",
          "If data is missing, lower confidence and explain why. Return a concise premium summary, positive drivers, risk drivers, and an overall score.",
          "Generate a Smart Visa & Entry Assistant analysis using the traveler's passport country, destination country, transit countries, trip dates, passport expiry date, and traveler profile.",
          "Explain visa requirement possibility, entry restrictions, vaccination/health rules, transit visa risk, passport validity, customs notes, and required documents.",
          "If official API data is missing, lower confidence and clearly say the traveler must verify with embassy/airline. Do not invent exact legal guarantees.",
        ],
        engines: {
          budget: { ok: true, note: "Trial budget analysis" },
          timing: { ok: true, note: "Trial timing analysis" },
          weather: { ok: true, note: "Trial weather checks" },
        },
        features: [
          "Season Genius Score",
          "Ultra-local travel time accuracy",
          "Fatigue Meter",
          "Weather auto-swap",
          "Risk Radar",
          "Budget Dampener",
        ],
        inputsSnapshot: body?.inputs ?? body ?? null,
        adminBypass: true,
      };

      await prisma.plan.update({
        where: { id: planId },
        data: { analysisJson: analysis },
      });

      return NextResponse.json({
        ok: true,
        planId,
        remainingActions: 999,
        admin: true,
        trial: true,
      });
    }

    // =========================
    // Normal customer path (Supabase)
    // =========================
    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return NextResponse.json({ ok: false, code: "SUPABASE_AUTH_ERROR" }, { status: 401 });
    }
    if (!data?.user) {
      return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const planId = body?.planId;
    const idempotencyKey = body?.idempotencyKey || uuidFallback();

    if (!planId) {
      return NextResponse.json({ ok: false, code: "MISSING_PLAN_ID" }, { status: 400 });
    }

    const userId = data.user.id;
    const admin = await isAdmin(userId);

    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId },
      select: { id: true, inputsJson: true },
    });

    if (!plan) {
      return NextResponse.json({ ok: false, code: "PLAN_NOT_FOUND" }, { status: 404 });
    }

    let remainingActions: number | null = null;

    if (!admin) {
      const passCheck = await requireActivePass(userId);
      if (!passCheck.ok || !passCheck.pass) {
        return NextResponse.json({ ok: false, code: "NO_ACTIVE_PASS" }, { status: 402 });
      }

      const charge = await consumeTierAction({
        userId,
        passId: passCheck.pass.id,
        actionType: "RUN_ANALYSIS",
        idempotencyKey,
      });

      if (!charge.ok) {
        return NextResponse.json({ ok: false, code: charge.code }, { status: 402 });
      }

      remainingActions = charge.remaining;
    }

    const analysis = {
      generatedAt: new Date().toISOString(),
      promptInstructions: [
        "Generate Smart Booking Scores for every selected hotel, flight, and activity.",
        "Score Value, Location, Walking, Comfort, Family, Transport, and Worth the Money from 0 to 100.",
        "Use only real available item data from provider/API results and the user's inputs.",
        "Do not invent price, rating, distance, or availability.",
        "If data is missing, lower confidence and explain what is missing.",
        "Generate a Travel Happiness Score for the selected itinerary.",
        "Predict enjoyment probability, stress probability, and compatibility score from pace, budget, crowd density, walking load, weather, traveler personality, fatigue signals, comfort, and route practicality.",
        "Use only real trip data already available in the planner, recommendation results, and day-by-day itinerary.",
        "Do not invent fake prices, weather, or distances.",
        "If data is missing, lower confidence and explain why. Return a concise premium summary, positive drivers, risk drivers, and an overall score.",
        "Generate a Smart Visa & Entry Assistant analysis using the traveler's passport country, destination country, transit countries, trip dates, passport expiry date, and traveler profile.",
        "Explain visa requirement possibility, entry restrictions, vaccination/health rules, transit visa risk, passport validity, customs notes, and required documents.",
        "If official API data is missing, lower confidence and clearly say the traveler must verify with embassy/airline. Do not invent exact legal guarantees.",
      ],
      engines: {
        budget: { ok: true, note: "Stub budget analysis" },
        timing: { ok: true, note: "Stub timing analysis" },
        weather: { ok: true, note: "Stub weather checks" },
      },
      features: [
        "Season Genius Score",
        "Ultra-local travel time accuracy",
        "Fatigue Meter",
        "Weather auto-swap",
        "Risk Radar",
        "Budget Dampener",
      ],
      inputsSnapshot: plan.inputsJson ?? null,
      adminBypass: admin ? true : undefined,
    };

    await prisma.plan.update({
      where: { id: planId },
      data: { analysisJson: analysis },
    });

    return NextResponse.json({
      ok: true,
      planId,
      remainingActions,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
