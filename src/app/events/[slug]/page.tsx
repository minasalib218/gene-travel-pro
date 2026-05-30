import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/db/client";
import { parseEventLiveRecord } from "@/lib/content/events-live";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const row = await prisma.event.findFirst({ where: { slug: params.slug, status: "published" } }).catch(() => null);
  if (!row) return notFound();
  const event = parseEventLiveRecord(row as any);
  const bookingHref = event.affiliateLink ? `/api/affiliate/redirect?type=event&id=${encodeURIComponent(event.id)}` : null;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />
      <section className="relative min-h-[88svh] overflow-hidden">
        <div className="absolute inset-0">
          <Image src={event.imageUrl || "/images/barcelona.jpg"} alt={event.title} fill priority className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,6,6,0.9)_0%,rgba(6,6,6,0.75)_40%,rgba(6,6,6,0.52)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_24%,rgba(255,122,0,0.22),transparent_22%)]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-32 md:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div className="max-w-2xl">
              <div className="text-xs uppercase tracking-[0.32em] text-[#ffc785]">Event In {event.location || event.country}</div>
              <h1 className="mt-5 text-5xl font-semibold leading-[0.92] md:text-7xl">{event.title}</h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-white/70">{event.description}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <GlassInfo label="Category" value={event.category || "Event"} />
                <GlassInfo label="Location" value={[event.location, event.country].filter(Boolean).join(", ") || "Destination"} />
                <GlassInfo label="Date" value={event.dateRange || "Seasonal details"} />
              </div>
              <div className="mt-10 flex flex-wrap gap-4">
                {bookingHref ? <Link href={bookingHref} className="rounded-full border border-[#ffcb87]/35 bg-[linear-gradient(135deg,rgba(255,122,0,0.96),rgba(255,196,107,0.94))] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black shadow-[0_0_34px_rgba(255,122,0,0.28)]">Book Now</Link> : null}
                <Link href="/events" className="rounded-full border border-white/20 bg-white/[0.05] px-6 py-3 text-xs uppercase tracking-[0.2em] text-white/82 transition hover:bg-white/[0.1]">Back To Events</Link>
              </div>
            </div>
            <div className="rounded-[34px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl">
              <div className="text-xs uppercase tracking-[0.28em] text-[#ffb066]">Why It Matters</div>
              <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/72">
                {event.description}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function GlassInfo({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[24px] border border-white/12 bg-white/[0.06] px-5 py-4 backdrop-blur-xl"><div className="text-[11px] uppercase tracking-[0.24em] text-white/45">{label}</div><div className="mt-2 text-lg font-semibold text-white">{value}</div></div>;
}
