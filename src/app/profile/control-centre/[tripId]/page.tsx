import { notFound, redirect } from "next/navigation";
import { createRouteClient } from "@/lib/supabase/server";
import { getControlCentreWorkspace } from "@/lib/control-centre/repository";
import TripWorkspaceClient from "./ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TripWorkspacePage({ params }: { params: { tripId: string } }) {
  const supabase = createRouteClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/signin?next=/profile/control-centre/${params.tripId}`);
  const workspace = await getControlCentreWorkspace(data.user.id, params.tripId).catch(() => null);
  if (!workspace) notFound();
  return <TripWorkspaceClient initial={workspace} />;
}
