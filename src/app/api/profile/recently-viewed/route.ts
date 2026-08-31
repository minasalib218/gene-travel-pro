import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteClient } from "@/lib/supabase/server";
import { recordUserActivity, upsertRecentlyViewed } from "@/lib/customer-activity";

const viewedSchema = z.object({
  entityType: z.enum(["READY_PLAN", "PLAN", "HOTEL", "ACTIVITY", "FLIGHT", "TRANSPORT", "EVENT"]),
  entityId: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return NextResponse.json({ ok: true, tracked: false });
  }

  const parsed = viewedSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  }

  await upsertRecentlyViewed({
    userId: data.user.id,
    entityType: parsed.data.entityType,
    entityId: parsed.data.entityId,
    metadata: parsed.data.metadata ?? null,
  });
  await recordUserActivity({
    userId: data.user.id,
    event: `${parsed.data.entityType}_VIEWED`,
    entityType: parsed.data.entityType,
    entityId: parsed.data.entityId,
    metadata: parsed.data.metadata ?? null,
  });

  return NextResponse.json({ ok: true, tracked: true });
}
