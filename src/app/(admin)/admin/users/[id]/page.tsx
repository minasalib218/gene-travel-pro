import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { withExistingTable } from "@/lib/prisma-safe";

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) notFound();

  const profile = await prisma.profile.findUnique({
    where: { id: params.id },
    include: {
      passes: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" }, take: 10 },
      plans: { orderBy: { createdAt: "desc" }, take: 10 },
      supportTickets: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!profile) notFound();

  const [
    favoritePlans,
    favoriteDestinations,
    bookingClicks,
    reminders,
    preferences,
    creditLedger,
    aiUsage,
    activity,
    analyticsEvents,
    travelDocuments,
  ] = await Promise.all([
    withExistingTable("favorite_plans", () => prisma.favoritePlan.findMany({ where: { userId: params.id }, orderBy: { createdAt: "desc" }, take: 10 }), []),
    withExistingTable("favorite_destinations", () => prisma.favoriteDestination.findMany({ where: { userId: params.id }, orderBy: { createdAt: "desc" }, take: 10 }), []),
    withExistingTable("booking_clicks", () => prisma.bookingClick.findMany({ where: { userId: params.id }, orderBy: { clickedAt: "desc" }, take: 10 }), []),
    withExistingTable("travel_reminders", () => prisma.travelReminder.findMany({ where: { userId: params.id }, orderBy: { reminderDate: "asc" }, take: 10 }), []),
    withExistingTable("travel_preferences", () => prisma.travelPreference.findUnique({ where: { userId: params.id } }), null),
    withExistingTable("credit_ledger", () => prisma.creditLedger.findMany({ where: { userId: params.id }, orderBy: { createdAt: "desc" }, take: 12 }), []),
    withExistingTable("ai_usage_logs", () => prisma.aiUsageLog.findMany({ where: { userId: params.id }, orderBy: { createdAt: "desc" }, take: 10 }), []),
    withExistingTable("user_activity", () => prisma.userActivity.findMany({ where: { userId: params.id }, orderBy: { createdAt: "desc" }, take: 20 }), []),
    withExistingTable(
      "analytics_events",
      () =>
        prisma.analyticsEvent.findMany({
          where: { userId: params.id },
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
      [],
    ),
    withExistingTable("travel_documents", () => prisma.travelDocument.findMany({ where: { userId: params.id, status: { not: "DELETED" } }, orderBy: { createdAt: "desc" }, take: 10 }), []),
  ]);

  const activePass = profile.passes.find((pass) => pass.status === "ACTIVE") ?? profile.passes[0] ?? null;
  const totalMainCredits = activePass ? activePass.mainCreditsTotal || activePass.tierActionsTotal : 0;
  const usedMainCredits = activePass ? activePass.mainCreditsUsed || activePass.tierActionsUsed : 0;
  const successfulPayments = profile.payments.filter((payment) => payment.status === "PAID");
  const revenue = successfulPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const meaningfulTimeline = [
    ...activity.map((event) => ({
      id: `activity-${event.id}`,
      name: event.event,
      category: event.entityType || "Account",
      entityId: event.entityId,
      createdAt: event.createdAt,
      metadata: (event.metadata as Record<string, any> | null) ?? {},
    })),
    ...analyticsEvents.map((event) => ({
      id: `analytics-${event.id}`,
      name: event.eventName,
      category: event.eventCategory || "Analytics",
      entityId: event.readyPlanId || event.itemId || event.planId,
      createdAt: event.createdAt,
      metadata: (event.metadata as Record<string, any> | null) ?? {},
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 30);
  const bookingClickTotal = analyticsEvents.filter((event) => ["booking_link_clicked", "affiliate_redirect_clicked", "booking_button_clicked", "book_now_clicked"].includes(event.eventName)).length + bookingClicks.length;
  const lastActive = meaningfulTimeline[0]?.createdAt ?? profile.updatedAt;
  const acquisitionEvent = analyticsEvents.find((event) => event.utmSource || (event.metadata as any)?.utm_source || (event.metadata as any)?.source);
  const primaryAcquisitionSource = acquisitionEvent?.utmSource || (acquisitionEvent?.metadata as any)?.utm_source || (acquisitionEvent?.metadata as any)?.source || "Unknown";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="User Details"
        title={profile.fullName || profile.email || "Traveler profile"}
        description="A single-user summary spanning passes, payments, plans, and support context."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard>
          <div className="text-sm font-semibold text-white">Profile summary</div>
          <div className="mt-4 space-y-2 text-sm text-white/70">
            <div>Email: {profile.email || "No email"}</div>
            <div>Country: {profile.country || "Not set"}</div>
            <div>Role: {profile.role}</div>
            <div>Joined: {new Date(profile.createdAt).toLocaleString()}</div>
            <div>Updated: {new Date(profile.updatedAt).toLocaleString()}</div>
            <div>Account: {activePass?.status === "ACTIVE" ? "Paid active" : "Registered free"}</div>
            <div>Current package: {activePass?.planType || activePass?.tier || "None"}</div>
            <div>Credits: {Math.max(totalMainCredits - usedMainCredits, 0)} remaining / {totalMainCredits} total</div>
            <div>Revenue/LTV: {revenue.toFixed(2)} {successfulPayments[0]?.currency || "USD"}</div>
            <div>Last active: {new Date(lastActive).toLocaleString()}</div>
            <div>Primary source: {primaryAcquisitionSource}</div>
          </div>
        </AdminCard>
        <AdminCard>
          <div className="text-sm font-semibold text-white">Quick links</div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/admin/users" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
              Back to users
            </Link>
            <Link href="/admin/payments" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
              Open payments
            </Link>
            <Link href="/admin/support" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
              Open support
            </Link>
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <AdminCard>
          <div className="text-sm text-white/55">Favorite plans</div>
          <div className="mt-3 text-3xl font-semibold text-white">{favoritePlans.length}</div>
        </AdminCard>
        <AdminCard>
          <div className="text-sm text-white/55">Saved destinations</div>
          <div className="mt-3 text-3xl font-semibold text-white">{favoriteDestinations.length}</div>
        </AdminCard>
        <AdminCard>
          <div className="text-sm text-white/55">AI plans</div>
          <div className="mt-3 text-3xl font-semibold text-white">{profile.plans.length}</div>
        </AdminCard>
        <AdminCard>
          <div className="text-sm text-white/55">Booking clicks</div>
          <div className="mt-3 text-3xl font-semibold text-white">{bookingClickTotal}</div>
        </AdminCard>
      </div>

      <AdminCard>
        <div className="text-sm font-semibold text-white">Private travel documents</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {travelDocuments.length === 0 ? <div className="text-sm text-white/60">No travel documents saved yet.</div> : travelDocuments.map((document) => (
            <div key={document.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
              <div className="font-semibold text-white">{document.displayName}</div>
              <div className="mt-1">{document.type} · {document.status}</div>
              <div>{document.expiryDate ? `Expires ${new Date(document.expiryDate).toLocaleDateString()}` : "No expiry date"}</div>
            </div>
          ))}
        </div>
      </AdminCard>

      <div className="grid gap-6 xl:grid-cols-3">
        <AdminCard className="xl:col-span-1">
          <div className="text-sm font-semibold text-white">Pass history</div>
          <div className="mt-4 space-y-3">
            {profile.passes.length === 0 ? <div className="text-sm text-white/60">No passes yet.</div> : profile.passes.map((pass) => (
              <div key={pass.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                <div className="font-semibold text-white">{pass.planType || pass.tier}</div>
                <div className="mt-1">Status: {pass.status}</div>
                <div>Main credits: {Math.max((pass.mainCreditsTotal || pass.tierActionsTotal) - (pass.mainCreditsUsed || pass.tierActionsUsed), 0)}</div>
                <div>Edit credits: {Math.max(pass.editCreditsTotal - pass.editCreditsUsed, 0)}</div>
              </div>
            ))}
          </div>
        </AdminCard>
        <AdminCard className="xl:col-span-1">
          <div className="text-sm font-semibold text-white">Recent payments</div>
          <div className="mt-4 space-y-3">
            {profile.payments.length === 0 ? <div className="text-sm text-white/60">No payments yet.</div> : profile.payments.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                <div className="font-semibold text-white">{payment.planType}</div>
                <div className="mt-1">{payment.provider} · {payment.status}</div>
                <div>{payment.amount || 0} {payment.currency || "USD"}</div>
              </div>
            ))}
          </div>
        </AdminCard>
        <AdminCard className="xl:col-span-1">
          <div className="text-sm font-semibold text-white">Recent plans & support</div>
          <div className="mt-4 space-y-3">
            {profile.plans.slice(0, 5).map((plan) => (
              <div key={plan.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                <div className="font-semibold text-white">{plan.title}</div>
                <div className="mt-1">{plan.destination} · {plan.status}</div>
              </div>
            ))}
            {profile.supportTickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                <div className="font-semibold text-white">{ticket.subject || "Support ticket"}</div>
                <div className="mt-1">{ticket.status} · {ticket.priority}</div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard>
          <div className="text-sm font-semibold text-white">Preferences</div>
          <div className="mt-4 space-y-2 text-sm text-white/70">
            {preferences ? (
              <>
                <div>Budget: {preferences.preferredBudgetMin ?? "—"} - {preferences.preferredBudgetMax ?? "—"} {preferences.preferredCurrency || ""}</div>
                <div>Styles: {preferences.travelStyles.length ? preferences.travelStyles.join(", ") : "Not set"}</div>
                <div>Regions: {preferences.preferredRegions.length ? preferences.preferredRegions.join(", ") : "Not set"}</div>
                <div>Hotel: {preferences.hotelPreference || "Not set"}</div>
                <div>Transport: {preferences.preferredTransportation || "Not set"}</div>
              </>
            ) : (
              <div>No saved preferences yet.</div>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-sm font-semibold text-white">Booking activity</div>
          <div className="mt-4 space-y-3">
            {bookingClicks.length === 0 ? <div className="text-sm text-white/60">No booking clicks yet.</div> : bookingClicks.map((click) => (
              <div key={click.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                <div className="font-semibold text-white">{click.itemName}</div>
                <div className="mt-1">{click.provider || "Provider"} · {click.itemType || "item"}</div>
                <div>{new Date(click.clickedAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard>
          <div className="text-sm font-semibold text-white">Credit ledger</div>
          <div className="mt-4 space-y-3">
            {creditLedger.length === 0 ? <div className="text-sm text-white/60">No credit ledger records yet.</div> : creditLedger.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                <div className="font-semibold text-white">{entry.type} · {entry.amount}</div>
                <div className="mt-1">{entry.reason || entry.actionType || "Credit activity"}</div>
                <div>{new Date(entry.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-sm font-semibold text-white">AI usage</div>
          <div className="mt-4 space-y-3">
            {aiUsage.length === 0 ? <div className="text-sm text-white/60">No AI usage yet.</div> : aiUsage.map((usage) => (
              <div key={usage.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                <div className="font-semibold text-white">{usage.actionType}</div>
                <div className="mt-1">{usage.status} · {usage.model || "model not recorded"}</div>
                <div>{new Date(usage.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard>
          <div className="text-sm font-semibold text-white">Reminders</div>
          <div className="mt-4 space-y-3">
            {reminders.length === 0 ? <div className="text-sm text-white/60">No reminders yet.</div> : reminders.map((reminder) => (
              <div key={reminder.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                <div className="font-semibold text-white">{reminder.title}</div>
                <div className="mt-1">{reminder.reminderType} · {reminder.status}</div>
                <div>{new Date(reminder.reminderDate).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-sm font-semibold text-white">Activity timeline</div>
          <div className="mt-4 space-y-3">
            {meaningfulTimeline.length === 0 ? <div className="text-sm text-white/60">No tracked activity yet.</div> : meaningfulTimeline.map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                <div className="font-semibold text-white">{event.name.replaceAll("_", " ")}</div>
                <div className="mt-1">{event.category}{event.entityId ? ` · ${event.entityId}` : ""}</div>
                {event.metadata?.contentName || event.metadata?.title || event.metadata?.itemTitle ? (
                  <div className="mt-1 text-white/55">{event.metadata.contentName || event.metadata.title || event.metadata.itemTitle}</div>
                ) : null}
                <div>{new Date(event.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
