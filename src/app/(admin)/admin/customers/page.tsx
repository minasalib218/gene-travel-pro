import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function budgetFromPlan(inputsJson: unknown) {
  if (!inputsJson || typeof inputsJson !== "object") return "—";
  const raw = (inputsJson as Record<string, unknown>).budget;
  if (typeof raw === "number") return `$${raw}`;
  if (typeof raw === "string" && raw.trim()) return raw;
  return "—";
}

export default async function AdminCustomersPage() {
  let profiles: any[] = [];
  let savedItemsByUser = new Map<string, any[]>();
  let dbError: string | null = null;

  try {
    const [profileRows, savedItems] = await Promise.all([
      prisma.profile.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          passes: { orderBy: { createdAt: "desc" }, take: 1 },
          plans: { orderBy: { createdAt: "desc" }, take: 3 },
        },
      }),
      prisma.savedItem.findMany({
        where: { kind: "PLAN" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    profiles = profileRows;
    savedItemsByUser = savedItems.reduce((acc, item) => {
      const current = acc.get(item.userId) ?? [];
      if (current.length < 3) {
        current.push(item);
        acc.set(item.userId, current);
      }
      return acc;
    }, new Map<string, any[]>());
  } catch (error: any) {
    dbError = error?.message || "Unknown database error";
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold">Customers</h2>
      <p className="mt-2 text-sm text-white/60">
        See who signed up, who paid, latest chosen budget, and the finalized plans saved in customer profiles.
      </p>

      {dbError ? (
        <div className="mt-6 rounded-[28px] border border-red-500/30 bg-red-500/10 p-5 text-red-200">
          <p className="font-semibold">Database connection error</p>
          <pre className="mt-3 whitespace-pre-wrap text-sm">{dbError}</pre>
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.05] text-white/55">
              <tr>
                <th className="px-4 py-4">User</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">Paid</th>
                <th className="px-4 py-4">Pass</th>
                <th className="px-4 py-4">Budget</th>
                <th className="px-4 py-4">Saved Plans</th>
                <th className="px-4 py-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => {
                const lastPass = profile.passes[0];
                const lastPlan = profile.plans[0];
                const paid = !!lastPass && lastPass.status === "ACTIVE";
                const savedPlans = savedItemsByUser.get(profile.id) ?? [];

                return (
                  <tr key={profile.id} className="border-t border-white/10 bg-black/20 align-top">
                    <td className="px-4 py-4">{profile.fullName || profile.id.slice(0, 8)}</td>
                    <td className="px-4 py-4 text-white/70">{profile.email || "—"}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          paid ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/70"
                        }`}
                      >
                        {paid ? "Paid" : "Logged in only"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-white/70">{lastPass?.tier || "—"}</td>
                    <td className="px-4 py-4 text-white/70">{budgetFromPlan(lastPlan?.inputsJson)}</td>
                    <td className="px-4 py-4 text-white/70">
                      {savedPlans.length === 0 ? (
                        <span>—</span>
                      ) : (
                        <div className="space-y-2">
                          {savedPlans.map((item: any) => (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/65"
                            >
                              <div className="font-medium text-white/82">
                                {item.meta?.title || item.meta?.destination || "Saved plan"}
                              </div>
                              <div className="mt-1">
                                {item.meta?.subtitle || item.createdAt.toISOString().slice(0, 10)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-white/55">{profile.createdAt.toISOString().slice(0, 10)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
