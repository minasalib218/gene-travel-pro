"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Heart, X } from "lucide-react";

const fallbackImages = [
  "/images/Santorini.avif",
  "/images/Norway.avif",
  "/images/Maldives.jfif",
  "/images/china.jpg",
  "/bg/home-hero-bottom-optimized.jpg",
];

function imageFor(index: number, provided?: string | null) {
  return provided || fallbackImages[index % fallbackImages.length];
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.035] p-5 text-sm leading-6 text-white/58">
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, href }: { icon: any; title: string; href?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-3 text-xl font-bold">
        <Icon className="h-5 w-5 text-[#ff7a00]" />
        {title}
      </h2>
      {href ? (
        <Link href={href} className="text-sm text-[#8ccfff]">
          View all
        </Link>
      ) : null}
    </div>
  );
}

function GlassCard({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div
      {...props}
      className={`border border-white/10 bg-[#101c27]/78 shadow-[0_22px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}

function RemoveButton({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={label}
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        setPending(true);
        try {
          await onRemove();
        } finally {
          setPending(false);
        }
      }}
      className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-[0_10px_24px_rgba(0,0,0,0.25)] backdrop-blur-md transition hover:scale-105 hover:border-[#ff7a00]/55 hover:text-[#ffb36c] disabled:opacity-60"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export default function ProfileFavoritesClient({
  favoritePlans = [],
  savedReadyPlans = [],
  favoriteDestinations = [],
  wishlistItems = [],
}: {
  favoritePlans?: any[];
  savedReadyPlans?: any[];
  favoriteDestinations?: any[];
  wishlistItems?: any[];
}) {
  const [plans, setPlans] = useState<any[]>((favoritePlans.length ? favoritePlans : savedReadyPlans).slice(0, 12));
  const [destinations, setDestinations] = useState<any[]>(favoriteDestinations.slice(0, 12));
  const [wishlist, setWishlist] = useState<any[]>(wishlistItems.slice(0, 16));

  const savedItemCount = useMemo(() => destinations.length + wishlist.length, [destinations.length, wishlist.length]);

  async function removeReadyPlan(plan: any) {
    const previous = plans;
    setPlans((items) => items.filter((item) => item.id !== plan.id));
    const response = await fetch("/api/profile/favorites", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ readyPlanId: plan.id }),
    });
    if (!response.ok) {
      setPlans(previous);
      return;
    }
    window.dispatchEvent(
      new CustomEvent("gene:ready-plan-favorite-change", {
        detail: { readyPlanId: plan.id, kind: "ready_plan", id: plan.id, saved: false },
      }),
    );
  }

  async function removeDestination(destination: any) {
    const previous = destinations;
    setDestinations((items) => items.filter((item) => item.id !== destination.id));
    const response = await fetch("/api/profile/destinations", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ destinationId: destination.id }),
    });
    if (!response.ok) {
      setDestinations(previous);
      return;
    }
    window.dispatchEvent(
      new CustomEvent("gene:home-favorite-change", {
        detail: { kind: "destination", id: destination.id, title: destination.title, saved: false },
      }),
    );
  }

  async function removeWishlistItem(item: any) {
    const previous = wishlist;
    setWishlist((items) => items.filter((entry) => entry.id !== item.id));
    const sourceId = typeof item?.metadata?.sourceId === "string" ? item.metadata.sourceId : undefined;
    const response = await fetch("/api/profile/wishlist", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        sourceId,
        itemType: item.itemType,
        title: item.title,
        href: item.href,
      }),
    });
    if (!response.ok) {
      setWishlist(previous);
      return;
    }
    window.dispatchEvent(
      new CustomEvent("gene:home-favorite-change", {
        detail: {
          kind: item?.metadata?.homeItemType || item.itemType,
          id: sourceId,
          href: item.href,
          title: item.title,
          saved: false,
        },
      }),
    );
  }

  return (
    <>
      <GlassCard id="favorite-plans" className="scroll-mt-24 rounded-2xl p-5">
        <SectionHeader icon={Heart} title="Favorite Plans" href="/ready-plans" />
        {plans.length === 0 ? (
          <EmptyState>No favorite plans yet. Tap a heart on any Ready Plan to save it here.</EmptyState>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {plans.map((plan, index) => {
              const title = plan?.title || "Saved plan";
              const slug = plan?.slug || "";
              const img = imageFor(index + 2, plan?.coverImage || plan?.heroImage);

              return (
                <div key={plan.id} className="relative min-w-[190px] overflow-hidden rounded-xl border border-white/10 bg-[#111b25]">
                  <RemoveButton label={`Remove ${title} from favorites`} onRemove={() => removeReadyPlan(plan)} />
                  <Link href={slug ? `/ready-plans/${slug}` : "/ready-plans"} className="group block">
                    <div className="relative h-28">
                      <Image src={img} alt={title} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="220px" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/75" />
                      <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-[#ff6d8e]">
                        <Heart className="h-4 w-4 fill-current" />
                      </div>
                    </div>
                    <div className="p-3 text-sm font-semibold leading-5 text-white">{title}</div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      <GlassCard id="favorite-items" className="scroll-mt-24 rounded-2xl p-5">
        <SectionHeader icon={BookOpen} title="Favorite Items" href="/destinations" />
        {savedItemCount === 0 ? (
          <EmptyState>Tap hearts on destinations, offers, and events to collect them here.</EmptyState>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {destinations.map((destination, index) => {
              const title = destination?.title || "Saved destination";
              const slug = destination?.slug || "";
              const img = imageFor(index + 4, destination?.imageUrl || destination?.iconUrl);

              return (
                <div key={`destination-${destination.id}`} className="relative min-w-[210px] overflow-hidden rounded-xl border border-white/10 bg-[#111b25]">
                  <RemoveButton label={`Remove ${title} from favorites`} onRemove={() => removeDestination(destination)} />
                  <Link href={slug ? `/destinations/${slug}` : "/destinations"} className="group block">
                    <div className="relative h-28">
                      <Image src={img} alt={title} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="230px" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/78" />
                      <div className="absolute left-3 top-3 rounded-full bg-[#ff7a00]/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                        Destination
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="line-clamp-2 text-sm font-bold leading-5 text-white">{title}</div>
                      <div className="mt-1 text-xs capitalize text-white/55">{String(destination?.section || "Saved place").replace(/_/g, " ")}</div>
                    </div>
                  </Link>
                </div>
              );
            })}

            {wishlist.map((item, index) => {
              const title = item?.title || "Saved item";
              const href = item?.href || "/profile";
              const img = imageFor(index + 6, item?.imageUrl);
              const type = String(item?.metadata?.homeItemType || item?.itemType || "saved").replace(/_/g, " ");

              return (
                <div key={`wishlist-${item.id}`} className="relative min-w-[210px] overflow-hidden rounded-xl border border-white/10 bg-[#111b25]">
                  <RemoveButton label={`Remove ${title} from favorites`} onRemove={() => removeWishlistItem(item)} />
                  <Link href={href.startsWith("http") ? "/profile" : href} className="group block">
                    <div className="relative h-28">
                      <Image src={img} alt={title} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="230px" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/78" />
                      <div className="absolute left-3 top-3 rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white backdrop-blur-md">
                        {type}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="line-clamp-2 text-sm font-bold leading-5 text-white">{title}</div>
                      <div className="mt-1 text-xs text-white/55">{item?.destination || item?.provider || "Gene Travel"}</div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </>
  );
}
