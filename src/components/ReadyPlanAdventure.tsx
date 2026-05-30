"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const ORANGE = "#ff7a00";

type DayData = {
  day: number;
  title: string;
  bullets: string[];
  image?: string; // "/images/paris-day1.png"
};

function Dot({ dim }: { dim?: boolean }) {
  return (
    <div
      className="h-2 w-2 rounded-full"
      style={{ backgroundColor: dim ? "rgba(255,255,255,0.18)" : ORANGE }}
    />
  );
}

function LineItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: "rgba(255,122,0,0.75)" }}
      />
      <span>{children}</span>
    </div>
  );
}

function DayCard({
  planId,
  data,
  open,
  onToggle,
}: {
  planId: string;
  data: DayData;
  open: boolean;
  onToggle: () => void;
}) {
  const previewImg = data.image || "/images/paris-day1.png";

  return (
    <div className="rounded-[26px] border border-white/10 bg-black/25 backdrop-blur-xl shadow-[0_22px_70px_rgba(0,0,0,0.55)] overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[1fr,1.05fr]">
        {/* LEFT panel */}
        <div className="p-6 md:p-8">
          <div className="flex gap-6">
            {/* Day number + vertical dots */}
            <div className="flex flex-col items-center">
              <div className="font-serif text-4xl text-white/95">{data.day}</div>
              <div className="mt-3 flex flex-col items-center gap-3">
                <Dot />
                <Dot dim />
                <Dot dim />
              </div>
              <div className="mt-3 h-16 w-px bg-white/10" />
            </div>

            {/* Text */}
            <div className="min-w-0">
              <div className="text-xl font-semibold">{data.title}</div>

              <div className="mt-3 space-y-2 text-sm text-white/70">
                {data.bullets.map((b) => (
                  <LineItem key={b}>{b}</LineItem>
                ))}
              </div>

              {/* Toggle button (accordion) */}
              <button
                type="button"
                onClick={onToggle}
                className="mt-6 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm text-white/85 hover:bg-white/10 transition"
              >
                {open ? "Close Day" : `Explore Day ${data.day}`}{" "}
                <span className="ml-2">{open ? "▴" : "›"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT image preview */}
        <div className="relative min-h-[240px] lg:min-h-[320px]">
          <Image
            src={previewImg}
            alt={`Day ${data.day} preview`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black/35 via-transparent to-transparent" />
          <div className="absolute inset-0 [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-white/10 bg-black/20 px-6 md:px-8 py-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <ExpandedBlock
              label="Morning"
              items={[
                "Breakfast + light start",
                "Top landmark / museum slot",
                "Smart travel-time routing",
              ]}
            />
            <ExpandedBlock
              label="Afternoon"
              items={[
                "Lunch near next stop",
                "Main activity / tour",
                "Budget meter check",
              ]}
            />
            <ExpandedBlock
              label="Evening"
              items={[
                "Sunset viewpoint / cruise",
                "Dinner (balanced timing)",
                "Low-fatigue return route",
              ]}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {/* Placeholder: later this links to Timeline Editor / Rebuild Day */}
            <Link
              href={`/ready-plans/${planId}/day/${data.day}`}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-white/85 hover:bg-white/10 transition"
            >
              Open full Day {data.day} details
            </Link>

            <Link
              href="/pricing"
              className="rounded-full px-5 py-2 text-sm font-semibold text-black"
              style={{
                background: `linear-gradient(135deg, ${ORANGE}, rgba(255,200,140,0.95))`,
                boxShadow: "0 16px 50px rgba(255,122,0,0.18)",
              }}
            >
              Unlock to Edit & Book
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpandedBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="text-[11px] uppercase tracking-[0.22em] text-white/55">
        {label}
      </div>
      <div className="mt-3 space-y-2 text-sm text-white/75">
        {items.map((x) => (
          <div key={x} className="flex gap-2">
            <span
              className="mt-[7px] h-[6px] w-[6px] rounded-full"
              style={{ backgroundColor: "rgba(255,122,0,0.85)" }}
            />
            <span>{x}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReadyPlanAdventure({
  planId,
  days,
}: {
  planId: string;
  days: number;
}) {
  const [openDay, setOpenDay] = useState<number | null>(1);

  const data = useMemo<DayData[]>(() => {
    const count = Math.max(1, Math.min(30, days || 5));
    return Array.from({ length: count }).map((_, idx) => {
      const day = idx + 1;
      return {
        day,
        title:
          day === 1
            ? "Arrive & Eiffel Tower"
            : day === 2
            ? "Classic Highlights Day"
            : day === 3
            ? "Culture + Hidden Gems"
            : day === 4
            ? "Signature Experience"
            : "Relax + Departure",
        bullets:
          day === 1
            ? ["Arrival in Paris", "Eiffel Tower evening tour", "Seine River cruise"]
            : ["Morning highlight slot", "Main activity / tour", "Cinematic evening plan"],
        image: day === 1 ? "/images/paris-day1.png" : "/images/paris-day1.png",
      };
    });
  }, [days]);

  return (
    <div className="mt-6 space-y-5">
      {data.map((d) => (
        <DayCard
          key={d.day}
          planId={planId}
          data={d}
          open={openDay === d.day}
          onToggle={() => setOpenDay((prev) => (prev === d.day ? null : d.day))}
        />
      ))}
    </div>
  );
}
