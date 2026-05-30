"use client";

export function SummaryChip({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"><div className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</div><div className="mt-1 text-sm font-medium text-white/85">{value}</div></div>;
}
