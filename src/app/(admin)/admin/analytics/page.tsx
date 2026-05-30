import Link from "next/link";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getAdminAnalyticsSnapshot } from "@/lib/analytics-server";

export const dynamic = "force-dynamic";

type SearchParams = {
  range?: string;
  country?: string;
  source?: string;
  device?: string;
  from?: string;
  to?: string;
};

function getDateWindow(params: SearchParams) {
  const now = new Date();
  const range = params.range || "7d";

  if (range === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { from: start, to: now };
  }

  if (range === "30d") {
    return { from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), to: now };
  }

  if (range === "custom" && params.from && params.to) {
    const from = new Date(params.from);
    const to = new Date(params.to);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
      return { from, to: new Date(to.getTime() + 24 * 60 * 60 * 1000) };
    }
  }

  return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), to: now };
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function FilterLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3.5 py-2 text-xs font-medium transition ${
        active
          ? "border-[#ff7a00]/40 bg-[#ff7a00]/12 text-[#ffbf82]"
          : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <AdminCard className="rounded-[24px] p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-white/56">{note}</div>
    </AdminCard>
  );
}

function SimpleTable({
  title,
  rows,
  valueLabel = "Events",
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
  valueLabel?: string;
}) {
  return (
    <AdminCard>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="text-xs text-white/45">{valueLabel}</div>
      </div>
      <div className="mt-4 space-y-3">
        {rows.length ? (
          rows.map((row) => (
            <div key={`${title}-${row.label}`} className="grid grid-cols-[minmax(0,1fr)_72px] items-center gap-4">
              <div className="truncate text-sm text-white/76">{row.label}</div>
              <div className="text-right text-sm font-medium text-[#ffbf82]">{row.value}</div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/48">
            No data in this range yet.
          </div>
        )}
      </div>
    </AdminCard>
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const dateWindow = getDateWindow(searchParams);
  const snapshot = await getAdminAnalyticsSnapshot({
    dateFrom: dateWindow.from,
    dateTo: dateWindow.to,
    country: searchParams.country || null,
    source: searchParams.source || null,
    device: searchParams.device || null,
  });

  const metrics = snapshot.metrics;
  const range = searchParams.range || "7d";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Growth, funnel, and conversion intelligence"
        description="Track visitors, countries, purchases, funnel steps, booking clicks, and customer behavior without changing the public Gene experience."
      />

      <AdminCard className="rounded-[24px]">
        <div className="flex flex-wrap items-center gap-2">
          <FilterLink href="/admin/analytics?range=today" active={range === "today"}>Today</FilterLink>
          <FilterLink href="/admin/analytics?range=7d" active={range === "7d"}>Last 7 days</FilterLink>
          <FilterLink href="/admin/analytics?range=30d" active={range === "30d"}>Last 30 days</FilterLink>
          <FilterLink href="/admin/analytics?range=custom&from=2026-05-01&to=2026-05-26" active={range === "custom"}>Custom range</FilterLink>
          <FilterLink href="/admin/settings/analytics">Analytics settings</FilterLink>
        </div>
        <div className="mt-4 text-sm text-white/55">
          Window: {dateWindow.from.toLocaleDateString()} - {new Date(dateWindow.to.getTime() - 1).toLocaleDateString()}
          {searchParams.country ? ` • Country: ${searchParams.country}` : ""}
          {searchParams.source ? ` • Source: ${searchParams.source}` : ""}
          {searchParams.device ? ` • Device: ${searchParams.device}` : ""}
        </div>
      </AdminCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Visitors" value={metrics.totalVisitors.toLocaleString()} note={`${metrics.uniqueSessions.toLocaleString()} unique sessions`} />
        <MetricCard label="Countries" value={metrics.countries.toLocaleString()} note={`${metrics.pageViews.toLocaleString()} tracked page views`} />
        <MetricCard label="Purchases" value={metrics.purchases.toLocaleString()} note={`${money(metrics.revenue)} revenue`} />
        <MetricCard label="Conversion Rate" value={percent(metrics.conversionRate)} note={`${percent(metrics.checkoutConversionRate)} checkout conversion`} />
        <MetricCard label="AI Planner Completion" value={percent(metrics.plannerCompletionRate)} note={`${metrics.plannerCompletions.toLocaleString()} completed planner submissions`} />
        <MetricCard label="Booking Click Rate" value={percent(metrics.bookingClickRate)} note={`${metrics.bookingClicks.toLocaleString()} booking CTA clicks`} />
        <MetricCard label="Bounce Estimate" value={percent(metrics.bounceRateEstimate)} note="Sessions that did not advance into the planner funnel" />
        <MetricCard label="Avg Session Time" value={`${metrics.averageSessionTimeEstimate}s`} note={`${metrics.affiliateClicks.toLocaleString()} affiliate redirects • ${metrics.paymentFailures.toLocaleString()} payment failures`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SimpleTable title="Visitors by Day" rows={snapshot.visitorsByDay.map((row) => ({ label: row.day, value: Number(row.value) }))} valueLabel="Visits" />
        <SimpleTable title="Visitors by Country" rows={snapshot.visitorsByCountry.map((row) => ({ label: row.label, value: Number(row.value) }))} valueLabel="Visits" />
        <SimpleTable title="Top Pages" rows={snapshot.topPages.map((row) => ({ label: row.label, value: Number(row.value) }))} valueLabel="Views" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SimpleTable title="Top Referrers" rows={snapshot.topReferrers.map((row) => ({ label: row.label, value: Number(row.value) }))} />
        <SimpleTable title="Funnel Drop-off" rows={snapshot.funnelDropoff.map((row) => ({ label: row.label, value: Number(row.value) }))} />
        <SimpleTable title="Purchases by Package" rows={snapshot.purchasesByPackage.map((row) => ({ label: row.label, value: Number(row.value) }))} valueLabel="Purchases" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SimpleTable title="Top Clicked Ready Plans" rows={snapshot.topReadyPlans.map((row) => ({ label: row.label, value: Number(row.value) }))} />
        <SimpleTable title="Top Clicked Destinations" rows={snapshot.topDestinations.map((row) => ({ label: row.label, value: Number(row.value) }))} />
        <SimpleTable title="Top Clicked Offers" rows={snapshot.topOffers.map((row) => ({ label: row.label, value: Number(row.value) }))} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SimpleTable title="Top Clicked Events" rows={snapshot.topEvents.map((row) => ({ label: row.label, value: Number(row.value) }))} />
        <SimpleTable title="Top Affiliate Clicks" rows={snapshot.topAffiliateClicks.map((row) => ({ label: row.label, value: Number(row.value) }))} />
        <SimpleTable title="Device Breakdown" rows={snapshot.deviceBreakdown.map((row) => ({ label: row.label, value: Number(row.value) }))} />
      </div>

      <SimpleTable title="Behavior Events" rows={snapshot.userBehavior.map((row) => ({ label: row.label, value: Number(row.value) }))} valueLabel="Events" />
    </div>
  );
}
