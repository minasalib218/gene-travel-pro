"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminMutationButton } from "@/components/admin/AdminMutationButton";

type AdminUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  planType: string | null;
  mainCreditsRemaining: number;
  editCreditsRemaining: number;
  passExpiresAt: string | null;
  paymentStatus: string;
  plansCreated: number;
  createdAt: string;
  lastActiveAt: string;
  blocked: boolean;
  passStatus: string;
};

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);

  async function loadUsers(nextQuery = "") {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users${nextQuery ? `?q=${encodeURIComponent(nextQuery)}` : ""}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.code || "Could not load users");
      setUsers(data.users ?? []);
    } catch (err: any) {
      setError(err?.message || "Could not load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const stats = useMemo(() => {
    const paidUsers = users.filter((user) => user.planType && user.passStatus === "ACTIVE").length;
    const blockedUsers = users.filter((user) => user.blocked).length;
    return { total: users.length, paidUsers, blockedUsers };
  }, [users]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Users"
        title="Customer accounts, passes, and limits"
        description="Search users, review the plan they bought, inspect remaining credits, and apply safe admin-only actions without touching the public site."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatCard label="Total users" value={stats.total} hint="All traveler profiles" />
        <AdminStatCard label="Paid users" value={stats.paidUsers} hint="Customers with an active pass" />
        <AdminStatCard label="Blocked users" value={stats.blockedUsers} hint="Accounts blocked in admin controls" />
      </div>

      <AdminCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Search users</div>
            <div className="mt-1 text-sm text-white/60">Find people by email or name.</div>
          </div>
          <form
            className="flex w-full max-w-xl gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              loadUsers(query);
            }}
          >
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search email or name"
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
            />
            <button className="rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-semibold text-black">Search</button>
          </form>
        </div>
      </AdminCard>

      {loading ? <AdminCard><div className="text-sm text-white/60">Loading users…</div></AdminCard> : null}
      {error ? <AdminCard><div className="text-sm text-red-200">{error}</div></AdminCard> : null}
      {!loading && !error && users.length === 0 ? (
        <AdminCard>
          <div className="text-sm text-white/60">No users found.</div>
        </AdminCard>
      ) : null}

      {!loading && !error && users.length > 0 ? (
        <AdminTable
          headers={[
            "User",
            "Package",
            "Credits remaining",
            "Pass expiration",
            "Plans",
            "Payment",
            "Last active",
            "Status",
            "Actions",
          ]}
          rows={users.map((user) => [
            <div key={`${user.id}-identity`}>
              <div className="font-semibold text-white">{user.fullName || "Unnamed traveler"}</div>
              <div className="mt-1 text-sm text-white/60">{user.email || "No email"}</div>
              <div className="mt-2">
                <Link href={`/admin/users/${user.id}`} className="text-xs text-[#ffbf82] hover:text-white">
                  View details
                </Link>
              </div>
            </div>,
            <div key={`${user.id}-package`} className="text-sm text-white/75">
              {user.planType || "Free"}
            </div>,
            <div key={`${user.id}-credits`} className="space-y-1 text-sm text-white/75">
              <div>Main: {user.mainCreditsRemaining}</div>
              <div>Edit: {user.editCreditsRemaining}</div>
            </div>,
            <div key={`${user.id}-expires`} className="text-sm text-white/75">
              {user.passExpiresAt ? new Date(user.passExpiresAt).toLocaleDateString() : "No active pass"}
            </div>,
            <div key={`${user.id}-plans`} className="text-sm text-white/75">{user.plansCreated}</div>,
            <div key={`${user.id}-payment`} className="text-sm text-white/75">{user.paymentStatus}</div>,
            <div key={`${user.id}-last-active`} className="text-sm text-white/75">
              {new Date(user.lastActiveAt).toLocaleDateString()}
            </div>,
            <div key={`${user.id}-status`}>
              <span className={`rounded-full px-3 py-1 text-xs ${user.blocked ? "bg-red-500/20 text-red-100" : "bg-emerald-500/20 text-emerald-100"}`}>
                {user.blocked ? "Blocked" : "Active"}
              </span>
            </div>,
            <div key={`${user.id}-actions`} className="flex flex-wrap gap-2">
              <AdminMutationButton
                endpoint={`/api/admin/users/${user.id}/actions`}
                payload={{ action: user.blocked ? "UNBLOCK" : "BLOCK" }}
                label={user.blocked ? "Unblock" : "Block"}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80"
              />
              <AdminMutationButton
                endpoint={`/api/admin/users/${user.id}/actions`}
                payload={{ action: "ADD_CREDITS", amount: 1, reason: "Admin quick credit add" }}
                label="+1 credit"
                className="rounded-full border border-[#ffb066]/30 bg-[#ff7a00]/10 px-3 py-1 text-xs text-[#ffbf82]"
              />
              <AdminMutationButton
                endpoint={`/api/admin/users/${user.id}/actions`}
                payload={{ action: "EXTEND_PASS", days: 7, reason: "Admin quick pass extension" }}
                label="+7 days"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80"
              />
            </div>,
          ])}
        />
      ) : null}
    </div>
  );
}
