import { ReactNode } from "react";
import { createRouteClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireActivePass } from "@/lib/require-pass";

export default async function ProtectedAI({ children }: { children: ReactNode }) {
  const isAdminPreview = cookies().get("admin_auth")?.value === "1";
  if (isAdminPreview) return <>{children}</>;

  const supabase = createRouteClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) redirect("/signin");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (profile?.role === "ADMIN") return <>{children}</>;

  const access = await requireActivePass(user.id);
  if (!access.ok) {
    redirect(access.code === "PASS_EXHAUSTED" ? "/profile?access=exhausted" : "/pricing?access=required");
  }

  return <>{children}</>;
}
