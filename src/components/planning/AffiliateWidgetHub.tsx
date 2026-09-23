"use client";

import { useEffect, useRef, useState } from "react";
import {
  Car,
  Hotel,
  MapPinned,
  Plane,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Ticket,
} from "lucide-react";

type WidgetDefinition = {
  id: string;
  label: string;
  description: string;
  icon: typeof Plane;
  src?: string;
};

const widgets: WidgetDefinition[] = [
  {
    id: "flights",
    label: "Flights",
    description: "Search routes and compare flight options.",
    icon: Plane,
    src: "https://tpscr.com/content?currency=usd&trs=142507&shmarker=329171&locale=en&stops=any&show_hotels=true&powered_by=true&border_radius=0&plain=true&color_button=%2355a539&color_button_text=%23ffffff&promo_id=3414&campaign_id=111",
  },
  {
    id: "rental-cars",
    label: "Rental Cars",
    description: "Find a car for airport pickup or road trips.",
    icon: Car,
    src: "https://tpscr.com/content?trs=142507&shmarker=329171&locale=en&powered_by=true&border_radius=0&plain=true&show_logo=true&color_background=%23FFFFFF&color_button=%2355a539&color_text=%23000000&color_input_text=%23000000&color_button_text=%23ffffff&promo_id=4480&campaign_id=10",
  },
  {
    id: "hotels",
    label: "Hotels",
    description: "Search accommodation for your selected dates.",
    icon: Hotel,
    src: process.env.NEXT_PUBLIC_TRAVELPAYOUTS_HOTELS_WIDGET_URL,
  },
  {
    id: "esim",
    label: "eSIM",
    description: "Arrange mobile data before departure.",
    icon: Smartphone,
    src: "https://tpscr.com/content?trs=142507&shmarker=329171&locale=en&powered_by=true&color_button=%2355a539&color_focused=%23f2685f&secondary=%23FFFFFF&dark=%2311100f&light=%23FFFFFF&special=%23C4C4C4&border_radius=0&plain=false&no_labels=true&promo_id=8588&campaign_id=541",
  },
  {
    id: "activities",
    label: "Activities & Trips",
    description: "Discover tours, attractions, and day trips.",
    icon: Sparkles,
    src: process.env.NEXT_PUBLIC_TRAVELPAYOUTS_ACTIVITIES_WIDGET_URL,
  },
  {
    id: "events",
    label: "Events",
    description: "Find events around your destination.",
    icon: Ticket,
    src: "https://tpscr.com/content?currency=USD&trs=142507&shmarker=329171&language=en&layout=full&orientation=vertical&powered_by=true&campaign_id=89&promo_id=3984",
  },
  {
    id: "taxi",
    label: "Taxi",
    description: "Arrange airport and destination transfers.",
    icon: MapPinned,
    src: process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TAXI_WIDGET_URL,
  },
  {
    id: "insurance",
    label: "Travel Insurance",
    description: "Compare cover for your planned journey.",
    icon: ShieldCheck,
    src: process.env.NEXT_PUBLIC_TRAVELPAYOUTS_INSURANCE_WIDGET_URL,
  },
];

function AffiliateWidget({ widget }: { widget: WidgetDefinition }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !widget.src) return;

    setFailed(false);
    host.replaceChildren();
    const script = document.createElement("script");
    script.async = true;
    script.src = widget.src;
    script.charset = "utf-8";
    script.dataset.geneAffiliateWidget = widget.id;
    script.onerror = () => setFailed(true);
    host.appendChild(script);

    return () => host.replaceChildren();
  }, [widget.id, widget.src]);

  if (!widget.src) {
    return (
      <div className="flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/20 px-5 text-center">
        <div>
          <p className="text-sm font-semibold text-white">Widget setup pending</p>
          <p className="mt-2 max-w-md text-xs leading-5 text-white/55">
            Add this provider&apos;s exact affiliate widget URL to the matching Vercel environment variable to enable it safely.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white p-2 sm:p-4">
      {failed ? (
        <div className="flex min-h-40 items-center justify-center px-4 text-center text-sm text-red-700">
          This booking widget could not load. Please try again.
        </div>
      ) : null}
      <div ref={hostRef} className={failed ? "hidden" : "min-h-40 w-full overflow-x-auto"} />
    </div>
  );
}

export default function AffiliateWidgetHub() {
  const [activeId, setActiveId] = useState(widgets[0].id);
  const activeWidget = widgets.find((widget) => widget.id === activeId) || widgets[0];

  return (
    <section className="mx-auto mt-6 w-full max-w-7xl px-3 pb-10 md:px-8 lg:px-12" aria-labelledby="trip-booking-tools">
      <div className="rounded-[28px] border border-white/10 bg-white/8 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:rounded-[32px] md:p-7">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#ffb066] md:text-xs md:tracking-[0.28em]">
          Affiliate booking tools
        </p>
        <h2 id="trip-booking-tools" className="mt-2 text-[22px] font-semibold md:text-3xl">
          Build and book your trip in one place
        </h2>
        <p className="mt-2 max-w-3xl text-[13px] leading-6 text-white/60 md:text-sm">
          Select a service to open its booking widget. Provider availability and prices are supplied by the affiliate partner.
        </p>

        <div className="scrollbar-hide mt-5 flex gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible">
          {widgets.map((widget) => {
            const Icon = widget.icon;
            const active = widget.id === activeWidget.id;
            return (
              <button
                key={widget.id}
                type="button"
                onClick={() => setActiveId(widget.id)}
                aria-pressed={active}
                className={`flex min-h-14 min-w-[156px] items-center gap-3 rounded-2xl border px-3 py-3 text-left transition md:min-w-0 ${
                  active
                    ? "border-[#ff7a00]/55 bg-[#ff7a00]/14 text-white shadow-[0_0_28px_rgba(255,122,0,0.15)]"
                    : "border-white/10 bg-black/20 text-white/72 hover:border-[#ff7a00]/30 hover:text-white"
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? "bg-[#ff7a00]" : "bg-white/8"}`}>
                  <Icon size={18} />
                </span>
                <span className="text-xs font-semibold sm:text-sm">{widget.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-[24px] border border-white/10 bg-black/25 p-3 md:p-5">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">{activeWidget.label}</h3>
            <p className="mt-1 text-xs leading-5 text-white/55 md:text-sm">{activeWidget.description}</p>
          </div>
          <AffiliateWidget key={activeWidget.id} widget={activeWidget} />
        </div>
      </div>
    </section>
  );
}
