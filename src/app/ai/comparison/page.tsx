import CreditBadge from "@/components/CreditBadge";
import Navbar from "@/components/Navbar";
import ProtectedAI from "@/components/ProtectedAI";
import { createRouteClient } from "@/lib/supabase/server";
import { getVerifiedAdmin } from "@/lib/admin/verified";
import { redirect } from "next/navigation";

const compareRows = [
  ["Budget fit", "Tightest overall spend", "Balanced comfort-to-price ratio", "Premium comfort, highest spend"],
  ["Energy level", "Compact route, faster rhythm", "Even pacing across the day", "More rest windows and private transfers"],
  ["Best for", "Solo or agile couples", "Most mixed traveler profiles", "Luxury or celebration trips"],
  ["Tradeoff", "Less cushion for upgrades", "Not the absolute cheapest", "Price rises faster with add-ons"],
];

const comparePlans = ["Lite", "Balanced", "Signature"] as const;

function ComparisonContent() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,122,0,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_20%),linear-gradient(180deg,#171717_0%,#080808_55%,#050505_100%)]" />
      <Navbar />
      <CreditBadge />

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-32 md:px-8">
        <div className="rounded-[36px] border border-white/10 bg-white/[0.05] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/55">
            Compare Directions
          </div>
          <div className="mt-6 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                Review the shape of the trip before you commit.
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/70 md:text-base">
                This page is designed for swipeable recommendation comparisons, plan variants,
                and feature tradeoffs. Instead of dumping raw options, it frames the decision in
                traveler language: fit, rhythm, comfort, and cost.
              </p>

              <div className="mt-8 grid gap-4">
                {["Clear tradeoff storytelling", "Variant-by-variant pacing read", "Faster decision path to booking"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm text-white/70">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:hidden">
              {comparePlans.map((plan, planIndex) => (
                <article key={plan} className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="text-lg font-semibold text-white">{plan}</div>
                    <div className="rounded-full border border-[#ff7a00]/35 bg-[#ff7a00]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ffb16b]">
                      Option {planIndex + 1}
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {compareRows.map((row) => (
                      <div key={`${plan}-${row[0]}`} className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
                        <div className="text-xs uppercase tracking-[0.16em] text-white/42">{row[0]}</div>
                        <div className="mt-1 text-sm leading-6 text-white/78">{row[planIndex + 1]}</div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-[30px] border border-white/10 bg-black/25 md:block">
              <div className="grid grid-cols-4 border-b border-white/10 bg-white/[0.04] text-sm">
                {["Dimension", "Lite", "Balanced", "Signature"].map((cell, index) => (
                  <div
                    key={cell}
                    className={`px-4 py-4 ${index === 0 ? "text-white/55" : "font-semibold text-white"}`}
                  >
                    {cell}
                  </div>
                ))}
              </div>

              {compareRows.map((row) => (
                <div key={row[0]} className="grid grid-cols-4 border-b border-white/10 text-sm last:border-b-0">
                  {row.map((cell, index) => (
                    <div
                      key={`${row[0]}-${index}`}
                      className={`px-4 py-5 leading-6 ${index === 0 ? "bg-white/[0.03] text-white/55" : "text-white/75"}`}
                    >
                      {cell}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function ComparisonPage() {
  const admin = await getVerifiedAdmin();
  if (admin.ok) return <ComparisonContent />;

  const supabase = createRouteClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) redirect("/signin");

  return (
    <ProtectedAI requiredFeature="What If Simulation Mode">
      <ComparisonContent />
    </ProtectedAI>
  );
}
