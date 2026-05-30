import Navbar from "@/components/Navbar";
import { createRouteClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const timelineLanes = [
  {
    slot: "Morning",
    items: ["Hotel breakfast and departure check", "Scenic transfer", "Primary attraction block"],
  },
  {
    slot: "Afternoon",
    items: ["Lunch with budget cushion", "Flexible cultural stop", "Recovery window if pace is too dense"],
  },
  {
    slot: "Evening",
    items: ["Dinner selection", "Night activity or skyline moment", "Rest buffer before next day"],
  },
];

export default async function EditorPage() {
  const supabase = createRouteClient();
  const { data } = await supabase.auth.getUser();

  if (!data?.user) redirect("/signin");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,122,0,0.16),transparent_28%),linear-gradient(180deg,#151515_0%,#090909_55%,#050505_100%)]" />
      <Navbar />

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-32 md:px-8">
        <div className="rounded-[36px] border border-white/10 bg-white/[0.05] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-[#ffb066]">Timeline Editor</div>
              <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">
                Refine the day flow without breaking the trip.
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/70 md:text-base">
                The editor is meant to juggle timing, budget, fatigue, weather, and travel distance
                in one place. This restored shell brings back the product feel while the detailed
                editing mechanics continue to evolve.
              </p>

              <div className="mt-8 space-y-4">
                {["Rule-based pacing", "Budget pressure alerts", "Smart recovery when a day gets too dense"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm text-white/75">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5">
              {timelineLanes.map((lane) => (
                <div key={lane.slot} className="rounded-[28px] border border-white/10 bg-black/25 p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-semibold">{lane.slot}</div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/50">
                      Editable lane
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {lane.items.map((item, index) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff7a00] text-sm font-semibold text-black">
                          {index + 1}
                        </div>
                        <div className="text-sm text-white/75">{item}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
