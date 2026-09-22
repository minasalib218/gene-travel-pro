import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { withDatabaseFallback } from "@/lib/prisma-safe";
import ReadyPlanFavoriteButton from "@/components/ready-plan/ReadyPlanFavoriteButton";

export async function PublishedReadyPlansRail() {
  const plans = await withDatabaseFallback(
    () =>
      prisma.readyPlan.findMany({
        where: { status: "PUBLISHED", showOnHome: true },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
    [],
  );

  if (!plans.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-white/45">Gene Travel</div>
          <h2 className="mt-2 text-[28px] font-semibold text-white sm:text-3xl">Published Ready Plans</h2>
        </div>
        <Link href="/ready-plans" className="text-sm text-white/70 hover:text-white">
          View all
        </Link>
      </div>

      <div className="scrollbar-hide -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:snap-none md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3">
        {plans.map((plan) => (
          <Link key={plan.id} href={`/ready-plans/${plan.slug}`} className="min-w-[82vw] max-w-[320px] snap-start overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.04] transition hover:-translate-y-1 hover:bg-white/[0.07] sm:rounded-[28px] md:min-w-0 md:max-w-none">
            <div className="relative h-48 w-full sm:h-64">
              {plan.heroImage ? (
                <Image
                  src={plan.heroImage}
                  alt={plan.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  quality={82}
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.15),transparent_30%),linear-gradient(180deg,#171717,#0b0b0b)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <ReadyPlanFavoriteButton
                readyPlanId={plan.id}
                className="absolute right-3 top-3 z-20 h-11 w-11 md:right-4 md:top-4"
              />
              <div className="absolute left-4 top-4 rounded-full border border-[#ff7a00]/55 bg-[#ff7a00]/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_0_18px_rgba(255,122,0,0.28)] backdrop-blur-md">
                Original
              </div>
            </div>
            <div className="p-4 text-white sm:p-5">
              <div className="text-lg font-semibold">{plan.title}</div>
              {plan.subtitle ? <div className="mt-1 text-sm text-white/60">{plan.subtitle}</div> : null}
              <div className="mt-4 flex flex-col gap-1 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
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
