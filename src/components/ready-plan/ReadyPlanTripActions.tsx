"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkPlus, Sparkles } from "lucide-react";

export default function ReadyPlanTripActions({ readyPlanId }: { readyPlanId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"add" | "customize" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: "ADD_READY_PLAN" | "CUSTOMIZE_READY_PLAN") {
    setBusy(action === "ADD_READY_PLAN" ? "add" : "customize");
    setMessage(null);
    const response = await fetch("/api/profile/trips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, readyPlanId }),
    });
    const result = await response.json().catch(() => null);
    setBusy(null);
    if (response.status === 401) {
      router.push(`/signin?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!response.ok || !result?.ok) {
      setMessage("This plan could not be added right now.");
      return;
    }
    if (action === "CUSTOMIZE_READY_PLAN" && result.planId) {
      router.push(`/ai-planner?planId=${encodeURIComponent(result.planId)}`);
      return;
    }
    setMessage(result.existing ? "This ready plan is already in My Trips." : "Added to My Trips.");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={Boolean(busy)} onClick={() => run("ADD_READY_PLAN")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-black/25 px-4 text-xs font-bold text-white backdrop-blur-xl disabled:opacity-50">
          <BookmarkPlus className="h-4 w-4" /> {busy === "add" ? "Adding..." : "Add to My Trips"}
        </button>
        <button type="button" disabled={Boolean(busy)} onClick={() => run("CUSTOMIZE_READY_PLAN")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#ff7a00]/45 bg-[#ff7a00]/12 px-4 text-xs font-bold text-[#ffb36c] backdrop-blur-xl disabled:opacity-50">
          <Sparkles className="h-4 w-4" /> {busy === "customize" ? "Preparing..." : "Use as base & customize"}
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-[#ffd0a5]" role="status">{message}</p> : null}
    </div>
  );
}
