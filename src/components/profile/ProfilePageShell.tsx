"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Menu, X } from "lucide-react";
import { useState } from "react";
import GeneLogo from "@/components/brand/GeneLogo";
import GlobalSearch from "@/components/search/GlobalSearch";
import ProfileMobileNav from "./ProfileMobileNav";
import ProfileSidebarNav from "./ProfileSidebarNav";

function firstLetter(profile: any) {
  return String(profile?.fullName || profile?.email || "G").trim().slice(0, 1).toUpperCase();
}

export default function ProfilePageShell({
  profile,
  unreadCount = 0,
  activePage,
  children,
}: {
  profile: any;
  unreadCount?: number;
  activePage: string;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07111a] pb-24 text-white lg:pb-0">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_88%_8%,rgba(255,122,0,.12),transparent_27%),radial-gradient(circle_at_30%_55%,rgba(28,93,140,.09),transparent_35%)]" />
      <div className="relative flex min-h-screen">
        <aside className="hidden w-[260px] shrink-0 border-r border-white/10 bg-[#07111a]/96 lg:block">
          <div className="sticky top-0 flex h-screen flex-col overflow-y-auto">
            <Link href="/" className="px-8 pb-4 pt-5"><GeneLogo imageClassName="h-auto w-[142px]" priority /></Link>
            <ProfileSidebarNav createPlanHref="/profile/create-plan" activePage={activePage} />
          </div>
        </aside>

        {menuOpen ? (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <button aria-label="Close profile menu" className="absolute inset-0 bg-black/72 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
            <aside className="absolute inset-y-0 left-0 flex w-[min(86vw,330px)] flex-col overflow-y-auto border-r border-white/12 bg-[#08131e] shadow-2xl">
              <div className="flex items-center justify-between px-5 py-5">
                <GeneLogo imageClassName="h-auto w-[128px]" />
                <button aria-label="Close menu" onClick={() => setMenuOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/5"><X className="h-5 w-5" /></button>
              </div>
              <ProfileSidebarNav createPlanHref="/profile/create-plan" activePage={activePage} />
            </aside>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07111a]/88 backdrop-blur-2xl">
            <div className="flex h-[68px] items-center gap-3 px-3 sm:px-5 lg:h-[74px] lg:px-8">
              <button aria-label="Open profile menu" onClick={() => setMenuOpen(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 lg:hidden"><Menu className="h-5 w-5" /></button>
              <Link href="/" className="shrink-0 lg:hidden"><GeneLogo imageClassName="h-auto w-[100px] sm:w-[118px]" /></Link>
              <div className="ml-auto hidden min-w-0 max-w-xl flex-1 md:block"><GlobalSearch scope="profile" placeholder="Search destinations, hotels, experiences..." /></div>
              <Link href="/profile/notifications" aria-label="Open notifications" className="relative ml-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 md:ml-0">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff7a00] px-1 text-[10px] font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
              </Link>
              <Link href="/profile" className="flex items-center gap-3 rounded-full p-1 pr-2 transition hover:bg-white/5">
                <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/18 bg-[#ff7a00] font-bold text-black">
                  {profile?.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill className="object-cover" sizes="40px" /> : firstLetter(profile)}
                </span>
                <span className="hidden max-w-32 truncate text-sm font-semibold xl:block">{profile?.fullName || profile?.email?.split("@")[0] || "Traveler"}</span>
              </Link>
            </div>
          </header>
          <div className="mx-auto w-full max-w-[1500px] px-3 py-5 sm:px-5 sm:py-7 lg:px-8 lg:py-8">{children}</div>
        </div>
      </div>
      <ProfileMobileNav active={activePage === "my-trips" ? "trips" : activePage === "create-plan" ? "create" : activePage === "favorite-plans" ? "favorites" : "profile"} />
    </main>
  );
}
