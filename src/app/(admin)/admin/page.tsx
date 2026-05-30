import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminCard } from "@/components/admin/AdminCard";
import { withExistingTable } from "@/lib/prisma-safe";

function QuickLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.18))] p-5 transition hover:-translate-y-1 hover:bg-white/[0.08]"
    >
      <div className="text-xs uppercase tracking-[0.25em] text-[#ffb066]">Console</div>
      <div className="mt-3 text-xl font-semibold text-white">{label}</div>
      <p className="mt-2 text-sm leading-7 text-white/62">{description}</p>
    </Link>
  );
}

export default async function AdminOverviewPage() {
  const [
    totalUsers,
    paidUsers,
    activePasses,
    revenueResult,
    aiCreditsUsed,
    aiUsageResult,
    failedPayments,
    failedAiRequests,
    supportCount,
    visitors,
    affiliateClicks,
    topDestinations,
    topReadyPlans,
  ] = await Promise.all([
    prisma.profile.count().catch(() => 0),
    withExistingTable("passes", () => prisma.pass.count({ where: { status: "ACTIVE" } }), 0),
    withExistingTable("passes", () => prisma.pass.count({ where: { status: "ACTIVE" } }), 0),
    withExistingTable("payments", () => prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }), { _sum: { amount: 0 } }),
    withExistingTable("credit_ledger", () => prisma.creditLedger.aggregate({ where: { type: "CREDIT_USED" }, _sum: { amount: true } }), { _sum: { amount: 0 } }),
    withExistingTable("ai_usage_logs", () => prisma.aiUsageLog.aggregate({ _sum: { estimatedCost: true } }), { _sum: { estimatedCost: 0 } }),
    withExistingTable("payments", () => prisma.payment.count({ where: { status: "FAILED" } }), 0),
    withExistingTable("ai_usage_logs", () => prisma.aiUsageLog.count({ where: { status: { not: "SUCCESS" } } }), 0),
    withExistingTable("support_tickets", () => prisma.supportTicket.count({ where: { status: "OPEN" } }), 0),
    withExistingTable("traffic_events", () => prisma.trafficEvent.count(), 0),
    withExistingTable("traffic_events", () => prisma.trafficEvent.count({ where: { eventType: "AFFILIATE_BOOKING_CLICK" } }), 0),
    withExistingTable("ready_plans", () => prisma.readyPlan.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, destination: true, updatedAt: true },
    }), []),
    withExistingTable<Array<{ refId: string; _count: { refId: number } }>>(
      "saved_items",
      () =>
        prisma.savedItem.groupBy({
          by: ["refId"],
          where: { kind: "READY_PLAN" },
          _count: true,
          orderBy: { _count: { refId: "desc" } },
          take: 5,
        }) as any,
      [],
    ),
  ]);

  const revenue = Number(revenueResult._sum.amount || 0);
  const estimatedAiCost = Number(aiUsageResult._sum.estimatedCost || 0);
  const creditsUsed = Math.abs(Number(aiCreditsUsed._sum.amount || 0));
  const estimatedProfit = Math.max(revenue - estimatedAiCost, 0);
  const conversionRate = visitors > 0 ? ((paidUsers / visitors) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Dashboard"
        title="Gene business control panel"
        description="A high-level view of users, passes, revenue, AI cost, support pressure, affiliate activity, and the content inventory driving the public site."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard label="Total users" value={totalUsers} hint="All profiles in the system" />
        <AdminStatCard label="Paid users" value={paidUsers} hint="Customers with active passes" />
        <AdminStatCard label="Active passes" value={activePasses} hint="Current planning access" />
        <AdminStatCard label="Revenue" value={`$${revenue.toFixed(0)}`} hint="Paid payment total" />
        <AdminStatCard label="AI credits used" value={creditsUsed} hint="Tracked credit usage" />
        <AdminStatCard label="AI cost" value={`$${estimatedAiCost.toFixed(2)}`} hint="Estimated AI spend" />
        <AdminStatCard label="Profit est." value={`$${estimatedProfit.toFixed(2)}`} hint="Revenue minus AI cost" />
        <AdminStatCard label="Failed payments" value={failedPayments} hint="Payments that did not complete" />
        <AdminStatCard label="AI/API failures" value={failedAiRequests} hint="Logged AI failures" />
        <AdminStatCard label="Open support" value={supportCount} hint="Tickets still unresolved" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminCard>
          <div className="text-xs uppercase tracking-[0.28em] text-[#ffb066]">Business pulse</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">Daily visitors</div>
              <div className="mt-2 text-3xl font-semibold text-white">{visitors}</div>
              <div className="mt-2 text-sm text-white/60">Traffic events currently tracked.</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">Conversion rate</div>
              <div className="mt-2 text-3xl font-semibold text-white">{conversionRate}%</div>
              <div className="mt-2 text-sm text-white/60">Paid users vs tracked visitors.</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">Affiliate clicks</div>
              <div className="mt-2 text-3xl font-semibold text-white">{affiliateClicks}</div>
              <div className="mt-2 text-sm text-white/60">Internal redirect clicks captured by Gene.</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">Most used ready plans</div>
              <div className="mt-2 text-3xl font-semibold text-white">{topReadyPlans.length}</div>
              <div className="mt-2 text-sm text-white/60">Top saved ready-plan records.</div>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-xs uppercase tracking-[0.28em] text-[#ffb066]">Quick control links</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <QuickLink href="/admin/users" label="Users" description="Profiles, plan access, block status, and quick credit actions." />
            <QuickLink href="/admin/payments" label="Payments" description="Transactions, providers, statuses, and webhook visibility." />
            <QuickLink href="/admin/passes" label="Pass controls" description="Inspect active passes and package defaults." />
            <QuickLink href="/admin/ready-plans" label="Ready Plans" description="Manage cinematic travel inventory and featured plan content." />
            <QuickLink href="/admin/affiliate-links" label="Affiliate Links" description="Track internal redirect URLs and click performance." />
            <QuickLink href="/admin/ai-monitoring" label="AI Monitoring" description="Review tokens, cost, failures, and rate-limit pressure." />
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard>
          <div className="text-sm font-semibold text-white">Most requested destinations</div>
          <div className="mt-4 space-y-3">
            {topDestinations.length === 0 ? (
              <div className="text-sm text-white/60">No published destinations yet.</div>
            ) : (
              topDestinations.map((destination) => (
                <div key={destination.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div className="font-semibold text-white">{destination.title}</div>
                  <div className="mt-1 text-sm text-white/60">{destination.destination}</div>
                </div>
              ))
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-sm font-semibold text-white">Most used ready plans</div>
          <div className="mt-4 space-y-3">
            {topReadyPlans.length === 0 ? (
              <div className="text-sm text-white/60">No saved ready plan activity yet.</div>
            ) : (
              topReadyPlans.map((plan) => (
                <div key={plan.refId} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div className="font-semibold text-white">{plan.refId}</div>
                  <div className="mt-1 text-sm text-white/60">Saved {plan._count.refId} times</div>
                </div>
              ))
            )}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
