import { prisma } from "@/lib/prisma";
import { createRouteClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = createRouteClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) return { ok: false as const, code: "NOT_AUTHED" };
  return { ok: true as const, user };
}

export async function requireAdmin() {
  const u = await requireUser();
  if (!u.ok) return u;

  const profile = await prisma.profile.findUnique({
    where: { id: u.user.id },
    select: { id: true, role: true },
  });

  if (!profile || profile.role !== "ADMIN") {
    return { ok: false as const, code: "NOT_ADMIN" };
  }

  return { ok: true as const, user: u.user, profile };
}