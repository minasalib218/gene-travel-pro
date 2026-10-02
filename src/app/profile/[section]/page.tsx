import { notFound, redirect } from "next/navigation";
import ProfilePageShell from "@/components/profile/ProfilePageShell";
import ProfileSectionView from "@/components/profile/ProfileSectionView";
import { getProfileDashboardData } from "@/lib/profile/getProfileDashboardData";
import { createRouteClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const sections: Record<string, string> = {
  favorites: "favorite-plans", credits: "my-credits", offers: "special-offers", checklist: "checklist",
  calendar: "calendar", preferences: "travel-preferences", documents: "travel-documents",
  notifications: "notifications", support: "support", security: "account-security",
};

export default async function ProfileSectionPage({ params }: { params: { section: string } }) {
  const activePage = sections[params.section];
  if (!activePage) notFound();
  const supabase = createRouteClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) redirect(`/signin?next=/profile/${params.section}`);
  const data = await getProfileDashboardData();
  if (!data) throw new Error("Authenticated profile data is temporarily unavailable.");
  return <ProfilePageShell profile={data.profile} unreadCount={data.unreadNotificationsCount || 0} activePage={activePage}><ProfileSectionView section={params.section} data={data} /></ProfilePageShell>;
}
