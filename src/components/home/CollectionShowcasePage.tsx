import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CalendarDays, Globe, MapPin, Search, Tag, User } from "lucide-react";

type DestinationShowcaseCard = {
  title: string;
  country: string;
  description: string;
  image: string;
  href: string;
  featured?: boolean;
};

type OfferShowcaseCard = {
  title: string;
  location: string;
  duration: string;
  price: string;
  discount: string;
  image: string;
  href: string;
};

type EventShowcaseCard = {
  title: string;
  category: string;
  location: string;
  date: string;
  image: string;
  href: string;
};

type CollectionShowcasePageProps =
  | {
      kind: "destinations";
      label: string;
      title: string;
      description: string;
      ctaLabel: string;
      ctaHref: string;
      cards: DestinationShowcaseCard[];
      emptyMessage: string;
      icon: LucideIcon;
    }
  | {
      kind: "offers";
      label: string;
      title: string;
      description: string;
      ctaLabel: string;
      ctaHref: string;
      cards: OfferShowcaseCard[];
      emptyMessage: string;
      icon: LucideIcon;
    }
  | {
      kind: "events";
      label: string;
      title: string;
      description: string;
      ctaLabel: string;
      ctaHref: string;
      cards: EventShowcaseCard[];
      emptyMessage: string;
      icon: LucideIcon;
    };

const footerLinks = [
  { label: "About Us", href: "/" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Help Center", href: "/signin" },
];

export default function CollectionShowcasePage(props: CollectionShowcasePageProps) {
  const Icon = props.icon;

  return (
    <>
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f7f0e5_0%,#f8f2e8_42%,#f4eadc_100%)] text-[#17120d]">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.18),transparent_58%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-[radial-gradient(circle_at_bottom,rgba(40,28,21,0.08),transparent_55%)]" />

        <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 md:px-8">
          <div className="grid gap-12 xl:grid-cols-[300px_1fr]">
            <div className="xl:sticky xl:top-28 xl:self-start">
              <div className="inline-flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#c56b1a]">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#ff7a00]/18 bg-white/70 shadow-[0_14px_34px_rgba(38,20,9,0.08)]">
                  <Icon size={18} />
                </span>
                {props.label}
              </div>

              <h1 className="mt-7 max-w-[10ch] text-5xl font-semibold uppercase leading-[0.9] tracking-[-0.04em] text-[#17120d] md:text-6xl">
                {props.title}
              </h1>

              <p className="mt-6 max-w-xs text-sm leading-7 text-[#4f4338] md:text-[15px]">
                {props.description}
              </p>

              <Link
                href={props.ctaHref}
                className="mt-9 inline-flex items-center gap-3 rounded-full bg-[#111111] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(17,17,17,0.22)]"
              >
                {props.ctaLabel}
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/12 bg-[#ff7a00] text-black shadow-[0_0_18px_rgba(255,122,0,0.42)]">
                  <ArrowRight size={14} />
                </span>
              </Link>
            </div>

            <div className="space-y-7">
              <div className="h-px bg-[linear-gradient(90deg,rgba(17,17,17,0.08),rgba(17,17,17,0.18),rgba(17,17,17,0.08))]" />

              {props.cards.length === 0 ? (
                <div className="rounded-[32px] border border-black/8 bg-white/60 p-8 shadow-[0_20px_60px_rgba(35,20,8,0.08)] backdrop-blur-md">
                  <p className="text-sm leading-7 text-[#4f4338]">{props.emptyMessage}</p>
                </div>
              ) : null}

              {props.kind === "destinations" ? (
                <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
                  {props.cards.map((card) => (
                    <DestinationCard key={`${card.title}-${card.country}-${card.href}`} card={card} />
                  ))}
                </div>
              ) : null}

              {props.kind === "offers" ? (
                <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
                  {props.cards.map((card) => (
                    <OfferCard key={`${card.title}-${card.location}-${card.href}`} card={card} />
                  ))}
                </div>
              ) : null}

              {props.kind === "events" ? (
                <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
                  {props.cards.map((card) => (
                    <EventCard key={`${card.title}-${card.location}-${card.href}`} card={card} />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <BottomSmartPlanBanner />

      <footer className="bg-[#0d131b] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/92">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Globe size={18} />
            </span>
            Gene Travel
          </div>

          <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/72">
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <FooterIcon href="https://instagram.com" label="Discover">
              <Search size={16} />
            </FooterIcon>
            <FooterIcon href="https://facebook.com" label="Profile">
              <User size={16} />
            </FooterIcon>
            <FooterIcon href="https://twitter.com" label="Offers">
              <Tag size={16} />
            </FooterIcon>
            <FooterIcon href="https://youtube.com" label="Events">
              <CalendarDays size={16} />
            </FooterIcon>
          </div>
        </div>
      </footer>
    </>
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
          <p className="mt-3 text-sm leading-6 text-white/78">{card.description}</p>
        </div>

        <span className="mb-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#ff7a00]/65 bg-black/45 text-[#ffb15f] shadow-[0_0_0_rgba(255,122,0,0)] transition duration-300 group-hover:shadow-[0_0_22px_rgba(255,122,0,0.45)]">
          <ArrowRight size={18} />
        </span>
      </div>
    </Link>
  );
}

function OfferCard({ card }: { card: OfferShowcaseCard }) {
  return (
    <div className="group relative overflow-hidden rounded-[32px] border border-black/8 bg-[#181513] shadow-[0_28px_60px_rgba(36,24,13,0.14)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_36px_72px_rgba(36,24,13,0.2)]">
      <Image
        src={card.image}
        alt={card.title}
        fill
        className="object-cover transition duration-500 group-hover:scale-[1.06]"
        sizes="(max-width: 1280px) 100vw, 33vw"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,9,7,0.06)_0%,rgba(13,9,7,0.12)_28%,rgba(13,9,7,0.92)_100%)]" />

      <div className="absolute left-4 top-4 rounded-full bg-[#ff7a00] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_12px_24px_rgba(255,122,0,0.3)]">
        {card.discount}
      </div>

      <div className="relative flex min-h-[390px] flex-col justify-end p-5 text-white">
        <div className="text-[30px] font-semibold leading-none tracking-[-0.04em]">{card.title}</div>
        <div className="mt-4 flex items-center gap-2 text-sm text-white/82">
          <MapPin size={15} className="text-[#ffb15f]" />
          {card.location}
        </div>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-sm text-white/76">{card.duration}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.16em] text-white/62">Starting from</div>
            <div className="mt-2 text-4xl font-semibold leading-none tracking-[-0.05em]">{card.price}</div>
            <div className="mt-1 text-sm text-white/72">/person</div>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href={card.href}
            className="inline-flex items-center gap-3 rounded-full border border-white/18 bg-black/35 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition duration-300 hover:border-[#ff7a00]/45 hover:bg-black/55"
          >
            View Offer
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#ff7a00]/45 bg-black/30 text-[#ffb15f] transition duration-300 group-hover:shadow-[0_0_18px_rgba(255,122,0,0.4)]">
              <ArrowRight size={15} />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function EventCard({ card }: { card: EventShowcaseCard }) {
  return (
    <Link
      href={card.href}
      className="group relative flex min-h-[390px] overflow-hidden rounded-[30px] border border-black/8 bg-[#171411] shadow-[0_28px_60px_rgba(36,24,13,0.14)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_34px_70px_rgba(36,24,13,0.2)]"
    >
      <Image
        src={card.image}
        alt={card.title}
        fill
        className="object-cover transition duration-500 group-hover:scale-[1.06]"
        sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 25vw"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,9,7,0.06)_0%,rgba(13,9,7,0.16)_32%,rgba(13,9,7,0.92)_100%)]" />

      <div className="absolute left-4 top-4 rounded-full bg-[#ff7a00] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white shadow-[0_10px_20px_rgba(255,122,0,0.3)]">
        {card.category}
      </div>

      <div className="relative mt-auto flex w-full items-end justify-between gap-4 p-5 text-white">
        <div className="max-w-[80%]">
          <div className="text-[30px] font-semibold leading-none tracking-[-0.04em]">{card.title}</div>
          <div className="mt-4 flex items-center gap-2 text-sm text-white/82">
            <MapPin size={15} className="text-[#ffb15f]" />
            {card.location}
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/82">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[#ffb15f]">
              <ArrowRight size={10} className="rotate-45" />
            </span>
            {card.date}
          </div>
        </div>

        <span className="mb-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#ff7a00]/65 bg-black/45 text-[#ffb15f] shadow-[0_0_0_rgba(255,122,0,0)] transition duration-300 group-hover:shadow-[0_0_22px_rgba(255,122,0,0.45)]">
          <ArrowRight size={18} />
        </span>
      </div>
    </Link>
  );
}

function BottomSmartPlanBanner() {
  return (
    <section className="bg-[linear-gradient(180deg,#f4eadc_0%,#0d131b_100%)] px-5 pb-0 pt-6 md:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px]">
        <div className="relative min-h-[280px]">
          <Image
            src="/images/customize-band.jpg"
            alt="Luxury travel evening banner"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,16,24,0.84)_0%,rgba(9,16,24,0.52)_44%,rgba(9,16,24,0.38)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,122,0,0.24),transparent_28%)]" />

          <div className="relative flex h-full min-h-[280px] flex-col justify-between gap-8 px-8 py-10 md:px-12 lg:flex-row lg:items-center">
            <div className="max-w-xl text-white">
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.04em] md:text-5xl">
                Your next journey starts with one smart plan.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/78 md:text-base">
                Let AI craft the perfect itinerary for you.
              </p>
            </div>

            <Link
              href="/ai-planner"
              className="inline-flex items-center justify-center gap-3 rounded-[24px] bg-[linear-gradient(135deg,#ff7a00,#ffb24b)] px-8 py-5 text-sm font-semibold uppercase tracking-[0.14em] text-white shadow-[0_24px_50px_rgba(255,122,0,0.34)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(255,122,0,0.42)]"
            >
              Plan Smarter With AI
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FooterIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/82 transition hover:border-[#ff7a00]/35 hover:text-[#ffb15f]"
    >
      {children}
    </a>
  );
}
