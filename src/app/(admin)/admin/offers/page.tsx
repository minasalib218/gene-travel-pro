import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseOfferLiveRecord } from "@/lib/content/offers-live";
import { withExistingTable } from "@/lib/prisma-safe";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  let offers = [] as ReturnType<typeof parseOfferLiveRecord>[];
  let dbError: string | null = null;

  try {
    const rows = await withExistingTable("offers", () => prisma.offer.findMany({ orderBy: { updatedAt: "desc" } }), []);
    offers = rows.map((row) => parseOfferLiveRecord(row as any));
  } catch (error: any) {
    dbError = error?.message || "Unknown database error";
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Offers</h2>
          <p className="mt-2 text-sm text-white/60">Manage live offer cards, affiliate links, and publish state.</p>
        </div>
        <Link href="/admin/offers/create" className="rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#ff9330]">Create Offer</Link>
      </div>
      {dbError ? <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-5 text-red-200"><p className="text-base font-semibold">Database connection error</p><pre className="mt-4 whitespace-pre-wrap break-words rounded-2xl bg-black/30 p-4 text-xs text-red-100">{dbError}</pre></div> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {offers.map((offer) => (
          <Link key={offer.id} href={`/admin/offers/${offer.id}/edit`} className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.22))] shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
            <div className="relative h-48 bg-black/30">
              <img src={offer.imageUrl} alt={offer.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/72">{offer.status}</div>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="text-2xl font-semibold text-white">{offer.title}</div>
                <div className="mt-2 text-sm text-white/72">{offer.location}</div>
              </div>
            </div>
            <div className="p-5 text-sm text-white/58">{offer.startingPrice || offer.discountBadge}</div>
          </Link>
        ))}
        {!dbError && offers.length === 0 ? <div className="rounded-[30px] border border-white/10 bg-black/20 p-6 text-sm text-white/60">No offers yet.</div> : null}
      </div>
    </div>
  );
}
