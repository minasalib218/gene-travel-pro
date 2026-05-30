"use client";

import { motion } from "framer-motion";
import { TimelineItemCard } from "@/components/recommendation/TimelineItemCard";
import type { DayPlan } from "@/lib/recommendation/types";

export function DayCard({ day }: { day: DayPlan }) { return <motion.div layout className="rounded-[26px] border border-white/10 bg-black/25 p-5"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-lg font-semibold">Day {day.day}</div><div className="text-sm text-white/55">{day.date}</div></div><div className="text-xs uppercase tracking-[0.22em] text-white/40">{day.theme}</div></div><div className="mt-5 grid gap-3">{day.items.map((item) => <TimelineItemCard key={item.id} item={item} />)}</div></motion.div>; }
