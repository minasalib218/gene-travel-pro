"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { ReadyPlanRecord } from "./ReadyPlansEditor";

async function mutatePlan(id: string, body: Record<string, unknown>) {
  const response = await fetch(`/api/admin/ready-plans/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.code || "SAVE_FAILED");
  }
}

async function removePlan(id: string) {
  const response = await fetch(`/api/admin/ready-plans/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.code || "DELETE_FAILED");
  }
}

export default function ReadyPlansList({
  initialPlans,
  eyebrow = "Ready Plans List",
  title = "Manage plans from one clean list.",
  description = "Create and edit on separate screens. Use this page only to review plans and trigger quick actions.",
  createHref = "/admin/ready-plans/create",
  createLabel = "Create Ready Plan",
  editBasePath = "/admin/ready-plans",
}: {
  initialPlans: ReadyPlanRecord[];
  eyebrow?: string;
  title?: string;
  description?: string;
  createHref?: string;
  createLabel?: string;
  editBasePath?: string;
}) {
  const [plans, setPlans] = useState(initialPlans);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateStatus(id: string, status: "DRAFT" | "PUBLISHED") {
    startTransition(async () => {
      try {
        await mutatePlan(id, { status });
        setPlans((current) => current.map((plan) => (plan.id === id ? { ...plan, status } : plan)));
        setMessage(status === "PUBLISHED" ? "Ready plan published." : "Ready plan moved to draft.");
      } catch (error: any) {
        setMessage(error?.message || "Could not update ready plan.");
      }
    });
  }

  function remove(id: string) {
    if (!window.confirm("Permanently delete this ready plan from the site, admin, dashboard, and database?")) {
      return;
    }

    startTransition(async () => {
      try {
        await removePlan(id);
        setPlans((current) => current.filter((plan) => plan.id !== id));
        setMessage("Ready plan permanently deleted.");
      } catch (error: any) {
        setMessage(error?.message || "Could not remove ready plan.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[#ffb066]">{eyebrow}</div>
            <h2 className="mt-3 text-3xl font-semibold text-white">{title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/62">
              {description}
            </p>
          </div>
          <Link
            href={createHref}
            className="rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#ff9330]"
          >
            {createLabel}
          </Link>
        </div>
        {message ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/75">
            {message}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.22))] shadow-[0_18px_48px_rgba(0,0,0,0.24)]"
          >
            <div className="relative h-48 bg-black/30">
              {plan.heroImage || plan.coverImage ? (
                <img
                  src={plan.heroImage || plan.coverImage || ""}
                  alt={plan.title}
                  className="h-full w-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/72">
                {plan.status}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#ffbf82]">{plan.destination}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{plan.title}</div>
              </div>
            </div>

            <div className="p-5">
              <div className="text-sm text-white/58">{plan.daysCount} days</div>
              <div className="mt-2 text-sm text-white/58">
                {plan.priceFrom ? `From ${plan.priceFrom} ${plan.currency}` : "No price yet"}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`${editBasePath}/${plan.id}/edit`}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/72 transition hover:bg-white/[0.1]"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => updateStatus(plan.id, "PUBLISHED")}
                  className="rounded-full border border-[#ffb066]/30 bg-[#ff7a00]/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-[#ffbf82] transition hover:bg-[#ff7a00]/20 disabled:opacity-60"
                >
                  Post
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => updateStatus(plan.id, "DRAFT")}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/72 transition hover:bg-white/[0.1] disabled:opacity-60"
                >
                  Draft
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => remove(plan.id)}
                  className="rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-500/20 disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}

        {plans.length === 0 ? (
          <div className="rounded-[30px] border border-white/10 bg-black/20 p-6 text-sm text-white/60">
            No ready plans yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
