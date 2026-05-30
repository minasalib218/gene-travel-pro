"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const ORANGE = "#ff7a00";

export default function AnalysisClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const planId = sp.get("planId");

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!planId) {
        setErr("Missing planId.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/plan/${planId}`, { method: "GET" });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.message || "Failed to load plan");
        }
        if (!cancelled) setPlan(json);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load plan");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [planId]);

  function goSummary() {
    if (!planId) return;
    router.push(`/summary?planId=${planId}`);
  }

  const features = plan?.analysisJson?.features ?? [];

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 -z-10">
        <Image src="/bg/home-hero.png" alt="bg" fill priority className="object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/75 to-black" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-semibold">Plan Analysis</h1>
        <p className="text-white/70 mt-2 max-w-2xl">
          Features-only view. After you accept, you’ll see the full summary with Book Now buttons.
        </p>

        {loading && <div className="mt-8 text-white/70">Loading…</div>}
        {err && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        {!loading && !err && (
          <>
            <div className="mt-10 grid md:grid-cols-2 gap-4">
              {features.map((f: any) => (
                <div key={f.key} className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md p-6">
                  <div className="text-xl font-semibold">{f.title}</div>
                  <div className="mt-2 text-white/70 text-sm">{f.description}</div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex items-center justify-between gap-4">
              <div className="text-sm text-white/60">
                Plan: <span className="text-white/80">{plan?.title || "Gene Smart Plan"}</span>
              </div>

              <button
                onClick={goSummary}
                className="rounded-2xl px-6 py-3 font-semibold text-black hover:opacity-90 transition"
                style={{ backgroundColor: ORANGE }}
              >
                Accept & Continue to Summary
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
