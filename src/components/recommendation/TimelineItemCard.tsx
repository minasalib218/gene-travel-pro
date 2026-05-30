"use client";

import { motion } from "framer-motion";
import type { DayPlanItem } from "@/lib/recommendation/types";

const slotTone: Record<DayPlanItem["slot"], string> = {
  morning: "Morning",
  midday: "Midday",
  afternoon: "Afternoon",
  evening: "Evening",
};

export function TimelineItemCard({ item }: { item: DayPlanItem }) {
  return (
    <motion.div layout className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
              {slotTone[item.slot]}
            </span>
            <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
              {item.type}
            </span>
          </div>
          <div className="text-base font-semibold">{item.title}</div>
          <div className="text-sm text-white/60">{item.description}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
          {item.startTime} to {item.endTime}
        </div>
      </div>
    </motion.div>
  );
}
