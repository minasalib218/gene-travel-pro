"use client";

import Link from "next/link";
import { CalendarDays, LayoutDashboard, Plane, Sparkles, User } from "lucide-react";

type ActivePage = "profile" | "trips" | "create" | "bookings" | "control";

const items = [
  { key: "profile", href: "/profile", label: "Profile", icon: User },
  { key: "trips", href: "/profile/trips", label: "Trips", icon: Plane },
  { key: "create", href: "/profile/create-plan", label: "Create", icon: Sparkles },
  { key: "bookings", href: "/profile/bookings-reminders", label: "Bookings", icon: CalendarDays },
  { key: "control", href: "/profile/control-centre", label: "Control", icon: LayoutDashboard },
] as const;

export default function ProfileMobileNav({ active }: { active: ActivePage }) {
  return (
    <nav
      aria-label="Profile navigation"
      className="fixed inset-x-2 bottom-2 z-50 grid grid-cols-5 rounded-2xl border border-white/12 bg-[#08111a]/95 px-1.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_18px_55px_rgba(0,0,0,.5)] backdrop-blur-2xl lg:hidden"
    >
      {items.map((item) => {
        const selected = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={selected ? "page" : undefined}
            className={`flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-[9px] font-semibold transition active:bg-white/10 sm:text-[10px] ${selected ? "bg-white/[0.06] text-[#ff9b43]" : "text-white/62"}`}
          >
            <item.icon className={`h-[17px] w-[17px] ${selected ? "text-[#ff7a00]" : "text-white/68"}`} />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
