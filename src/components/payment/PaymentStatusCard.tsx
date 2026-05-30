import Link from "next/link";

type Action = {
  label: string;
  href: string;
};

export function PaymentStatusCard({
  title,
  description,
  status,
  planType,
  totalCredits,
  usedCredits,
  expiresAt,
  primaryAction,
  secondaryAction,
}: {
  title: string;
  description: string;
  status: "checking" | "active" | "pending" | "failed" | "unknown" | "cancelled";
  planType?: string | null;
  totalCredits?: number | null;
  usedCredits?: number | null;
  expiresAt?: string | null;
  primaryAction?: Action;
  secondaryAction?: Action;
}) {
  const accent =
    status === "failed"
      ? "border-red-500/30 bg-red-500/8"
      : status === "active"
        ? "border-[#ff7a00]/30 bg-[#ff7a00]/8"
        : "border-white/10 bg-white/5";

  return (
    <div className={`rounded-[28px] border p-6 shadow-[0_26px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl ${accent}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-[#ffb066]">Gene payment</div>
          <h1 className="mt-3 text-3xl font-semibold text-white">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">{description}</p>
        </div>

        {status === "checking" || status === "pending" ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#ff7a00]/25 bg-[#ff7a00]/10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#ff7a00]/20 border-t-[#ff7a00]" />
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric label="Plan" value={planType ? planType.toUpperCase() : "—"} />
        <Metric
          label="Credits"
          value={
            totalCredits !== null && totalCredits !== undefined
              ? `${Math.max((totalCredits ?? 0) - (usedCredits ?? 0), 0)} / ${totalCredits}`
              : "—"
          }
        />
        <Metric
          label="Expires"
          value={expiresAt ? new Date(expiresAt).toLocaleDateString("en-GB") : "—"}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {primaryAction ? (
          <Link
            href={primaryAction.href}
            className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ff7a00,rgba(255,190,120,0.95))] px-5 py-3 text-sm font-semibold text-black shadow-[0_14px_40px_rgba(255,122,0,0.22)] transition hover:scale-[1.01]"
          >
            {primaryAction.label}
          </Link>
        ) : null}
        {secondaryAction ? (
          <Link
            href={secondaryAction.href}
            className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm font-medium text-white/82 transition hover:bg-white/10 hover:text-white"
          >
            {secondaryAction.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">{label}</div>
      <div className="mt-2 text-base font-medium text-white">{value}</div>
    </div>
  );
}
