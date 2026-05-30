import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { withDatabaseFallback } from "@/lib/prisma-safe";

export async function PublishedReadyPlansRail() {
  const plans = await withDatabaseFallback(
    () =>
      prisma.readyPlan.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
    [],
  );

  if (!plans.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-white/45">Gene Travel</div>
          <h2 className="mt-2 text-3xl font-semibold text-white">Published Ready Plans</h2>
        </div>
        <Link href="/ready-plans" className="text-sm text-white/70 hover:text-white">
          View all
        </Link>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <Link key={plan.id} href={`/ready-plans/${plan.slug}`} className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] transition hover:-translate-y-1 hover:bg-white/[0.07]">
            <div className="relative h-64 w-full">
              {plan.heroImage ? (
                <img src={plan.heroImage} alt={plan.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.15),transparent_30%),linear-gradient(180deg,#171717,#0b0b0b)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            </div>
            <div className="p-5 text-white">
              <div className="text-lg font-semibold">{plan.title}</div>
              {plan.subtitle ? <div className="mt-1 text-sm text-white/60">{plan.subtitle}</div> : null}
              <div className="mt-4 flex items-center justify-between text-sm text-white/70">
                <span>{plan.destination}</span>
                <span>{plan.priceFrom ? `${plan.priceFrom} ${plan.currency}` : "Contact"}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
