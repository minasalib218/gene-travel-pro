import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordUserActivity } from "@/lib/customer-activity";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";
import { createRouteClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const sectionSchema = z.object({
  section: z.enum([
    "profile-overview",
    "my-trips",
    "create-plan",
    "favorite-plans",
    "bookings-reminders",
    "my-credits",
    "travel-preferences",
    "travel-documents",
    "special-offers",
    "notifications",
    "support",
    "account-security",
  ]),
});

export async function POST(req: NextRequest) {
  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });

  const parsed = sectionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });

  await ensureUserProfile(data.user);
  await recordUserActivity({
    userId: data.user.id,
    event: "PROFILE_SECTION_VIEWED",
    entityType: "PROFILE",
    metadata: { section: parsed.data.section },
  });

  return NextResponse.json({ ok: true });
}
