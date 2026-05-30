"use client";

import Link from "next/link";
import { useState } from "react";

type Card = {
  title: string;
  subtitle: string;
  image: string;
  href: string;
  priceFrom: number;
  currency: string;
};

const cards: Card[] = [
  {
    title: "Dubai Luxury Weekend",
    subtitle: "Luxury skyline, desert sunset, marina nights",
    image: "/images/dubai.jpg",
    href: "/ready-plans/dubai-luxury",
    priceFrom: 1200,
    currency: "USD",
  },
  {
    title: "Paris Romantic Escape",
    subtitle: "Eiffel nights and Seine walks",
    image: "/images/paris.jpg",
    href: "/ready-plans/paris-romantic",
    priceFrom: 950,
    currency: "USD",
  },
  {
    title: "Istanbul Culture Journey",
    subtitle: "Mosques, bazaars and Bosphorus cruise",
    image: "/images/istanbul.jpg",
    href: "/ready-plans/istanbul-culture",
    priceFrom: 700,
    currency: "USD",
  },
];

export function CinematicCardHome() {
  const bgTopDefault = "/bg/home-hero.png";
  const [bgTop, setBgTop] = useState(bgTopDefault);

  return (
    <section className="relative overflow-hidden rounded-3xl">
      <div className="absolute inset-0 -z-10">
        <img
          src={bgTop}
          alt="Ready plans background"
          className="h-full w-full object-cover transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90" />
      </div>

      <div className="px-6 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-semibold text-white">Cinematic Ready Plans</h2>
          <p className="mt-3 text-white/60">
            Discover curated travel programs designed by Gene AI
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.href} href={card.href}>
              <div
                className="group relative h-[420px] overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
                onMouseEnter={() => setBgTop(card.image)}
                onMouseLeave={() => setBgTop(bgTopDefault)}
              >
                <img
                  src={card.image}
                  alt={card.title}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="text-xs uppercase tracking-[0.25em] text-white/60">
                    Ready Plan
                  </div>

                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {card.title}
                  </h3>

                  <p className="mt-1 text-sm text-white/70">{card.subtitle}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-white/80">
                      From{" "}
                      <span className="font-semibold text-white">
                        {card.priceFrom} {card.currency}
                      </span>
                    </div>

                    <div
                      className="rounded-full px-4 py-2 text-sm font-semibold text-black"
                      style={{ background: "#ff7a00" }}
                    >
                      Explore
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
