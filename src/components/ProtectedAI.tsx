import { ReactNode } from "react";
import { createRouteClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requireActivePass } from "@/lib/require-pass";
import { getVerifiedAdmin } from "@/lib/admin/verified";
import { getCreditStatus } from "@/lib/credits/creditService";

export default async function ProtectedAI({
  children,
  requiredFeature,
}: {
  children: ReactNode;
  requiredFeature?: string;
}) {
  const admin = await getVerifiedAdmin();
  if (admin.ok) return <>{children}</>;

  const supabase = createRouteClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) redirect("/signin");

  const access = await requireActivePass(user.id);
  if (!access.ok) {
    redirect(access.code === "PASS_EXHAUSTED" ? "/profile?access=exhausted" : "/pricing?access=required");
  }

  if (requiredFeature) {
    const status = await getCreditStatus(user.id);
    if (!status.features.includes(requiredFeature)) {
      redirect(`/profile?feature=${encodeURIComponent(requiredFeature)}`);
    }
  }

  return <>{children}</>;
}
