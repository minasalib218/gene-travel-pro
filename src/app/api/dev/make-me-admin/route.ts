import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { createRouteClient } from "@/lib/supabase/server";
import { UserRole } from "@prisma/client";

export async function POST() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ ok: false, code: "DISABLED_IN_PROD" }, { status: 403 });
    }

    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) return NextResponse.json({ ok: false, code: "AUTH_ERROR" }, { status: 401 });
    if (!data?.user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });

    const userId = data.user.id;

    await prisma.profile.upsert({
      where: { id: userId },
      update: { role: UserRole.ADMIN },
      create: { id: userId, role: UserRole.ADMIN },
    });

    return NextResponse.json({ ok: true, userId });
  } catch (e: any) {
    console.error("make-me-admin error:", e);
    return NextResponse.json({ ok: false, code: "INTERNAL" }, { status: 500 });
  }
}
