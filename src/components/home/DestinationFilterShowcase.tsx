"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass, Globe2, Landmark, Mountain, Waves } from "lucide-react";
import { useMemo, useState } from "react";
import { destinationTripStyles, getDestinationTripStyleLabel, type DestinationTripStyleValue } from "@/lib/content/destinations";

type DestinationShowcaseCard = {
  title: string;
  country: string;
  slogan?: string;
  description: string;
  image: string;
  href: string;
  tripStyles?: DestinationTripStyleValue[];
  featured?: boolean;
};

type DestinationShowcaseSection = {
  id: string;
  eyebrow: string;
  title: string;
  cards: DestinationShowcaseCard[];
};

const sectionIcons = {
  africa: Mountain,
  asia: Landmark,
  europe: Landmark,
  australia: Waves,
  "north-america": Compass,
  "latin-america": Globe2,
} as const;

const tripStyleIcons: Record<DestinationTripStyleValue, typeof Compass> = {
  adventure: Compass,
  "ancient-wonders": Landmark,
  "city-and-culture": Globe2,
  "hiking-trekking": Mountain,
  "nature-wildlife": Mountain,
  "island-hopping": Waves,
  safari: Globe2,
  cruise: Waves,
};

const tripStyleLabelClasses: Record<DestinationTripStyleValue, string> = {
  adventure: "border-[#ff7a00]/55 bg-[#ff7a00]/30 shadow-[0_0_18px_rgba(255,122,0,0.28)]",
  "ancient-wonders": "border-[#d9a441]/60 bg-[#9a6617]/35 shadow-[0_0_18px_rgba(217,164,65,0.26)]",
  "city-and-culture": "border-[#8bd3ff]/60 bg-[#227ba8]/35 shadow-[0_0_18px_rgba(34,123,168,0.26)]",
  "hiking-trekking": "border-[#7bd88f]/60 bg-[#2f8a4a]/35 shadow-[0_0_18px_rgba(47,138,74,0.26)]",
  "nature-wildlife": "border-[#9be36d]/60 bg-[#4d8f2e]/35 shadow-[0_0_18px_rgba(77,143,46,0.26)]",
  "island-hopping": "border-[#69e7ff]/60 bg-[#1e9fb8]/35 shadow-[0_0_18px_rgba(30,159,184,0.26)]",
  safari: "border-[#f1b45c]/60 bg-[#9a5a1c]/35 shadow-[0_0_18px_rgba(154,90,28,0.28)]",
  cruise: "border-[#bca7ff]/60 bg-[#5b4ac8]/35 shadow-[0_0_18px_rgba(91,74,200,0.26)]",
};

export default function DestinationFilterShowcase({ sections }: { sections: DestinationShowcaseSection[] }) {
  const firstSectionWithCards = useMemo(() => sections.find((section) => section.cards.length > 0)?.id || sections[0]?.id || "", [sections]);
  const [activeSectionId, setActiveSectionId] = useState(firstSectionWithCards);
  const [activeTripStyle, setActiveTripStyle] = useState<"all" | DestinationTripStyleValue>("all");
  const activeSection = sections.find((section) => section.id === activeSectionId) || sections[0];
  const filteredCards =
    activeTripStyle === "all"
      ? activeSection?.cards ?? []
      : activeSection?.cards.filter((card) => card.tripStyles?.includes(activeTripStyle)) ?? [];

  if (!activeSection) return null;

  return (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-[28px] border border-black/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.7),rgba(255,246,233,0.34))] p-3 shadow-[0_26px_70px_rgba(43,25,10,0.1)] backdrop-blur-xl md:rounded-[34px] md:p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(255,122,0,0.18),transparent_32%),radial-gradient(circle_at_94%_18%,rgba(20,15,12,0.12),transparent_26%)]" />
        <div className="relative flex gap-3 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((section) => {
            const Icon = sectionIcons[section.id as keyof typeof sectionIcons] || Globe2;
            const active = section.id === activeSection.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
                className={`group flex min-w-[148px] items-center gap-2.5 rounded-[20px] border px-3 py-3 text-left transition duration-300 sm:min-w-[165px] sm:gap-3 sm:px-4 md:rounded-[22px] ${
                  active
                    ? "border-[#ff7a00]/55 bg-[#17120d] text-white shadow-[0_18px_40px_rgba(255,122,0,0.2)]"
                    : "border-black/8 bg-white/58 text-[#2d241b] hover:border-[#ff7a00]/35 hover:bg-white/78"
                  }`}
                >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border text-[#ff7a00] transition duration-300 group-hover:scale-105 sm:h-11 sm:w-11 sm:rounded-[16px] ${
                    active
                      ? "border-[#ff7a00]/50 bg-[#ff7a00]/14 shadow-[0_0_26px_rgba(255,122,0,0.34)]"
                      : "border-[#ff7a00]/20 bg-[#ff7a00]/10 shadow-[0_0_18px_rgba(255,122,0,0.16)]"
                  }`}
                >
                  <Icon size={20} />
                </span>
                <span>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c56b1a]">
                    {section.eyebrow}
                  </span>
                  <span className="mt-1 block text-[12px] font-semibold uppercase tracking-[0.1em] sm:text-sm sm:tracking-[0.12em]">{section.title}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[28px] border border-black/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.7),rgba(255,246,233,0.34))] p-3 shadow-[0_26px_70px_rgba(43,25,10,0.1)] backdrop-blur-xl md:rounded-[34px] md:p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(255,122,0,0.16),transparent_32%),radial-gradient(circle_at_94%_18%,rgba(20,15,12,0.12),transparent_26%)]" />
        <div className="relative flex gap-3 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveTripStyle("all")}
            className={`group flex min-w-[148px] items-center gap-2.5 rounded-[20px] border px-3 py-3 text-left transition duration-300 sm:min-w-[165px] sm:gap-3 sm:px-4 md:rounded-[22px] ${
              activeTripStyle === "all"
                ? "border-[#ff7a00]/55 bg-[#17120d] text-white shadow-[0_18px_40px_rgba(255,122,0,0.2)]"
                : "border-black/8 bg-white/58 text-[#2d241b] hover:border-[#ff7a00]/35 hover:bg-white/78"
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border text-[#ff7a00] transition duration-300 group-hover:scale-105 sm:h-11 sm:w-11 sm:rounded-[16px] ${
                activeTripStyle === "all"
                  ? "border-[#ff7a00]/50 bg-[#ff7a00]/14 shadow-[0_0_26px_rgba(255,122,0,0.34)]"
                  : "border-[#ff7a00]/20 bg-[#ff7a00]/10 shadow-[0_0_18px_rgba(255,122,0,0.16)]"
              }`}
            >
              <Compass size={20} />
            </span>
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c56b1a]">
                Filter
              </span>
              <span className="mt-1 block text-[12px] font-semibold uppercase tracking-[0.1em] sm:text-sm sm:tracking-[0.12em]">All Styles</span>
            </span>
          </button>
          {destinationTripStyles.map((style) => {
            const Icon = tripStyleIcons[style.value];
            const active = activeTripStyle === style.value;

            return (
              <button
                key={style.value}
                type="button"
                onClick={() => setActiveTripStyle(style.value)}
                className={`group flex min-w-[168px] items-center gap-2.5 rounded-[20px] border px-3 py-3 text-left transition duration-300 sm:min-w-[190px] sm:gap-3 sm:px-4 md:rounded-[22px] ${
                  active
                    ? "border-[#ff7a00]/55 bg-[#17120d] text-white shadow-[0_18px_40px_rgba(255,122,0,0.2)]"
                    : "border-black/8 bg-white/58 text-[#2d241b] hover:border-[#ff7a00]/35 hover:bg-white/78"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border text-[#ff7a00] transition duration-300 group-hover:scale-105 sm:h-11 sm:w-11 sm:rounded-[16px] ${
                    active
                      ? "border-[#ff7a00]/50 bg-[#ff7a00]/14 shadow-[0_0_26px_rgba(255,122,0,0.34)]"
                      : "border-[#ff7a00]/20 bg-[#ff7a00]/10 shadow-[0_0_18px_rgba(255,122,0,0.16)]"
                  }`}
                >
                  <Icon size={20} />
                </span>
                <span>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c56b1a]">
                    Style
                  </span>
                  <span className="mt-1 block text-[12px] font-semibold uppercase tracking-[0.1em] sm:text-sm sm:tracking-[0.12em]">{style.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section key={activeSection.id} className="animate-[destinationReveal_420ms_ease]">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c56b1a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff7a00] shadow-[0_0_16px_rgba(255,122,0,0.7)]" />
              Selected Region
            </div>
            <h2 className="mt-2 text-3xl font-semibold leading-none tracking-[-0.04em] text-[#17120d] md:text-4xl">
              {activeSection.title}
            </h2>
          </div>
          <div className="w-fit rounded-full border border-black/8 bg-white/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5a4533]">
            {filteredCards.length} places
          </div>
        </div>

        {filteredCards.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredCards.map((card) => (
              <DestinationCard key={`${activeSection.id}-${card.title}-${card.href}`} card={card} />
            ))}
          </div>
        ) : (
          <div className="rounded-[32px] border border-black/8 bg-white/60 p-8 text-sm leading-7 text-[#4f4338] shadow-[0_20px_60px_rgba(35,20,8,0.08)] backdrop-blur-md">
            No published destination cards match this filter yet.
          </div>
        )}

        <style jsx global>{`
          @keyframes destinationReveal {
            from {
              opacity: 0;
              transform: translateY(12px);
              filter: blur(4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
              filter: blur(0);
            }
          }
        `}</style>
      </section>
    </div>
  );
}

function DestinationCard({ card }: { card: DestinationShowcaseCard }) {
  return (
    <Link
      href={card.href}
      className="group relative flex min-h-[310px] overflow-hidden rounded-[24px] border border-black/8 bg-[#1c1815] shadow-[0_22px_48px_rgba(36,24,13,0.13)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_34px_70px_rgba(36,24,13,0.2)] sm:min-h-[360px] md:rounded-[28px] lg:min-h-[400px] 2xl:min-h-[430px] 2xl:rounded-[30px]"
    >
      <Image
        src={card.image}
        alt={card.title}
        fill
        className="object-cover transition duration-500 group-hover:scale-[1.06]"
        sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 25vw"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,9,7,0.02)_0%,rgba(13,9,7,0.18)_38%,rgba(13,9,7,0.9)_100%)]" />

      <div className="absolute left-3 top-3 flex max-w-[76%] flex-wrap gap-1.5 sm:left-4 sm:top-4 sm:gap-2">
        {(card.tripStyles?.length ? card.tripStyles : (["adventure"] as DestinationTripStyleValue[])).slice(0, 3).map((tag) => (
          <span
            key={tag}
            className={`rounded-full border px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md sm:px-3 sm:text-[10px] sm:tracking-[0.14em] ${tripStyleLabelClasses[tag]}`}
          >
            {getDestinationTripStyleLabel(tag)}
          </span>
        ))}
      </div>

      <div className="relative mt-auto flex w-full items-end justify-between gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="max-w-[80%] text-white">
          <div className="text-[23px] font-semibold leading-none tracking-[-0.04em] sm:text-[28px] 2xl:text-[30px]">{card.title}</div>
          <div className="mt-2 text-xs font-medium text-white/72 sm:text-sm">{card.slogan || card.country}</div>
        </div>

        <span className="mb-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#ff7a00]/65 bg-black/45 text-[#ffb15f] shadow-[0_0_0_rgba(255,122,0,0)] transition duration-300 group-hover:shadow-[0_0_22px_rgba(255,122,0,0.45)] sm:h-11 sm:w-11">
          <ArrowRight size={17} />
        </span>
      </div>
    </Link>
  );
}
