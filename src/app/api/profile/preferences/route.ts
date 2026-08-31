import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { tableExists } from "@/lib/prisma-safe";
import { createRouteClient } from "@/lib/supabase/server";
import { recordUserActivity } from "@/lib/customer-activity";

export const dynamic = "force-dynamic";

const preferenceSchema = z.object({
  travelStyles: z.array(z.string().min(1).max(80)).max(20).optional(),
  preferredBudgetMin: z.number().int().min(0).max(1000000).optional().nullable(),
  preferredBudgetMax: z.number().int().min(0).max(1000000).optional().nullable(),
  preferredCurrency: z.string().min(2).max(8).optional().nullable(),
  hotelPreference: z.string().max(120).optional().nullable(),
  preferredTransportation: z.string().max(120).optional().nullable(),
  preferredRegions: z.array(z.string().min(1).max(80)).max(20).optional(),
  activityIntensity: z.string().max(80).optional().nullable(),
  typicalTripDuration: z.string().max(80).optional().nullable(),
  mealPreferences: z.array(z.string().min(1).max(80)).max(20).optional(),
  accessibilityRequirements: z.string().max(1000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

async function getUserId() {
  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user.id;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  if (!(await tableExists("travel_preferences"))) {
    return NextResponse.json({ ok: true, preferences: null });
  }

  const preferences = await prisma.travelPreference.findUnique({ where: { userId } });
  return NextResponse.json({ ok: true, preferences });
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  if (!(await tableExists("travel_preferences"))) {
    return NextResponse.json({ ok: false, code: "PREFERENCES_NOT_READY" }, { status: 503 });
  }

  const parsed = preferenceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });

  const preferences = await prisma.travelPreference.upsert({
    where: { userId },
    update: {
      ...parsed.data,
      metadata: parsed.data.metadata ? (parsed.data.metadata as Prisma.InputJsonValue) : undefined,
    },
    create: {
      userId,
      travelStyles: parsed.data.travelStyles ?? [],
      preferredBudgetMin: parsed.data.preferredBudgetMin ?? null,
      preferredBudgetMax: parsed.data.preferredBudgetMax ?? null,
      preferredCurrency: parsed.data.preferredCurrency ?? null,
      hotelPreference: parsed.data.hotelPreference ?? null,
      preferredTransportation: parsed.data.preferredTransportation ?? null,
      preferredRegions: parsed.data.preferredRegions ?? [],
      activityIntensity: parsed.data.activityIntensity ?? null,
      typicalTripDuration: parsed.data.typicalTripDuration ?? null,
      mealPreferences: parsed.data.mealPreferences ?? [],
      accessibilityRequirements: parsed.data.accessibilityRequirements ?? null,
      metadata: parsed.data.metadata ? (parsed.data.metadata as Prisma.InputJsonValue) : undefined,
    },
  });

  await recordUserActivity({
    userId,
    event: "TRAVEL_PREFERENCES_UPDATED",
    entityType: "TRAVEL_PREFERENCE",
    entityId: preferences.id,
  });

  return NextResponse.json({ ok: true, preferences });
}

export async function DELETE() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  if (!(await tableExists("travel_preferences"))) return NextResponse.json({ ok: true });

  await prisma.travelPreference.deleteMany({ where: { userId } });
  await recordUserActivity({
    userId,
    event: "TRAVEL_PREFERENCES_DELETED",
    entityType: "TRAVEL_PREFERENCE",
  });

  return NextResponse.json({ ok: true });
}
