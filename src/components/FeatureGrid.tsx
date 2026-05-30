import { FEATURE_CATALOG } from "@/lib/features/catalog";

type Status = "good" | "warn" | "bad";

export function FeatureGrid({
  features,
}: {
  features: Array<{ key: string; status: Status; text: string }>;
}) {
  const byKey = new Map(features.map((f) => [f.key, f]));

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {FEATURE_CATALOG.map((item) => {
        const feature = byKey.get(item.key);
        const status = (feature?.status ?? "warn") as Status;

        const tone =
          status === "good"
            ? "border-emerald-500/25 bg-emerald-500/10"
            : status === "bad"
              ? "border-red-500/25 bg-red-500/10"
              : "border-yellow-500/25 bg-yellow-500/10";

        return (
          <div key={item.key} className={`rounded-2xl border ${tone} p-4`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-semibold">{item.label}</span>
            </div>
            <div className="mt-2 text-xs text-white/70">
              {feature?.text ?? "Pending analysis"}
            </div>
          </div>
        );
      })}
    </div>
  );
}