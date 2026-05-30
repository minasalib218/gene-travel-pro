"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { OfferRecord } from "@/lib/content/offers";

export default function OffersExplorer({
  offers,
  actionLabel = "Open Offer",
}: {
  offers: OfferRecord[];
  actionLabel?: string;
}) {
  const [destination, setDestination] = useState("All destinations");
  const [query, setQuery] = useState("");

  const destinations = useMemo(
    () => ["All destinations", ...Array.from(new Set(offers.map((offer) => offer.destination))).sort()],
    [offers],
  );

  const filtered = useMemo(() => {
    return offers.filter((offer) => {
      const matchesDestination =
        destination === "All destinations" || offer.destination === destination;
      const haystack = `${offer.title} ${offer.destination} ${offer.subtitle}`.toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
      return matchesDestination && matchesQuery;
    });
  }, [destination, offers, query]);

  return (
    <div className="space-y-8">
      <section className="rounded-[34px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[#ffb066]">Offers Search</div>
            <h2 className="mt-3 text-3xl font-semibold text-white">Find offers by destination mood.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/64">
              Choose a destination like Dubai, then browse only the matching offers with the same cinematic style as the rest of Gene.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search destination or offer"
              className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            />
            <select
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
            >
              {destinations.map((value) => (
                <option key={value} value={value} className="bg-[#111]">
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((offer) => (
          <Link
            key={offer.id}
            href={`/offers/${offer.slug}`}
            className="group overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.22))] shadow-[0_18px_48px_rgba(0,0,0,0.26)] transition hover:border-[#ffb066]/30 hover:bg-white/[0.07]"
          >
            <div className="relative h-72">
              <Image
                src={offer.imageUrl}
                alt={offer.title}
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/18 to-transparent" />
              <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#ffc785]">
                {offer.discountLabel}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/72">{offer.destination}</div>
                <div className="mt-3 text-3xl font-semibold leading-[0.95] text-white">{offer.title}</div>
                <div className="mt-3 text-sm leading-7 text-white/68">{offer.subtitle}</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-5">
              <div className="text-sm text-white/64">{offer.price}</div>
              <div className="rounded-full border border-[#ffb066]/25 bg-[#ff7a00]/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[#ffbf82]">
                {actionLabel}
              </div>
            </div>
          </Link>
        ))}

        {filtered.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-black/20 p-6 text-sm text-white/62">
            No offers matched this destination yet.
          </div>
        ) : null}
      </section>
    </div>
  );
}
