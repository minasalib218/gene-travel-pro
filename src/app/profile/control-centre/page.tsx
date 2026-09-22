import { redirect } from "next/navigation";
import { createRouteClient } from "@/lib/supabase/server";
import { isControlCentreFeatureEnabled } from "@/lib/control-centre/featureFlags";
import { listCustomerControlCentreTrips } from "@/lib/control-centre/repository";
import ControlCentreClient from "./ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ControlCentrePage() {
  if (!isControlCentreFeatureEnabled("controlCentre")) redirect("/profile/trips");

  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/signin?next=/profile/control-centre");

  const trips = await listCustomerControlCentreTrips(data.user.id).catch((error) => {
    console.error("ControlCentrePage data error", error);
    return [];
  });

  return <ControlCentreClient name={data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Traveler"} trips={trips} />;
}
