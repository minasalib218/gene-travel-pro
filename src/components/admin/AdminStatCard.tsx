export function AdminStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(0,0,0,0.18))] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="text-[11px] uppercase tracking-[0.24em] text-[#ffb066]">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-2 text-sm leading-6 text-white/55">{hint}</div> : null}
    </div>
  );
}
