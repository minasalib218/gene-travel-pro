type Props = {
  tier: string;
  plansRemaining: number;
  expiresAt: string | null;
};

export default function ProfileSummary({
  tier,
  plansRemaining,
  expiresAt,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
      <h3 className="mb-3 text-lg font-semibold">Account Summary</h3>

      <div className="space-y-2 text-sm text-white/70">
        <div>Tier: {tier}</div>
        <div>Plans remaining: {plansRemaining}</div>
        <div>
          Expires: {expiresAt ? new Date(expiresAt).toDateString() : "—"}
        </div>
      </div>
    </div>
  );
}
