type SavedItem = {
  id: string;
  title: string;
};

export default function ProfileSaved({
  savedPlans,
  savedItems,
}: {
  savedPlans: SavedItem[];
  savedItems: SavedItem[];
}) {
  return (
    <>
      {/* Saved Ready Plans */}
      <div>
        <h2 className="mb-4 text-2xl font-semibold">Saved Ready Plans</h2>

        {savedPlans.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            You haven’t saved any plans yet.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {savedPlans.map((p) => (
              <div
                key={p.id}
                className="min-w-[240px] rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                <div className="font-medium">{p.title}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saved Items */}
      <div>
        <h2 className="mb-4 text-2xl font-semibold">Saved Items</h2>

        {savedItems.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            No saved items yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {savedItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm"
              >
                {item.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
