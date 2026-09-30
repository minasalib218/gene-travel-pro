"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Briefcase,
  CalendarDays,
  Coins,
  FileText,
  Headphones,
  Heart,
  LogOut,
  Settings2,
  ShieldCheck,
  Gauge,
  Sparkles,
  Tag,
  User,
  ListChecks,
} from "lucide-react";

const sectionItems = [
  { icon: User, label: "My Profile", section: "profile-overview", href: "/profile" },
  { icon: Briefcase, label: "My Trips", section: "my-trips", href: "/profile/trips" },
  { icon: Heart, label: "Favourite Plans", section: "favorite-plans", href: "/profile/favorites" },
  { icon: CalendarDays, label: "Bookings & Reminders", section: "bookings-reminders", href: "/profile/bookings-reminders" },
  { icon: Coins, label: "My Credits", section: "my-credits", href: "/profile/credits" },
  { icon: Tag, label: "Special Offers", section: "special-offers", href: "/profile/offers" },
  { icon: ListChecks, label: "Checklist", section: "checklist", href: "/profile/checklist" },
  { icon: CalendarDays, label: "Calendar of the Year", section: "calendar", href: "/profile/calendar" },
  { icon: Settings2, label: "Travel Preferences", section: "travel-preferences", href: "/profile/preferences" },
  { icon: FileText, label: "Travel Documents", section: "travel-documents", href: "/profile/documents" },
  { icon: Bell, label: "Notifications", section: "notifications", href: "/profile/notifications" },
  { icon: Headphones, label: "Support", section: "support", href: "/profile/support" },
  { icon: ShieldCheck, label: "Account & Security", section: "account-security", href: "/profile/security" },
];

export default function ProfileSidebarNav({
  createPlanHref,
  activePage,
  showControlCentre = false,
}: {
  createPlanHref: string;
  activePage?: string;
  showControlCentre?: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string, section: string) => {
    if (activePage) return activePage === section;
    if (href === "/profile") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <nav className="space-y-1 px-3">
        {sectionItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const selected = isActive(item.href, item.section);
          return (
            <Link key={item.section} href={item.href} aria-current={selected ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${selected ? "border border-[#ff7a00]/55 bg-[#ff7a00]/12 text-white shadow-[0_0_24px_rgba(255,122,0,.12)]" : "border border-transparent text-white/76 hover:bg-white/[0.06] hover:text-white"}`}>
              <Icon className={`h-5 w-5 shrink-0 ${selected ? "text-[#ff7a00]" : ""}`} />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </Link>
          );
        })}
        <Link
          href={createPlanHref}
          className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${
            activePage === "create-plan"
              ? "border-l-4 border-[#ff7a00] bg-[#ff7a00]/14 text-[#ff7a00]"
              : "text-white/82 hover:bg-white/[0.06] hover:text-white"
          }`}
        >
          <Sparkles className="h-5 w-5 shrink-0" />
          <span className="flex-1">Create a Plan</span>
        </Link>
        {showControlCentre ? (
          <Link
            href="/profile/control-centre"
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${
              activePage === "control-centre"
                ? "border-l-4 border-[#ff7a00] bg-[#ff7a00]/14 text-[#ff7a00]"
                : "text-white/82 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <Gauge className="h-5 w-5 shrink-0" />
            <span className="flex-1">Trip Control Centre</span>
          </Link>
        ) : null}
        {sectionItems.slice(2).map((item) => {
          const Icon = item.icon;
          const selected = isActive(item.href, item.section);
          return (
            <Link key={item.section} href={item.href} aria-current={selected ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${selected ? "border border-[#ff7a00]/55 bg-[#ff7a00]/12 text-white shadow-[0_0_24px_rgba(255,122,0,.12)]" : "border border-transparent text-white/76 hover:bg-white/[0.06] hover:text-white"}`}>
              <Icon className={`h-5 w-5 shrink-0 ${selected ? "text-[#ff7a00]" : ""}`} />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/8 px-3 pb-5 pt-4">
        <Link
          href="/api/auth/logout"
          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-white/82 transition hover:bg-white/[0.06] hover:text-white"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="flex-1">Log Out</span>
        </Link>
      </div>
    </>
  );
}
