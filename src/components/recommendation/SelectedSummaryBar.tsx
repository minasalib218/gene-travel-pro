"use client";

import { motion } from "framer-motion";
import type { SelectedRecommendations } from "@/lib/recommendation/types";

export function SelectedSummaryBar({ selected, selectedCount, destination }: { selected: SelectedRecommendations; selectedCount: number; destination: string }) {
  return <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }} className="sticky top-[84px] z-30 mt-6 rounded-full border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-xl"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2 text-sm text-white/70"><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/85">{destination}</span><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{selectedCount} selected</span>{selected.hotel ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Hotel ready</span> : null}{selected.activities.length ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{selected.activities.length} activities</span> : null}</div><div className="text-xs uppercase tracking-[0.24em] text-white/45">Live selection summary</div></div></motion.div>;
}
