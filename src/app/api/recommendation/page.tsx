import ProtectedAI from "@/components/ProtectedAI";
import CreditBadge from "@/components/CreditBadge";

export default function RecommendationPage() {
  return (
    <ProtectedAI>
      {/* client badge */}
      <CreditBadge />
      <main className="min-h-screen text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/bg/home-hero.png')] bg-cover bg-center opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-black" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-14">
          <h1 className="text-3xl md:text-4xl font-semibold">AI Recommendation</h1>
          <p className="text-white/70 mt-2">
            Paid-only access. Actions decrease only on Generate Another AI Plan or Run Analysis.
          </p>

          <div className="mt-10 grid gap-4">
            <GenerateFullPlanCard />
            <RunAnalysisCard />
            <PaidSearchCard />
          </div>
        </div>
      </main>
    </ProtectedAI>
  );
}

// ---- Client blocks ----
function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return String(Date.now()) + "-" + Math.random().toString(16).slice(2);
}

function cardClass() {
  return "rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-5";
}

function btnClass(primary = false) {
  return primary
    ? "rounded-xl px-4 py-2 bg-[#ff7a00] text-black font-semibold hover:opacity-90 transition"
    : "rounded-xl px-4 py-2 bg-white/10 border border-white/10 hover:bg-white/15 transition";
}

function GenerateFullPlanCard() {
  async function onGenerate() {
    const res = await fetch("/api/ai/generate-full", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idempotencyKey: uuid(),
        title: "Gene Smart Plan",
        destination: "Dubai",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        inputs: { budget: 800, style: "luxury" },
      }),
    });
    const j = await res.json();
    alert(JSON.stringify(j, null, 2));
  }

  return (
    <section className={cardClass()}>
      <h2 className="text-lg font-semibold">Generate Another Full AI Plan</h2>
      <p className="text-white/70 mt-1">Consumes 1 action.</p>
      <button className={btnClass(true)} onClick={onGenerate}>
        Generate Another AI Plan
      </button>
    </section>
  );
}

function RunAnalysisCard() {
  async function onAnalyze() {
    // In real flow you will pass the current planId
    const planId = prompt("Enter planId to analyze (stub):");
    if (!planId) return;

    const res = await fetch("/api/ai/run-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idempotencyKey: uuid(),
        planId,
      }),
    });
    const j = await res.json();
    alert(JSON.stringify(j, null, 2));
  }

  return (
    <section className={cardClass()}>
      <h2 className="text-lg font-semibold">Run Analysis Plan</h2>
      <p className="text-white/70 mt-1">Consumes 1 action.</p>
      <button className={btnClass(true)} onClick={onAnalyze}>
        Run Analysis
      </button>
    </section>
  );
}

function PaidSearchCard() {
  async function onSearch() {
    const sectionType = prompt("SectionType? HOTEL/TRIP/FLIGHT/TRANSPORT", "HOTEL");
    if (!sectionType) return;

    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionType, query: "downtown" }),
    });
    const j = await res.json();
    alert(JSON.stringify(j, null, 2));
  }

  return (
    <section className={cardClass()}>
      <h2 className="text-lg font-semibold">Search (Paid-only)</h2>
      <p className="text-white/70 mt-1">No action consumed. Requires active pass.</p>
      <button className={btnClass(false)} onClick={onSearch}>
        Open Search
      </button>
    </section>
    
  );
}
