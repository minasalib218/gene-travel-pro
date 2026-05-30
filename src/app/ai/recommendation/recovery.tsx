"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RecommendationWorkspace from "@/app/ai/recommendation/ui";

type RecoveryPayload = {
  planInput: any;
  recommendation: {
    headline: string;
    summary: string;
    hotels: Array<Record<string, unknown>>;
    flights: Array<Record<string, unknown>>;
    activities: Array<Record<string, unknown>>;
    fitBullets: string[];
    rawAi?: Record<string, unknown> | null;
  };
};

export default function RecommendationRecovery({ planId }: { planId: string }) {
  const [payload, setPayload] = useState<RecoveryPayload | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`gene-recommendation-bootstrap:${planId}`);
      if (raw) {
        setPayload(JSON.parse(raw) as RecoveryPayload);
      }
    } catch (error) {
      console.error("Recommendation recovery failed", error);
    } finally {
      setChecked(true);
    }
  }, [planId]);

  if (payload) {
    return (
      <RecommendationWorkspace
        planId={planId}
        planInput={payload.planInput}
        recommendation={payload.recommendation}
      />
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.18),transparent_35%),linear-gradient(to_bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.92))]" />
      <div className="relative mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-16">
        <div className="w-full rounded-[30px] border border-white/10 bg-black/40 p-8 text-center shadow-[0_32px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="text-[11px] uppercase tracking-[0.28em] text-[#ffb066]">Recommendation recovery</div>
          <h1 className="mt-4 text-3xl font-semibold">We could not reopen this recommendation yet.</h1>
          <p className="mt-4 text-sm leading-7 text-white/68">
            {checked
              ? "The saved trip snapshot was not available in this browser session. Go back to the AI input page and generate the recommendation again."
              : "Loading your latest recommendation snapshot..."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/ai-planner"
              className="rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#ff922f]"
            >
              Back to AI input
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
