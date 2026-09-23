import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import AffiliateWidgetHub from "@/components/planning/AffiliateWidgetHub";
import GeneLogo from "@/components/brand/GeneLogo";
import ProfileSidebarNav from "@/components/profile/ProfileSidebarNav";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";
import { createRouteClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CreatePlanPage() {
  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) redirect("/signin?next=/profile/create-plan");
  await ensureUserProfile(data.user);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] shrink-0 border-r border-white/10 bg-[#07111a]/96 lg:block">
          <div className="sticky top-0 flex h-screen flex-col overflow-y-auto">
            <Link href="/" className="px-9 pb-6 pt-5">
              <GeneLogo imageClassName="h-auto w-[150px]" priority />
            </Link>
            <ProfileSidebarNav createPlanHref="/profile/create-plan" activePage="create-plan" />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07111a]/88 backdrop-blur-xl">
            <div className="mx-auto flex min-h-[64px] max-w-7xl items-center justify-between gap-3 px-3 sm:px-5 lg:px-8">
              <Link href="/profile" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm text-white/75 transition hover:text-white">
                <ArrowLeft size={18} /> Profile
              </Link>
              <Link href="/ai-planner" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ff7a00] px-4 text-sm font-bold text-white transition hover:bg-[#ff8d25]">
                <Sparkles size={17} /> AI Planner
              </Link>
            </div>
          </header>

          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.16),transparent_35%)]" />
            <AffiliateWidgetHub />
          </div>
        </div>
      </div>
    </main>
  );
}
