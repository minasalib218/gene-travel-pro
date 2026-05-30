import Navbar from "@/components/Navbar";
import LocalizedText from "@/components/i18n/LocalizedText";
import { CinematicCard } from "@/components/CinematicCards";
import { prisma } from "@/lib/db/client";
import { withDatabaseFallback } from "@/lib/prisma-safe";

export const dynamic = "force-dynamic";

export default async function ReadyPlansPage() {
  let plans: Awaited<ReturnType<typeof prisma.readyPlan.findMany>> = [];
  let dbError: string | null = null;

  try {
    plans = await withDatabaseFallback(
      () =>
        prisma.readyPlan.findMany({
          where: { status: "PUBLISHED" },
          orderBy: { updatedAt: "desc" },
        }),
      [],
    );
  } catch (error: any) {
    dbError = error?.message || "Unknown database error";
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.18),transparent_30%),linear-gradient(180deg,#161616_0%,#090909_55%,#050505_100%)]" />
      <Navbar />

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-32 md:px-8">
        <div className="rounded-[36px] border border-white/10 bg-white/[0.05] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.28em] text-[#ffb066]">
              <LocalizedText tKey="readyPlans.badge" fallback="Ready Plans Library" />
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">
              <LocalizedText tKey="readyPlans.title" fallback="Browse cinematic trip blueprints before you start customizing." />
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/70 md:text-base">
              <LocalizedText tKey="readyPlans.description" fallback="Ready Plans are polished destination concepts with a stronger visual narrative, a clearer itinerary angle, and a direct jump into the planning experience." />
            </p>
          </div>

          {dbError ? (
            <div className="mt-8 rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
              <p className="font-semibold">Database connection error</p>
              <pre className="mt-3 whitespace-pre-wrap text-sm">{dbError}</pre>
            </div>
          ) : null}

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <CinematicCard
                key={plan.id}
                href={`/ready-plans/${encodeURIComponent(String(plan.slug ?? plan.id))}`}
                title={plan.title}
                subtitle={`${plan.destination} | ${Number(plan.daysCount ?? 0)} days`}
                imageUrl={plan.heroImage || plan.coverImage || undefined}
                rightMeta={
                  <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
                    {plan.priceFrom ? `From ${plan.priceFrom} ${plan.currency}` : "Open"}
                  </div>
                }
              />
            ))}

            {!dbError && plans.length === 0 ? (
              <div className="rounded-[30px] border border-white/10 bg-black/25 p-6 text-sm text-white/65">
                <LocalizedText tKey="readyPlans.empty" fallback="No published ready plans yet. Save one from the admin dashboard and set its status to Published to make it appear here." />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
