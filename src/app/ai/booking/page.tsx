import ProtectedAI from "@/components/ProtectedAI";
import BookingClient from "@/app/ai/booking/ui";
import { isAdmin } from "@/lib/access/canUseAi";
import { createRouteClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function BookingPage() {
  const supabase = createRouteClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  const envAdmin = cookies().get("admin_auth")?.value === "1";

  if (!user && !envAdmin) redirect("/signin");
  if (envAdmin) return <BookingClient />;
  if (user && (await isAdmin(user.id))) return <BookingClient />;

  return (
    <ProtectedAI>
      <BookingClient />
    </ProtectedAI>
  );
}
