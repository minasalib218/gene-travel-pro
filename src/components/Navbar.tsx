"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import LanguageMenu from "@/components/i18n/LanguageMenu";
import GeneLogo from "@/components/brand/GeneLogo";
import GlobalSearch from "@/components/search/GlobalSearch";
const nav=[
  {href:"/",labelKey:"nav.home",fallback:"Home"},
  {href:"/offers",labelKey:"nav.offers",fallback:"Offers"},
  {href:"/destinations",labelKey:"nav.destinations",fallback:"Destinations"},
  {href:"/pricing",labelKey:"nav.pricing",fallback:"Pricing"}
];
export default function Navbar(){
  const pathname=usePathname();
  const { t } = useLanguage();
  return(<header className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
    <nav className="pointer-events-auto mx-3 mt-3 max-w-6xl rounded-[28px] bg-black/50 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:mx-auto sm:mt-4 sm:rounded-full sm:px-6">
      <div className="flex items-center justify-between gap-3">
      <Link href="/" className="flex items-center select-none">
        <GeneLogo />
      </Link>
      <div className="flex items-center gap-2 text-sm text-white/70 sm:gap-3 md:hidden">
        <Link
          href="/profile"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/82 transition hover:bg-white/10"
          aria-label={t("nav.profile", "Profile")}
        >
          <User size={16} />
        </Link>
        <LanguageMenu embedded />
      </div>
      <div className="hidden items-center gap-6 text-sm text-white/70 lg:flex">
        {nav.map(it=>{const active=it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);return(
          <Link key={it.href} href={it.href} className="group relative inline-flex flex-col items-center hover:text-white transition-colors duration-200">
            <span className={active?"text-white":""}>{t(it.labelKey,it.fallback)}</span>
            <span className={`mt-1 h-[2px] rounded-full bg-brand transition-all duration-300 ${active?"w-6":"w-0 group-hover:w-6"}`} />
          </Link>
        );})}
        <Link
          href="/profile"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/82 transition hover:bg-white/10"
          aria-label={t("nav.profile", "Profile")}
        >
          <User size={16} />
        </Link>
        <LanguageMenu embedded />
      </div>
      </div>
      <div className="mt-3 hidden md:block lg:hidden">
        <GlobalSearch compact />
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-[11px] text-white/72 md:hidden">
        {nav.map(it=>{const active=it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);return(
          <Link
            key={it.href}
            href={it.href}
            className={`whitespace-nowrap rounded-full border px-3 py-2 transition ${active?"border-[#ff7a00]/55 bg-[#ff7a00]/20 text-white":"border-white/10 bg-white/5 hover:bg-white/10"}`}
          >
            {t(it.labelKey,it.fallback)}
          </Link>
        );})}
      </div>
    </nav>
  </header>);
}
