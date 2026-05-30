"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { User } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import LanguageMenu from "@/components/i18n/LanguageMenu";
const nav=[
  {href:"/",labelKey:"nav.home",fallback:"Home"},
  {href:"/offers",labelKey:"nav.offers",fallback:"Offers"},
  {href:"/destinations",labelKey:"nav.destinations",fallback:"Destinations"},
  {href:"/pricing",labelKey:"nav.pricing",fallback:"Pricing"},
  {href:"/ai-planner",labelKey:"nav.planner",fallback:"AI Planner"}
];
export default function Navbar(){
  const pathname=usePathname();
  const { t } = useLanguage();
  return(<header className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
    <nav className="pointer-events-auto mx-auto mt-4 max-w-6xl flex items-center justify-between rounded-full bg-black/50 backdrop-blur-xl px-6 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
      <Link href="/" className="flex items-center select-none">
        <Image src="/images/logo.png" alt="Gene Travel" width={200} height={200} />
      </Link>
      <div className="flex items-center gap-6 text-sm text-white/70">
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
    </nav>
  </header>);
}
