type Deal = {
  id: string;
  title: string;
};

export default function ProfileDeals({ deals }: { deals: Deal[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
      <h3 className="mb-3 text-lg font-semibold">New Deals</h3>

      {deals.length === 0 ? (
        <div className="text-sm text-white/60">
          No deals available right now.
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className="rounded-xl bg-white/5 p-3 text-sm"
            >
              {deal.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
