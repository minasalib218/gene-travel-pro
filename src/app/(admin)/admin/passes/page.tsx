"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminMutationButton } from "@/components/admin/AdminMutationButton";

type PlanConfig = {
  active: boolean;
  price: number;
  currency: string;
  packageName?: string;
  mainCreditsTotal: number;
  editCreditsTotal: number;
  expiresInDays: number;
  whatIfFreeTotal: number;
  chatMessagesTotal: number | null;
  expertReviewTotal: number;
  dailyMainAiLimit: number;
  cooldownSeconds: number;
  monthlyTokenLimit: number;
};

function planLabel(key: string, config?: Partial<PlanConfig>) {
  return config?.packageName || (key === "starter" ? "BASIC" : key.toUpperCase());
}

export default function AdminPassesPage() {
  const [passes, setPasses] = useState<any[]>([]);
  const [planConfigs, setPlanConfigs] = useState<Record<string, PlanConfig> | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(nextQuery = "") {
    setLoading(true);
    const response = await fetch(`/api/admin/passes${nextQuery ? `?q=${encodeURIComponent(nextQuery)}` : ""}`, { cache: "no-store" });
    const data = await response.json();
    setPasses(data.passes ?? []);
    setPlanConfigs(data.planConfigs ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Passes"
        title="Pass controls and package rules"
        description="Inspect individual passes, adjust edit access, expire/reactivate passes, and review the package defaults used by Gene."
      />

      <AdminCard>
        <form
          className="flex gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            load(query);
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by customer email"
            className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white"
          />
          <button className="rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-semibold text-black">Search</button>
        </form>
      </AdminCard>

      <div className="grid gap-4 xl:grid-cols-3">
        {planConfigs ? Object.entries(planConfigs).map(([key, config]) => (
          <AdminCard key={key}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-xl font-semibold text-white">{planLabel(key, config)}</div>
              <span className={`rounded-full px-3 py-1 text-xs ${config.active ? "bg-emerald-500/20 text-emerald-100" : "bg-white/10 text-white/70"}`}>
                {config.active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-4 space-y-2 text-sm text-white/70">
              <label className="block">
                <div className="mb-1 text-xs text-white/45">Price</div>
                <input
                  value={config.price}
                  onChange={(event) =>
                    setPlanConfigs((current) =>
                      current ? { ...current, [key]: { ...current[key], price: Number(event.target.value) || 0 } } : current,
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-xs text-white/45">Main credits</div>
                <input
                  value={config.mainCreditsTotal}
                  onChange={(event) =>
                    setPlanConfigs((current) =>
                      current ? { ...current, [key]: { ...current[key], mainCreditsTotal: Number(event.target.value) || 0 } } : current,
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-xs text-white/45">Edit credits</div>
                <input
                  value={config.editCreditsTotal}
                  onChange={(event) =>
                    setPlanConfigs((current) =>
                      current ? { ...current, [key]: { ...current[key], editCreditsTotal: Number(event.target.value) || 0 } } : current,
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-xs text-white/45">Expiry days</div>
                <input
                  value={config.expiresInDays}
                  onChange={(event) =>
                    setPlanConfigs((current) =>
                      current ? { ...current, [key]: { ...current[key], expiresInDays: Number(event.target.value) || 0 } } : current,
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-xs text-white/45">AI limit / day</div>
                <input
                  value={config.dailyMainAiLimit}
                  onChange={(event) =>
                    setPlanConfigs((current) =>
                      current ? { ...current, [key]: { ...current[key], dailyMainAiLimit: Number(event.target.value) || 0 } } : current,
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-xs text-white/45">Cooldown seconds</div>
                <input
                  value={config.cooldownSeconds}
                  onChange={(event) =>
                    setPlanConfigs((current) =>
                      current ? { ...current, [key]: { ...current[key], cooldownSeconds: Number(event.target.value) || 0 } } : current,
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
                />
              </label>
            </div>
            <button
              onClick={async () => {
                if (!planConfigs) return;
                await fetch("/api/admin/passes", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "SAVE_PLAN_CONFIGS", planConfigs }),
                });
                await load(query);
              }}
              className="mt-4 rounded-full bg-[#ff7a00] px-4 py-2 text-sm font-semibold text-black"
            >
              Save changes
            </button>
          </AdminCard>
        )) : null}
      </div>

      {loading ? <AdminCard><div className="text-sm text-white/60">Loading passes…</div></AdminCard> : null}

      {!loading ? (
        <AdminTable
          headers={["Customer", "Plan", "Credits", "Expiry", "Status", "Actions"]}
          rows={passes.map((pass) => [
            <div key={`${pass.id}-customer`}>
              <div className="font-semibold text-white">{pass.profile?.fullName || pass.customerEmail || "Unknown customer"}</div>
              <div className="mt-1 text-sm text-white/60">{pass.profile?.email || pass.customerEmail || "No email"}</div>
            </div>,
            <div key={`${pass.id}-plan`} className="text-sm text-white/75">{planLabel(pass.planType || pass.tier, pass.planType ? { packageName: pass.planType } : undefined)}</div>,
            <div key={`${pass.id}-credits`} className="space-y-1 text-sm text-white/75">
              <div>Main: {Math.max((pass.mainCreditsTotal || pass.tierActionsTotal) - (pass.mainCreditsUsed || pass.tierActionsUsed), 0)}</div>
              <div>Edit: {Math.max(pass.editCreditsTotal - pass.editCreditsUsed, 0)}</div>
            </div>,
            <div key={`${pass.id}-expiry`} className="text-sm text-white/75">{pass.expiresAt ? new Date(pass.expiresAt).toLocaleDateString() : "No expiry"}</div>,
            <div key={`${pass.id}-status`} className="text-sm text-white/75">{pass.status}</div>,
            <div key={`${pass.id}-actions`} className="flex flex-wrap gap-2">
              <AdminMutationButton
                endpoint="/api/admin/passes"
                payload={{ action: "ADD_EDIT_CREDITS", passId: pass.id, amount: 1, reason: "Admin quick add" }}
                label="+1 edit"
                className="rounded-full border border-[#ffb066]/30 bg-[#ff7a00]/10 px-3 py-1 text-xs text-[#ffbf82]"
              />
              <AdminMutationButton
                endpoint="/api/admin/passes"
                payload={{ action: "EXPIRE_PASS", passId: pass.id }}
                label="Expire"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80"
              />
              <AdminMutationButton
                endpoint="/api/admin/passes"
                payload={{ action: "REACTIVATE_PASS", passId: pass.id, days: 30 }}
                label="Reactivate"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80"
              />
            </div>,
          ])}
        />
      ) : null}
    </div>
  );
}
