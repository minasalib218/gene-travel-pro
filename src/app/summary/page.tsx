import SummaryClient from "./ui";
import { createRouteClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Page() {
  const isAdminPreview = cookies().get("admin_auth")?.value === "1";
  const supabase = createRouteClient();
  const { data } = await supabase.auth.getUser();

  if (!data?.user && !isAdminPreview) redirect("/signin");

  return <SummaryClient />;
}
