"use client";

import { motion } from "framer-motion";
import { DayCard } from "@/components/recommendation/DayCard";
import type { DayPlan } from "@/lib/recommendation/types";

export function DayPlanSection({ plan, destination }: { plan: DayPlan[]; destination: string }) { return <motion.section initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.35 }} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl md:p-6"><div><div className="inline-flex items-center rounded-full border border-[#ff7a00]/20 bg-[#ff7a00]/10 px-3 py-1 text-xs text-[#ffb273]">AI arranged your plan automatically</div><h2 className="mt-4 text-2xl font-semibold tracking-tight">AI Day-by-Day Plan</h2><p className="mt-1 max-w-3xl text-sm text-white/60">Gene arranged your selections into a readable itinerary for {destination}.</p></div><div className="mt-6 space-y-5">{plan.map((day) => <DayCard key={day.day} day={day} />)}</div></motion.section>; }
