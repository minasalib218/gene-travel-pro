"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
} from "lucide-react";

const sectionItems = [
  { icon: User, label: "My Profile", section: "profile-overview" },
  { icon: Briefcase, label: "My Trips", section: "my-trips", href: "/profile/trips" },
  { icon: Heart, label: "Favorite Plans", section: "favorite-plans" },
  { icon: CalendarDays, label: "Bookings & Reminders", section: "bookings-reminders", href: "/profile/bookings-reminders" },
  { icon: Coins, label: "My Credits", section: "my-credits" },
  { icon: Settings2, label: "Travel Preferences", section: "travel-preferences" },
  { icon: FileText, label: "Travel Documents", section: "travel-documents" },
  { icon: Tag, label: "Special Offers", section: "special-offers", badge: "NEW" },
  { icon: Bell, label: "Notifications", section: "notifications" },
  { icon: Headphones, label: "Support", section: "support" },
  { icon: ShieldCheck, label: "Account & Security", section: "account-security" },
];

function NavButton({
  icon: Icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: any;
  label: string;
  active?: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-xl px-5 py-4 text-left text-sm transition ${
        active
          ? "border-l-4 border-[#ff7a00] bg-[#ff7a00]/14 text-[#ff7a00]"
          : "text-white/82 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="rounded-full bg-[#ff7a00] px-2 py-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export default function ProfileSidebarNav({
  createPlanHref,
  activePage,
  showControlCentre = false,
}: {
  createPlanHref: string;
  activePage?: string;
  showControlCentre?: boolean;
}) {
  const [activeSection, setActiveSection] = useState("profile-overview");

  useEffect(() => {
    const nodes = sectionItems
      .map((item) => document.getElementById(item.section))
      .filter((node): node is HTMLElement => Boolean(node));

    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-95px 0px -55% 0px", threshold: [0.15, 0.35, 0.6] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  function goToSection(section: string) {
    const node = document.getElementById(section);
    if (!node) return;

    setActiveSection(section);
    window.history.replaceState(null, "", `#${section}`);
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <nav className="space-y-1 px-3">
        {sectionItems.slice(0, 2).map((item) => {
          if (item.href) {
            const Icon = item.icon;
            return (
              <Link
                key={item.section}
                href={item.href}
                className={`flex items-center gap-4 rounded-xl px-5 py-4 text-sm transition ${
                  activePage === item.section
                    ? "border-l-4 border-[#ff7a00] bg-[#ff7a00]/14 text-[#ff7a00]"
                    : "text-white/82 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          }
          return (
            <NavButton
              key={item.section}
              icon={item.icon}
              label={item.label}
              active={!activePage && activeSection === item.section}
              onClick={() => {
                if (activePage) {
                  window.location.href = `/profile#${item.section}`;
                  return;
                }
                goToSection(item.section);
              }}
            />
          );
        })}
        <Link
          href={createPlanHref}
          className={`flex items-center gap-4 rounded-xl px-5 py-4 text-sm transition ${
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
            className={`flex items-center gap-4 rounded-xl px-5 py-4 text-sm transition ${
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
          if (item.href) {
            const Icon = item.icon;
            return (
              <Link
                key={item.section}
                href={item.href}
                className={`flex items-center gap-4 rounded-xl px-5 py-4 text-sm transition ${
                  activePage === item.section
                    ? "border-l-4 border-[#ff7a00] bg-[#ff7a00]/14 text-[#ff7a00]"
                    : "text-white/82 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          }

          return (
            <NavButton
              key={item.section}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              active={activeSection === item.section}
              onClick={() => {
                if (activePage) {
                  window.location.href = `/profile#${item.section}`;
                  return;
                }
                goToSection(item.section);
              }}
            />
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/8 px-3 pb-5 pt-4">
        <Link
          href="/api/auth/logout"
          className="flex items-center gap-4 rounded-xl px-5 py-4 text-sm text-white/82 transition hover:bg-white/[0.06] hover:text-white"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="flex-1">Log Out</span>
        </Link>
      </div>
    </>
  );
}
