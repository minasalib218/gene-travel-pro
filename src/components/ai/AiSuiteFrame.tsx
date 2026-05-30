"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { BarChart3, CalendarRange, CheckCircle2, CreditCard, Headphones, Sparkles } from "lucide-react";

type AiPageKey = "recommendation" | "dayByDay" | "analysis" | "booking" | "summary";

type AiSuiteFrameProps = {
  activePage: AiPageKey;
  planId?: string | null;
  children: React.ReactNode;
};

type NavItem = {
  key: AiPageKey;
  label: string;
  href: string;
  icon: React.ReactNode;
};

function withPlanId(href: string, planId?: string | null) {
  if (!planId || href.includes("planId=")) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}planId=${encodeURIComponent(planId)}`;
}

export default function AiSuiteFrame({ activePage, planId, children }: AiSuiteFrameProps) {
  const promoCard = useMemo(() => {
    if (activePage === "recommendation") {
      return {
        title: "AI Flexible Dates",
        body: "We found better dates with lower prices.",
        cta: "View Dates",
      };
    }
    if (activePage === "dayByDay") {
      return {
        title: "Plan Assistant",
        body: "AI can optimize your plan for better timing, less walking and more experiences.",
        cta: "Auto-arrange with AI",
      };
    }
    if (activePage === "analysis") {
      return {
        title: "AI Insights",
        body: "We analyze your preferences and trip data to make smarter decisions.",
        cta: "How it works",
      };
    }
    return null;
  }, [activePage]);

  const navItems = useMemo<NavItem[]>(
    () => [
      {
        key: "recommendation",
        label: "Recommendations",
        href: withPlanId("/ai/recommendation", planId),
        icon: <Sparkles size={16} />,
      },
      {
        key: "dayByDay",
        label: "Day by Day",
        href: withPlanId("/ai/day-by-day", planId),
        icon: <CalendarRange size={16} />,
      },
      {
        key: "analysis",
        label: "Analysis",
        href: withPlanId("/ai/analysis", planId),
        icon: <BarChart3 size={16} />,
      },
      {
        key: "booking",
        label: "Booking",
        href: withPlanId("/ai/booking", planId),
        icon: <CreditCard size={16} />,
      },
      {
        key: "summary",
        label: "Summary",
        href: withPlanId("/summary", planId),
        icon: <CheckCircle2 size={16} />,
      },
    ],
    [planId],
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">

      <div className="relative mx-auto max-w-[1440px] px-3 py-2 md:px-4 lg:px-5">
        <div className="grid gap-6 xl:grid-cols-[136px_minmax(0,1fr)]">
          <aside className="hidden xl:block">
            <div className="sticky top-2 flex min-h-[calc(100vh-16px)] flex-col overflow-hidden rounded-[30px] border border-white/10 bg-black px-2.5 py-3 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
              <Link href="/" className="mx-1 flex h-[104px] items-center justify-center">
                <Image src="/images/logo.png" alt="Gene Travel" width={84} height={84} />
              </Link>

              <nav className="mt-6 space-y-3.5">
                {navItems.map((item) => {
                  const active = item.key === activePage;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`flex min-h-[98px] flex-col items-center justify-center rounded-[20px] border px-3 py-4 text-center transition ${
                        active
                          ? "border-[#ff7a00]/55 bg-[radial-gradient(circle_at_center,rgba(255,122,0,0.22),rgba(255,122,0,0.08)_52%,transparent_76%)] text-white shadow-[0_0_40px_rgba(255,122,0,0.18)]"
                          : "border-white/8 bg-black text-white/70 hover:border-[#ff7a00]/34 hover:bg-[#ff7a00]/08 hover:text-white"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full border ${active ? "border-[#ff7a00]/45 bg-[#ff7a00]/14 text-[#ffc387 shadow-[0_0_18px_rgba(255,122,0,0.2)]" : "border-white/10 bg-black text-[#ffbf82]"}`}>
                          {item.icon}
                        </span>
                        <div className="text-[13px] font-medium leading-4">{item.label}</div>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {promoCard ? (
                <div className="mt-auto pt-12">
                  <div className="rounded-[20px] border border-[#ff7a00]/24 bg-[linear-gradient(180deg,rgba(255,122,0,0.14),rgba(255,122,0,0.05))] p-4 shadow-[0_0_24px_rgba(255,122,0,0.08)]">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[#ffb866] drop-shadow-[0_0_10px_rgba(255,122,0,0.3)]">{promoCard.title}</div>
                  <div className="mt-3 text-[13px] leading-5 text-white/68">
                    {promoCard.body}
                  </div>
                  <div className="mt-4 rounded-full border border-[#ff7a00]/45 px-4 py-2 text-center text-[13px] font-medium text-[#ffae57] shadow-[0_0_16px_rgba(255,122,0,0.12)]">
                    {promoCard.cta}
                  </div>
                </div>
                </div>
              ) : (
                <div className="mt-auto" />
              )}

              <div className="mt-4 rounded-[20px] border border-white/8 bg-black p-4">
                <div className="flex items-center justify-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/82">
                    <Headphones size={18} />
                  </span>
                </div>
                <div className="mt-4 text-center text-[13px] leading-5 text-white/70">
                  Need help?<br />Ask Gene AI
                </div>
                <div className="mt-4 rounded-full border border-[#ff7a00]/45 px-4 py-2 text-center text-[13px] font-medium text-[#ffae57] shadow-[0_0_16px_rgba(255,122,0,0.1)]">
                  Ask Now
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0 pb-24 xl:pb-0">{children}</div>
        </div>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between gap-2 rounded-[24px] border border-white/10 bg-black/55 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.42)] backdrop-blur-2xl xl:hidden">
        {navItems.map((item) => {
          const active = item.key === activePage;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[18px] px-2 py-2 text-center transition ${
                active ? "bg-[#ff7a00]/14 text-[#ffd0a6]" : "text-white/58 hover:bg-white/8 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="truncate text-[11px] uppercase tracking-[0.14em]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
