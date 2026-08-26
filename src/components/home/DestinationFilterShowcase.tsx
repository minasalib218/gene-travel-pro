"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass, Globe2, Landmark, Mountain, Waves } from "lucide-react";
import { useMemo, useState } from "react";

type DestinationShowcaseCard = {
  title: string;
  country: string;
  description: string;
  image: string;
  href: string;
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
  australia: Waves,
  "north-america": Compass,
  "latin-america": Globe2,
} as const;

export default function DestinationFilterShowcase({ sections }: { sections: DestinationShowcaseSection[] }) {
  const firstSectionWithCards = useMemo(() => sections.find((section) => section.cards.length > 0)?.id || sections[0]?.id || "", [sections]);
  const [activeSectionId, setActiveSectionId] = useState(firstSectionWithCards);
  const activeSection = sections.find((section) => section.id === activeSectionId) || sections[0];

  if (!activeSection) return null;

  return (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-[34px] border border-black/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.7),rgba(255,246,233,0.34))] p-3 shadow-[0_26px_70px_rgba(43,25,10,0.1)] backdrop-blur-xl md:p-4">
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
                className={`group flex min-w-[170px] items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition duration-300 ${
                  active
                    ? "border-[#ff7a00]/55 bg-[#17120d] text-white shadow-[0_18px_40px_rgba(255,122,0,0.2)]"
                    : "border-black/8 bg-white/58 text-[#2d241b] hover:border-[#ff7a00]/35 hover:bg-white/78"
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border text-[#ff7a00] transition duration-300 group-hover:scale-105 ${
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
                  <span className="mt-1 block text-sm font-semibold uppercase tracking-[0.12em]">{section.title}</span>
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
            {activeSection.cards.length} places
          </div>
        </div>

        {activeSection.cards.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
            {activeSection.cards.map((card) => (
              <DestinationCard key={`${activeSection.id}-${card.title}-${card.href}`} card={card} />
            ))}
          </div>
        ) : (
          <div className="rounded-[32px] border border-black/8 bg-white/60 p-8 text-sm leading-7 text-[#4f4338] shadow-[0_20px_60px_rgba(35,20,8,0.08)] backdrop-blur-md">
            No published destination cards in this region yet.
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
      className="group relative flex min-h-[430px] overflow-hidden rounded-[30px] border border-black/8 bg-[#1c1815] shadow-[0_28px_60px_rgba(36,24,13,0.14)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_34px_70px_rgba(36,24,13,0.2)]"
    >
      <Image
        src={card.image}
        alt={card.title}
        fill
        className="object-cover transition duration-500 group-hover:scale-[1.06]"
        sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 25vw"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,9,7,0.02)_0%,rgba(13,9,7,0.18)_38%,rgba(13,9,7,0.9)_100%)]" />

      {card.featured ? (
        <div className="absolute right-4 top-4 rounded-full bg-[#ff7a00] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_10px_20px_rgba(255,122,0,0.35)]">
          Featured
        </div>
      ) : null}

      <div className="relative mt-auto flex w-full items-end justify-between gap-4 p-5">
        <div className="max-w-[80%] text-white">
          <div className="text-[30px] font-semibold leading-none tracking-[-0.04em]">{card.title}</div>
          <div className="mt-2 text-lg text-white/88">{card.country}</div>
        </div>

        <span className="mb-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#ff7a00]/65 bg-black/45 text-[#ffb15f] shadow-[0_0_0_rgba(255,122,0,0)] transition duration-300 group-hover:shadow-[0_0_22px_rgba(255,122,0,0.45)]">
          <ArrowRight size={18} />
        </span>
      </div>
    </Link>
  );
}
