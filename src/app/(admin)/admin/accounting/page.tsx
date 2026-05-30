import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function createEntry(formData: FormData) {
  "use server";

  const day = String(formData.get("day") || "");
  const kind = String(formData.get("kind") || "INCOME");
  const title = String(formData.get("title") || "");
  const amount = Number(formData.get("amount") || 0);
  const currency = String(formData.get("currency") || "USD");

  if (!day || !title || !amount) return;

  await prisma.accountingEntry.create({
    data: { day, kind, title, amount, currency },
  });

  revalidatePath("/admin/accounting");
}

async function updateEntry(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "");
  const day = String(formData.get("day") || "");
  const kind = String(formData.get("kind") || "INCOME");
  const title = String(formData.get("title") || "");
  const amount = Number(formData.get("amount") || 0);
  const currency = String(formData.get("currency") || "USD");

  if (!id || !day || !title || !amount) return;

  await prisma.accountingEntry.update({
    where: { id },
    data: { day, kind, title, amount, currency },
  });

  revalidatePath("/admin/accounting");
}

async function deleteEntry(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.accountingEntry.delete({
    where: { id },
  });

  revalidatePath("/admin/accounting");
}

export default async function AdminAccountingPage() {
  let entries: Awaited<ReturnType<typeof prisma.accountingEntry.findMany>> = [];
  let totals: Array<{ kind: string; _sum: { amount: number | null } }> = [];
  let dbError: string | null = null;

  try {
    [entries, totals] = await Promise.all([
      prisma.accountingEntry.findMany({ orderBy: [{ day: "desc" }, { createdAt: "desc" }] }),
      prisma.accountingEntry.groupBy({ by: ["kind"], _sum: { amount: true } }),
    ]);
  } catch (error: any) {
    dbError = error?.message || "Unknown database error";
  }

  const totalIncome = totals.find((t: any) => t.kind === "INCOME")?._sum.amount ?? 0;
  const totalExpense = totals.find((t: any) => t.kind === "EXPENSE")?._sum.amount ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Accounting</h2>
        <p className="mt-2 text-sm text-white/60">
          Track payments, expenses, and platform cash flow.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
          <div className="text-sm text-white/55">Total income</div>
          <div className="mt-2 text-3xl font-semibold text-emerald-300">${totalIncome}</div>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
          <div className="text-sm text-white/55">Total expense</div>
          <div className="mt-2 text-3xl font-semibold text-red-300">${totalExpense}</div>
        </div>
      </div>

      {dbError ? (
        <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-5 text-red-200">
          <p className="font-semibold">Database connection error</p>
          <pre className="mt-3 whitespace-pre-wrap text-sm">{dbError}</pre>
        </div>
      ) : null}

      <form action={createEntry} className="grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 md:grid-cols-5">
        <input name="day" type="date" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3" required />
        <select name="kind" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>
        <input name="title" placeholder="Title" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3" required />
        <input name="amount" type="number" step="0.01" placeholder="Amount" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3" required />
        <div className="flex gap-3">
          <input name="currency" defaultValue="USD" className="w-24 rounded-2xl border border-white/10 bg-black/30 px-4 py-3" />
          <button className="flex-1 rounded-2xl px-4 py-3 font-semibold text-black" style={{ backgroundColor: "#ff7a00" }}>Save</button>
        </div>
      </form>

      <div className="overflow-hidden rounded-[28px] border border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/[0.05] text-white/45">
              <tr>
                <th className="px-4 py-4 text-left">Day</th>
                <th className="px-4 py-4 text-left">Kind</th>
                <th className="px-4 py-4 text-left">Title</th>
                <th className="px-4 py-4 text-left">Amount</th>
                <th className="px-4 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-white/10 bg-black/20 align-top">
                  <td colSpan={5} className="px-4 py-4">
                    <form action={updateEntry} className="grid gap-3 md:grid-cols-[160px_140px_1fr_180px_auto]">
                      <input type="hidden" name="id" value={entry.id} />
                      <input name="day" type="date" defaultValue={entry.day} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3" />
                      <select name="kind" defaultValue={entry.kind} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                        <option value="INCOME">Income</option>
                        <option value="EXPENSE">Expense</option>
                      </select>
                      <input name="title" defaultValue={entry.title} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/70" />
                      <div className="flex gap-3">
                        <input name="amount" type="number" step="0.01" defaultValue={entry.amount} className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/70" />
                        <input name="currency" defaultValue={entry.currency} className="w-24 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/70" />
                      </div>
                      <div className="flex gap-2">
                        <button className="rounded-2xl px-4 py-3 font-semibold text-black" style={{ backgroundColor: "#ff7a00" }}>
                          Edit
                        </button>
                        <button formAction={deleteEntry} className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
                          Remove
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
