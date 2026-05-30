import Navbar from "@/components/Navbar";
import { createRouteClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const plannerPillars = [
  "Destination, timing, and traveler profile",
  "Budget shape and comfort level",
  "Pace, activity, and hotel logic",
];

export default async function PlannerPage() {
  const supabase = createRouteClient();
  const { data } = await supabase.auth.getUser();

  if (!data?.user) redirect("/signin");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.18),transparent_30%),linear-gradient(180deg,#171717_0%,#0b0b0b_55%,#050505_100%)]" />
      <Navbar />

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-32 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[36px] border border-white/10 bg-white/[0.05] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="text-xs uppercase tracking-[0.28em] text-[#ffb066]">Smart Planner</div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">
              Shape the trip before Gene starts optimizing.
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/70 md:text-base">
              This page is the front door to the planning flow: a cinematic intake layer for trip
              context, budget realism, and traveler behavior before recommendations are generated.
            </p>

            <div className="mt-8 space-y-4">
              {plannerPillars.map((item, index) => (
                <div key={item} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff7a00] text-sm font-semibold text-black">
                    {index + 1}
                  </div>
                  <div className="text-sm text-white/75">{item}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] border border-white/10 bg-white/[0.05] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Destination(s)">
                <input className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none transition focus:border-[#ff7a00]" placeholder="Dubai, Paris, Tokyo" />
              </Field>
              <Field label="Departure city">
                <input className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none transition focus:border-[#ff7a00]" placeholder="Cairo" />
              </Field>
              <Field label="Start date">
                <input type="date" className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none transition focus:border-[#ff7a00]" />
              </Field>
              <Field label="End date">
                <input type="date" className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none transition focus:border-[#ff7a00]" />
              </Field>
              <Field label="Budget">
                <input className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none transition focus:border-[#ff7a00]" placeholder="Total budget in USD" />
              </Field>
              <Field label="Travel style">
                <select className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none transition focus:border-[#ff7a00]">
                  <option>Chill</option>
                  <option>Balanced</option>
                  <option>Active</option>
                  <option>Extreme</option>
                </select>
              </Field>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {["With kids", "With elders", "Couple trip"].map((label) => (
                <label key={label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm text-white/75">
                  <input type="checkbox" className="accent-brand" />
                  {label}
                </label>
              ))}
            </div>

            <div className="mt-5 space-y-4">
              <Field label="Hotel type">
                <input className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none transition focus:border-[#ff7a00]" placeholder="3-star, 5-star, apartment, resort" />
              </Field>
              <Field label="Special requests">
                <textarea className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none transition focus:border-[#ff7a00]" placeholder="Shopping, museums, beaches, nightlife, mobility needs..." />
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,122,0,0.16),rgba(255,255,255,0.03))] px-5 py-5">
              <div>
                <div className="text-sm font-semibold">Next stop: the interactive AI planner flow</div>
                <div className="mt-1 text-sm text-white/65">This placeholder keeps the original visual intent while the full logic lives in `/ai-planner`.</div>
              </div>
              <button type="button" className="rounded-full bg-[#ff7a00] px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90">
                Continue
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm text-white/70">{label}</div>
      {children}
    </label>
  );
}
