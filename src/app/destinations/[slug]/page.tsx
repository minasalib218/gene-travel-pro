import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/db/client";
import { parseDestinationRecord } from "@/lib/content/destinations";

export const dynamic = "force-dynamic";

export default async function DestinationDetailPage({ params }: { params: { slug: string } }) {
  const row = await prisma.destination.findFirst({ where: { slug: params.slug, status: "published" } }).catch(() => null);
  if (!row) return notFound();
  const destination = parseDestinationRecord(row as any);
  const bookingHref = destination.affiliateLink
    ? `/api/affiliate/redirect?type=destination&id=${encodeURIComponent(destination.id)}`
    : null;

  return (
    <main className="min-h-screen bg-[#060606] text-white">
      <Navbar />
      <section className="relative min-h-[88svh] overflow-hidden">
        <div className="absolute inset-0">
          <Image src={destination.imageUrl || "/bg/home-hero.png"} alt={destination.title} fill priority className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,0.92)_0%,rgba(5,5,5,0.76)_38%,rgba(5,5,5,0.48)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_22%,rgba(255,122,0,0.28),transparent_22%),radial-gradient(circle_at_18%_80%,rgba(255,198,118,0.12),transparent_26%)]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-32 md:px-8 lg:pb-20">
          <div className="grid gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div className="max-w-2xl">
              <div className="text-xs uppercase tracking-[0.34em] text-[#ffc785]">Destination</div>
              <h1 className="mt-5 text-5xl font-semibold uppercase leading-[0.92] tracking-tight md:text-7xl">{destination.title}</h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-white/70">{destination.description}</p>
              <div className="mt-10 flex flex-wrap gap-4">
                {bookingHref ? (
                  <Link href={bookingHref} className="rounded-full border border-[#ffcb87]/35 bg-[linear-gradient(135deg,rgba(255,122,0,0.96),rgba(255,196,107,0.94))] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black shadow-[0_0_34px_rgba(255,122,0,0.28)]">
                    Book Now
                  </Link>
                ) : null}
                <Link href="/destinations" className="rounded-full border border-white/20 bg-white/[0.04] px-6 py-3 text-xs uppercase tracking-[0.2em] text-white/88 transition hover:bg-white/[0.09]">
                  Back To Destinations
                </Link>
              </div>
            </div>
            <div className="rounded-[34px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl">
              <div className="text-xs uppercase tracking-[0.28em] text-[#ffb066]">Why It Fits Gene</div>
              <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/72">
                {destination.description}
              </div>
              {destination.iconUrl ? <img src={destination.iconUrl} alt="" className="mt-5 h-16 w-16 rounded-2xl border border-white/10 object-cover" /> : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
