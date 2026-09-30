"use client";

import Link from "next/link";
import { Heart, Home, Plane, Plus, User } from "lucide-react";

type ActivePage = "profile" | "trips" | "create" | "bookings" | "control" | "favorites";

const items = [
  { key: "home", href: "/", label: "Home", icon: Home },
  { key: "trips", href: "/profile/trips", label: "Trips", icon: Plane },
  { key: "create", href: "/profile/create-plan", label: "Plan", icon: Plus },
  { key: "favorites", href: "/profile/favorites", label: "Favorites", icon: Heart },
  { key: "profile", href: "/profile", label: "Profile", icon: User },
] as const;

export default function ProfileMobileNav({ active }: { active: ActivePage }) {
  return (
    <nav
      aria-label="Profile navigation"
      className="fixed inset-x-2 bottom-2 z-50 grid grid-cols-5 rounded-2xl border border-white/12 bg-[#08111a]/95 px-1.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_18px_55px_rgba(0,0,0,.5)] backdrop-blur-2xl lg:hidden"
    >
      {items.map((item) => {
        const selected = item.key === active || ((active === "bookings" || active === "control") && item.key === "profile");
        const isPlan = item.key === "create";
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={selected ? "page" : undefined}
            className={`relative flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-[9px] font-semibold transition active:bg-white/10 sm:text-[10px] ${selected ? "text-[#ff9b43]" : "text-white/62"}`}
          >
            <span className={isPlan ? "-mt-8 flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#08111a] bg-[#ff7a00] text-white shadow-[0_8px_28px_rgba(255,122,0,.5)]" : ""}>
              <item.icon className={`${isPlan ? "h-6 w-6" : "h-[18px] w-[18px]"} ${selected || isPlan ? "text-[#ff7a00]" : "text-white/68"} ${isPlan ? "!text-white" : ""}`} />
            </span>
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
