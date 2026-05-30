"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Globe,
  MapPin,
  Search,
  Tag,
  User,
} from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import LanguageMenu from "@/components/i18n/LanguageMenu";
import { trackLead, trackSelectItem } from "@/lib/analytics";

export type HomeSlide = {
  title: string;
  subtitle: string;
  image: string;
  preview: string;
  href: string;
  eyebrow: string;
  note: string;
  price: string;
};

type ContentCard = {
  title: string;
  subtitle: string;
  image: string;
  href: string;
  cta: string;
};

type DestinationFeatureCard = {
  title: string;
  country: string;
  description: string;
  image: string;
  href: string;
  featured?: boolean;
};

type OfferFeatureCard = {
  title: string;
  location: string;
  duration: string;
  price: string;
  discount: string;
  image: string;
  href: string;
};

type EventFeatureCard = {
  title: string;
  category: string;
  location: string;
  date: string;
  image: string;
  href: string;
};

const destinationFeatureCards: DestinationFeatureCard[] = [
  {
    title: "Santorini",
    country: "Greece",
    description: "Iconic sunsets, white architecture, and endless blue calm.",
    image: "/bg/home-hero-bottom.png",
    href: "/destinations",
  },
  {
    title: "Milford Sound",
    country: "New Zealand",
    description: "Breathtaking fjords and dramatic natural beauty.",
    image: "/images/patagonia.jpg",
    href: "/destinations",
  },
  {
    title: "Phuket",
    country: "Thailand",
    description: "Tropical beaches and vibrant culture await you.",
    image: "/images/middle-bg.jpg",
    href: "/destinations",
  },
  {
    title: "Zermatt",
    country: "Switzerland",
    description: "Where the Alps touch the sky and adventure begins.",
    image: "/images/paris.jpg",
    href: "/destinations",
    featured: true,
  },
];

const defaultOfferFeatureCards: OfferFeatureCard[] = [
  {
    title: "Maldives Escape",
    location: "Maldives",
    duration: "5 Days / 4 Nights",
    price: "$899",
    discount: "SAVE 20%",
    image: "/images/customize-band.jpg",
    href: "/offers",
  },
  {
    title: "Dubai Luxury Getaway",
    location: "Dubai, UAE",
    duration: "4 Days / 3 Nights",
    price: "$699",
    discount: "SAVE 15%",
    image: "/images/dubai.jpg",
    href: "/offers",
  },
  {
    title: "Bali Paradise",
    location: "Bali, Indonesia",
    duration: "6 Days / 5 Nights",
    price: "$749",
    discount: "SAVE 25%",
    image: "/images/patagonia.jpg",
    href: "/offers",
  },
];

const defaultEventFeatureCards: EventFeatureCard[] = [
  {
    title: "Yi Peng Lantern Festival",
    category: "Festival",
    location: "Chiang Mai, Thailand",
    date: "Nov 15 - Nov 16, 2024",
    image: "/images/middle-bg.jpg",
    href: "/events",
  },
  {
    title: "Tomorrowland Festival",
    category: "Music",
    location: "Boom, Belgium",
    date: "Jul 19 - Jul 21, 2024",
    image: "/images/barcelona.jpg",
    href: "/events",
  },
  {
    title: "Rio Carnival",
    category: "Culture",
    location: "Brazil",
    date: "Feb 28 - Mar 08, 2025",
    image: "/images/rome.jpg",
    href: "/events",
  },
  {
    title: "America's Cup Regatta",
    category: "Sports",
    location: "Barcelona, Spain",
    date: "Aug 22 - Oct 27, 2024",
    image: "/images/barcelona.jpg",
    href: "/events",
  },
];

function localizeSlide(
  slide: HomeSlide,
  t: (key: string, fallback?: string) => string,
): HomeSlide {
  const keyMap: Record<
    string,
    {
      title: string;
      subtitle: string;
      eyebrow: string;
      note: string;
      price: string;
    }
  > = {
    "Dubai Luxury Weekend": {
      title: "home.slide.dubai.title",
      subtitle: "home.slide.dubai.subtitle",
      eyebrow: "home.slide.dubai.eyebrow",
      note: "home.slide.dubai.note",
      price: "home.slide.dubai.price",
    },
    "Paris Romantic Escape": {
      title: "home.slide.paris.title",
      subtitle: "home.slide.paris.subtitle",
      eyebrow: "home.slide.paris.eyebrow",
      note: "home.slide.paris.note",
      price: "home.slide.paris.price",
    },
    "Istanbul Culture Journey": {
      title: "home.slide.istanbul.title",
      subtitle: "home.slide.istanbul.subtitle",
      eyebrow: "home.slide.istanbul.eyebrow",
      note: "home.slide.istanbul.note",
      price: "home.slide.istanbul.price",
    },
    "Morocco Desert Story": {
      title: "home.slide.morocco.title",
      subtitle: "home.slide.morocco.subtitle",
      eyebrow: "home.slide.morocco.eyebrow",
      note: "home.slide.morocco.note",
      price: "home.slide.morocco.price",
    },
  };

  const keys = keyMap[slide.title];
  if (!keys) return slide;

  return {
    ...slide,
    title: t(keys.title, slide.title),
    subtitle: t(keys.subtitle, slide.subtitle),
    eyebrow: t(keys.eyebrow, slide.eyebrow),
    note: t(keys.note, slide.note),
    price: t(keys.price, slide.price),
  };
}

function clampIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

export default function HomeHeroClient({
  slides,
  destinationCards = [],
  offerCards = [],
  eventCards = [],
}: {
  slides: HomeSlide[];
  destinationCards?: DestinationFeatureCard[];
  offerCards?: ContentCard[];
  eventCards?: ContentCard[];
}) {
  const { t } = useLanguage();
  const localizedSlides = useMemo(
    () => slides.map((slide) => localizeSlide(slide, t)),
    [slides, t],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "exit-left" | "exit-right" | "enter-left" | "enter-right">("idle");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const slideCount = Math.max(localizedSlides.length, 1);
  const timeoutsRef = useRef<number[]>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const displayIndex = previewIndex ?? activeIndex;
  const activeSlide = localizedSlides[clampIndex(displayIndex, slideCount)];
  const visibleCards = useMemo(
    () => [1, 2, 3].map((offset) => localizedSlides[clampIndex(activeIndex + offset, slideCount)]),
    [activeIndex, localizedSlides, slideCount],
  );
  const searchCards = useMemo(
    () => [
      ...localizedSlides.map((slide) => ({
        title: slide.title,
        subtitle: slide.eyebrow,
        href: slide.href,
      })),
      ...offerCards.map((card) => ({
        title: card.title,
        subtitle: card.subtitle,
        href: card.href,
      })),
      ...eventCards.map((card) => ({
        title: card.title,
        subtitle: card.subtitle,
        href: card.href,
      })),
    ],
    [eventCards, localizedSlides, offerCards],
  );
  const filteredSearchCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return searchCards.slice(0, 6);
    return searchCards
      .filter((card) => `${card.title} ${card.subtitle}`.toLowerCase().includes(query))
      .slice(0, 6);
  }, [searchCards, searchQuery]);

  const destinationCardsToShow = destinationCards.length > 0 ? destinationCards : destinationFeatureCards;

  const offersShowcase = useMemo<OfferFeatureCard[]>(() => {
    if (offerCards.length >= 3) {
      return offerCards.slice(0, 3).map((card, index) => ({
        title: card.title,
        location: card.subtitle || "Curated destination",
        duration: index === 0 ? "5 Days / 4 Nights" : index === 1 ? "4 Days / 3 Nights" : "6 Days / 5 Nights",
        price: index === 0 ? "$899" : index === 1 ? "$699" : "$749",
        discount: index === 0 ? "SAVE 20%" : index === 1 ? "SAVE 15%" : "SAVE 25%",
        image: card.image,
        href: card.href,
      }));
    }
    return defaultOfferFeatureCards;
  }, [offerCards]);

  const eventsShowcase = useMemo<EventFeatureCard[]>(() => {
    if (eventCards.length >= 3) {
      const mapped = eventCards.slice(0, 4).map((card, index) => ({
        title: card.title,
        category: index === 0 ? "Festival" : index === 1 ? "Music" : index === 2 ? "Culture" : "Sports",
        location: card.subtitle || "Curated event location",
        date:
          index === 0
            ? "Nov 15 - Nov 16, 2024"
            : index === 1
              ? "Jul 19 - Jul 21, 2024"
              : index === 2
                ? "Feb 28 - Mar 08, 2025"
                : "Aug 22 - Oct 27, 2024",
        image: card.image,
        href: card.href,
      }));
      return mapped.length === 4 ? mapped : [...mapped, ...defaultEventFeatureCards.slice(mapped.length, 4)];
    }
    return defaultEventFeatureCards;
  }, [eventCards]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  useEffect(() => {
    if (searchOpen) {
      window.setTimeout(() => searchInputRef.current?.focus(), 20);
    }
  }, [searchOpen]);

  function queueTransition(nextIndex: number, direction: -1 | 1) {
    if (slideCount <= 1 || nextIndex === activeIndex || phase !== "idle") return;

    setPreviewIndex(null);
    setPhase(direction === 1 ? "exit-left" : "exit-right");

    const swapTimeout = window.setTimeout(() => {
      setActiveIndex(nextIndex);
      setPhase(direction === 1 ? "enter-right" : "enter-left");
    }, 240);

    const settleTimeout = window.setTimeout(() => {
      setPhase("idle");
    }, 720);

    timeoutsRef.current.push(swapTimeout, settleTimeout);
  }

  function move(direction: -1 | 1) {
    queueTransition(clampIndex(activeIndex + direction, slideCount), direction);
  }

  function handleCardHover(targetTitle: string) {
    const targetIndex = localizedSlides.findIndex((slide) => slide.title === targetTitle);
    if (targetIndex === -1) return;
    setPreviewIndex(targetIndex);
  }

  function getCardMotion(index: number) {
    if (phase === "exit-left") {
      return index === 0
        ? { animation: "cardExitLeft 320ms cubic-bezier(0.22, 1, 0.36, 1) both" }
        : undefined;
    }

    if (phase === "enter-right") {
      return { animation: `cardEnterRight 560ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 90}ms both` };
    }

    if (phase === "enter-left") {
      return { animation: `cardEnterLeft 560ms cubic-bezier(0.22, 1, 0.36, 1) ${(2 - index) * 90}ms both` };
    }

    return undefined;
  }

  return (
    <main className="min-h-screen bg-[#6f767b] text-white">
      <div className="mx-auto">
        <section className="relative min-h-screen overflow-hidden bg-[#62747d]">
          <div className="absolute inset-0">
            <Image
              src={activeSlide.preview}
              alt={activeSlide.title}
              fill
              priority
              className="object-cover transition-all duration-700"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(58,74,84,0.88)_0%,rgba(71,87,96,0.55)_38%,rgba(45,53,59,0.55)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.13),transparent_38%)]" />
          </div>

          <div className="relative px-6 pb-10 pt-5 md:px-10 md:pb-12">
            <header className="flex items-center justify-between">
              <div className="flex items-center">
                <Image src="/images/logo.png" alt="Gene Travel" width={200} height={200} />
              </div>

              <div className="hidden items-center gap-6 lg:flex">
                <nav className="flex items-center gap-5 text-[10px] uppercase tracking-[0.22em] text-white/78">
                  <HeroNavLink href="/" active>{t("nav.home","Home")}</HeroNavLink>
                  <HeroNavLink href="/offers">{t("nav.offers","Offers")}</HeroNavLink>
                  <HeroNavLink href="/destinations">{t("nav.destinations","Destinations")}</HeroNavLink>
                  <HeroNavLink href="/signin?entry=home">{t("nav.login","Login")}</HeroNavLink>
                </nav>

                <div className="flex items-center gap-3 text-white/85">
                  <button
                    type="button"
                    onClick={() => setSearchOpen((value) => !value)}
                    className="flex items-center justify-center text-white/82 transition hover:text-white"
                    aria-label={t("nav.search", "Search")}
                  >
                    <Search size={15} />
                  </button>
                  <Link
                    href="/profile"
                    className="flex items-center justify-center text-white/82 transition hover:text-white"
                    aria-label={t("nav.profile", "Profile")}
                  >
                    <User size={15} />
                  </Link>
                  <LanguageMenu embedded />
                </div>

                <Link
                  href="/pricing"
                  onClick={() => trackLead("ai_planner_started", { source: "home_hero_top_cta", contentName: "Plan Smarter With AI" })}
                  className="rounded-full border border-[#ffd17d]/25 bg-[linear-gradient(135deg,rgba(255,138,24,0.96),rgba(255,205,120,0.94))] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-black shadow-[0_0_30px_rgba(255,133,18,0.22)] transition duration-500 hover:shadow-[0_0_42px_rgba(255,133,18,0.34)]"
                >
                  {t("nav.planSmarter","Plan Smarter With AI")}
                </Link>
              </div>
            </header>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                searchOpen ? "mt-5 max-h-80 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="rounded-[22px] border border-white/10 bg-black/35 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
                <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3">
                  <Search size={15} className="text-white/55" />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t("home.search.placeholder", "Search homepage destinations, offers, or events")}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/38"
                  />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filteredSearchCards.map((card) => (
                    <Link
                      key={`${card.href}-${card.title}`}
                      href={card.href}
                      className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
                    >
                      <div className="text-sm font-semibold text-white">{card.title}</div>
                      <div className="mt-1 text-xs text-white/58">{card.subtitle}</div>
                    </Link>
                  ))}
                  {filteredSearchCards.length === 0 ? (
                    <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/58">
                      {t("home.search.empty", "No homepage cards match this search yet.")}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-16 grid gap-10 lg:min-h-[520px] lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
              <div
                key={`text-${activeSlide.title}`}
                className="flex min-h-[390px] max-w-[420px] flex-col justify-end animate-[textReveal_850ms_ease]"
              >
                <div className="h-[3px] w-8 bg-white/85 transition-all duration-700" />
                <div className="mt-8 text-sm text-white/80">{activeSlide.eyebrow}</div>
                <h1 className="mt-3 text-5xl font-semibold uppercase leading-[0.9] tracking-tight md:text-6xl">
                  {activeSlide.title}
                </h1>
                <p className="mt-5 text-sm leading-7 text-white/68">{activeSlide.note}</p>
                <p className="mt-3 text-xs leading-6 text-white/52">{activeSlide.subtitle}</p>
                <div className="mt-3 text-[11px] uppercase tracking-[0.22em] text-[#f1bf55]">
                  {activeSlide.price}
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#efb33a] text-white transition duration-500 hover:shadow-[0_0_20px_rgba(239,179,58,0.45)]">
                    +
                  </button>
                  <Link
                    href={activeSlide.href}
                    className="rounded-full border border-white/40 px-5 py-2 text-[10px] uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
                  >
                    {t("home.hero.discover","Discover Location")}
                  </Link>
                </div>
              </div>

              <div className="self-end overflow-hidden">
                <div
                  key={`cards-${activeSlide.title}`}
                  className="flex items-end gap-4 pb-2 pl-0 lg:pl-4 animate-[cardsReveal_820ms_ease]"
                  onMouseLeave={() => setPreviewIndex(null)}
                >
                  {visibleCards.map((card, index) => (
                    <Link
                      key={`${card.title}-${index}`}
                      href={card.href}
                      onClick={() =>
                        trackSelectItem("ready_plan_clicked", card.title, {
                          title: card.title,
                          subtitle: card.eyebrow,
                          source: "home_hero_cards",
                        })
                      }
                      onMouseEnter={() => handleCardHover(card.title)}
                      className="group relative flex h-[270px] min-w-[150px] flex-1 overflow-hidden rounded-[14px] border border-white/10 bg-black/20 shadow-[0_18px_40px_rgba(0,0,0,0.26)] transition-[border-color,box-shadow,filter] duration-700 ease-out hover:border-white/20 hover:shadow-[0_24px_56px_rgba(0,0,0,0.34)]"
                      style={getCardMotion(index)}
                    >
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        className="object-cover transition duration-700 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/18 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <div className="text-[9px] text-white/72">{card.eyebrow}</div>
                        <div className="mt-3 text-[24px] font-semibold uppercase leading-[0.92] text-white">
                          {card.title}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => move(-1)}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/35 text-white/82 transition duration-500 hover:bg-white/10"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => move(1)}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/35 text-white/82 transition duration-500 hover:bg-white/10"
                >
                  <ChevronRight size={20} />
                </button>
                <div className="ml-3 h-[2px] w-48 bg-white/20 md:w-72">
                  <div
                    className="h-full bg-[#e6bb57] transition-all duration-500"
                    style={{ width: `${((activeIndex + 1) / slideCount) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-4xl font-light text-white/92">
                {String(activeIndex + 1).padStart(2, "0")}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[linear-gradient(180deg,#f7f1e8_0%,#fbf7f0_42%,#f6efe4_100%)] px-5 pb-16 pt-12 text-[#1e1b17] md:px-10">
          <div className="mx-auto max-w-[1540px]">
            <MagazineSection
              label="DESTINATIONS"
              title="EXPLORE THE WORLD"
              description="Handpicked places for your next unforgettable journey."
              ctaLabel="VIEW ALL DESTINATIONS"
              ctaHref="/destinations"
              icon={<MapPin size={18} />}
            >
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {destinationCardsToShow.map((card) => (
                  <DestinationCard key={`${card.title}-${card.country}`} card={card} />
                ))}
              </div>
            </MagazineSection>

            <MagazineSection
              label="OFFERS"
              title="EXCLUSIVE OFFERS"
              description="Limited deals curated for smart travelers."
              ctaLabel="VIEW ALL OFFERS"
              ctaHref="/offers"
              icon={<Tag size={18} />}
            >
              <div className="grid gap-5 xl:grid-cols-3">
                {offersShowcase.map((card) => (
                  <OfferCard key={`${card.title}-${card.location}`} card={card} />
                ))}
              </div>
            </MagazineSection>

            <MagazineSection
              label="EVENTS"
              title="EVENTS WORTH TRAVELING FOR"
              description="Discover festivals, concerts, cultural nights, and seasonal moments."
              ctaLabel="VIEW ALL EVENTS"
              ctaHref="/events"
              icon={<CalendarDays size={18} />}
            >
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {eventsShowcase.map((card) => (
                  <EventCard key={`${card.title}-${card.location}`} card={card} />
                ))}
              </div>
            </MagazineSection>

            <BottomSmartPlanBanner />

            <footer className="mt-8 rounded-[34px] bg-[linear-gradient(180deg,#111a23_0%,#0a1118_100%)] px-8 py-7 text-white shadow-[0_20px_50px_rgba(11,16,22,0.24)]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <Link href="/" className="flex items-center">
                  <Image src="/images/logo.png" alt="Gene Travel" width={190} height={190} />
                </Link>
                <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/72">
                  <Link href="/profile" className="transition hover:text-white">About Us</Link>
                  <Link href="/terms" className="transition hover:text-white">Terms & Conditions</Link>
                  <Link href="/privacy-policy" className="transition hover:text-white">Privacy Policy</Link>
                  <Link href="/refund-policy" className="transition hover:text-white">Help Center</Link>
                </nav>
                <div className="flex items-center gap-3 text-white/75">
                  <SocialIcon href="https://instagram.com" label="Instagram" icon={<Search size={16} />} />
                  <SocialIcon href="https://facebook.com" label="Facebook" icon={<User size={16} />} />
                  <SocialIcon href="https://youtube.com" label="YouTube" icon={<ArrowRight size={16} />} />
                  <SocialIcon href="https://gene.com" label="Website" icon={<Globe size={16} />} />
                </div>
              </div>
            </footer>
          </div>
        </section>
      </div>
      <style jsx global>{`
        @keyframes textReveal {
          0% {
            opacity: 0;
            transform: translateX(36px);
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0);
          }
        }
        @keyframes cardsReveal {
          0% {
            opacity: 0;
            transform: translateX(-38px);
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0);
          }
        }
        @keyframes cardExitLeft {
          0% {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0);
          }
          100% {
            opacity: 0;
            transform: translateX(-58px);
            filter: blur(6px);
          }
        }
        @keyframes cardEnterRight {
          0% {
            opacity: 0;
            transform: translateX(52px);
            filter: blur(6px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0);
          }
        }
        @keyframes cardEnterLeft {
          0% {
            opacity: 0;
            transform: translateX(-52px);
            filter: blur(6px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0);
          }
        }
      `}</style>
    </main>
  );
}

function HeroNavLink({
  href,
  children,
  active = false,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative pb-2 transition ${active ? "text-white" : "text-white/78 hover:text-white"}`}
    >
      {children}
      <span
        className={`absolute bottom-0 left-0 h-[2px] rounded-full bg-[#f1bf55] transition-all duration-500 ${
          active ? "w-full" : "w-0 group-hover:w-full"
        }`}
      />
    </Link>
  );
}

function MagazineSection({
  label,
  title,
  description,
  ctaLabel,
  ctaHref,
  icon,
  children,
}: {
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#dfd3c3] py-10 last:border-b-0">
      <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)] xl:items-start">
        <SectionIntro
          label={label}
          title={title}
          description={description}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
          icon={icon}
        />
        <div>{children}</div>
      </div>
    </section>
  );
}

function SectionIntro({
  label,
  title,
  description,
  ctaLabel,
  ctaHref,
  icon,
}: {
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="xl:sticky xl:top-8">
      <div className="flex items-center gap-3 text-[#ff7a00]">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ff7a00]/20 bg-[#ff7a00]/10">
          {icon}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.24em]">{label}</span>
      </div>
      <h2 className="mt-5 max-w-[220px] text-[44px] font-semibold uppercase leading-[0.92] tracking-[-0.02em] text-[#111317] md:text-[58px]">
        {title}
      </h2>
      <p className="mt-5 max-w-[220px] text-sm leading-7 text-[#62584d]">
        {description}
      </p>
      <Link
        href={ctaHref}
        className="mt-7 inline-flex items-center gap-3 rounded-full bg-[#161a1f] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_14px_30px_rgba(18,22,27,0.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(18,22,27,0.24)]"
      >
        {ctaLabel}
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff7a00] text-white">
          <ArrowRight size={12} />
        </span>
      </Link>
    </div>
  );
}

function DestinationCard({ card }: { card: DestinationFeatureCard }) {
  return (
    <Link
      href={card.href}
      onClick={() =>
        trackSelectItem("destination_clicked", card.title, {
          title: card.title,
          country: card.country,
          source: "home_destinations",
        })
      }
      className="group relative block h-[380px] overflow-hidden rounded-[28px] bg-[#1d2328] shadow-[0_18px_38px_rgba(38,30,22,0.14)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_54px_rgba(38,30,22,0.22)]"
    >
      <Image src={card.image} alt={card.title} fill className="object-cover transition duration-700 group-hover:scale-[1.05]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,14,0.02)_5%,rgba(9,10,12,0.88)_100%)]" />
      {card.featured ? (
        <div className="absolute right-4 top-4 rounded-full bg-[#ff9a1f] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_8px_24px_rgba(255,122,0,0.28)]">
          Featured
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <div className="text-[32px] font-semibold leading-none">{card.title}</div>
        <div className="mt-2 text-lg text-white/88">{card.country}</div>
        <p className="mt-3 max-w-[240px] text-sm leading-6 text-white/72">{card.description}</p>
      </div>
      <span className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/25 text-white backdrop-blur-md transition duration-300 group-hover:border-[#ff7a00]/60 group-hover:bg-[#ff7a00] group-hover:shadow-[0_0_30px_rgba(255,122,0,0.34)]">
        <ArrowRight size={18} />
      </span>
    </Link>
  );
}

function OfferCard({ card }: { card: OfferFeatureCard }) {
  return (
    <Link
      href={card.href}
      onClick={() =>
        trackSelectItem("offer_clicked", card.title, {
          title: card.title,
          location: card.location,
          source: "home_offers",
          value: Number(card.price.replace(/[^0-9.]/g, "")) || 0,
          currency: "USD",
        })
      }
      className="group relative block h-[360px] overflow-hidden rounded-[30px] bg-[#1b2025] shadow-[0_18px_40px_rgba(38,30,22,0.16)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_58px_rgba(38,30,22,0.24)]"
    >
      <Image src={card.image} alt={card.title} fill className="object-cover transition duration-700 group-hover:scale-[1.05]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,12,0.02)_0%,rgba(7,10,12,0.84)_100%)]" />
      <div className="absolute left-4 top-4 rounded-full bg-[#ff8d1b] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_8px_24px_rgba(255,122,0,0.28)]">
        {card.discount}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <div className="text-[30px] font-semibold leading-none">{card.title}</div>
        <div className="mt-3 flex items-center gap-2 text-sm text-white/82">
          <MapPin size={14} className="text-[#ffb15a]" />
          {card.location}
        </div>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-sm text-white/72">{card.duration}</div>
            <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-white/22 bg-black/25 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition duration-300 group-hover:border-[#ffb15a]/60">
              View Offer
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff7a00] text-white">
                <ArrowRight size={12} />
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.18em] text-white/58">Starting from</div>
            <div className="mt-1 text-[40px] font-semibold leading-none">{card.price}</div>
            <div className="mt-1 text-sm text-white/72">/person</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EventCard({ card }: { card: EventFeatureCard }) {
  return (
    <Link
      href={card.href}
      onClick={() =>
        trackSelectItem("event_clicked", card.title, {
          title: card.title,
          location: card.location,
          source: "home_events",
        })
      }
      className="group relative block h-[340px] overflow-hidden rounded-[28px] bg-[#171b20] shadow-[0_16px_36px_rgba(38,30,22,0.14)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_rgba(38,30,22,0.22)]"
    >
      <Image src={card.image} alt={card.title} fill className="object-cover transition duration-700 group-hover:scale-[1.05]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,12,0.03)_0%,rgba(8,10,12,0.9)_100%)]" />
      <div className="absolute left-4 top-4 rounded-full bg-[#ff8d1b] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_8px_24px_rgba(255,122,0,0.24)]">
        {card.category}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <div className="max-w-[220px] text-[29px] font-semibold leading-none">{card.title}</div>
        <div className="mt-3 flex items-center gap-2 text-sm text-white/82">
          <MapPin size={14} className="text-[#ffb15a]" />
          {card.location}
        </div>
        <div className="mt-3 text-sm text-white/72">{card.date}</div>
      </div>
      <span className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/25 text-white backdrop-blur-md transition duration-300 group-hover:border-[#ff7a00]/60 group-hover:bg-[#ff7a00] group-hover:shadow-[0_0_30px_rgba(255,122,0,0.34)]">
        <ArrowRight size={18} />
      </span>
    </Link>
  );
}

function BottomSmartPlanBanner() {
  return (
    <section className="mt-10 overflow-hidden rounded-[34px] shadow-[0_24px_56px_rgba(34,27,19,0.18)]">
      <div className="relative min-h-[240px]">
        <Image src="/bg/home-hero-bottom.png" alt="Plan smarter with AI" fill className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,12,18,0.82)_0%,rgba(12,16,22,0.42)_45%,rgba(7,10,15,0.75)_100%)]" />
        <div className="relative flex h-full flex-col gap-8 px-8 py-10 md:px-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl text-white">
            <h3 className="text-4xl font-semibold leading-tight md:text-5xl">
              Your next journey starts with one smart plan.
            </h3>
            <p className="mt-4 text-base leading-8 text-white/76">
              Let AI craft the perfect itinerary for you.
            </p>
          </div>
          <Link
            href="/ai-planner"
            onClick={() => trackLead("ai_planner_started", { source: "home_bottom_banner", contentName: "Plan Smarter With AI" })}
            className="inline-flex items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#ff7a00,#ffb249)] px-8 py-5 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_0_38px_rgba(255,122,0,0.34)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_52px_rgba(255,122,0,0.46)]"
          >
            Plan Smarter With AI
          </Link>
        </div>
      </div>
    </section>
  );
}

function SocialIcon({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] transition hover:border-[#ff7a00]/40 hover:text-[#ffb15a]"
    >
      {icon}
    </a>
  );
}
