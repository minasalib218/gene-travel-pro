import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
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
    </div>
  );
}
