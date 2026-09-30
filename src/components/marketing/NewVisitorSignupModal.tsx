"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CalendarDays, ClipboardCheck, Map, Tag, X } from "lucide-react";
import GeneLogo from "@/components/brand/GeneLogo";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const DISMISSED_KEY = "gene_signup_popup_seen";
const SESSION_KEY = "gene_signup_popup_session";
const DISMISSAL_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const OPEN_DELAY_MS = 2400;

const BLOCKED_PREFIXES = [
  "/signin", "/signup", "/login", "/auth", "/activate", "/checkout",
  "/payment", "/pricing", "/admin", "/profile", "/ai", "/planner",
  "/editor", "/plan-summary", "/api",
];

const features = [
  { title: "Year Calendar", description: "Plan your vacations ahead", Icon: CalendarDays },
  { title: "Travel Checklist", description: "Never forget the essentials", Icon: ClipboardCheck },
  { title: "Special Offers", description: "Stay updated with better trip deals", Icon: Tag },
  { title: "Trip Planning", description: "Organize your whole trip in one place", Icon: Map },
];

function isEligiblePath(pathname: string) {
  return !BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function safeCurrentPath(pathname: string, query: string) {
  const path = query ? `${pathname}?${query}` : pathname;
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

function wasDismissedRecently() {
  try {
    const dismissedAt = Number(window.localStorage.getItem(DISMISSED_KEY) || 0);
    if (!dismissedAt) return false;
    if (Date.now() - dismissedAt < DISMISSAL_TTL_MS) return true;
    window.localStorage.removeItem(DISMISSED_KEY);
    return false;
  } catch {
    return false;
  }
}

function markSessionHandled() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Storage is optional for this non-critical prompt.
  }
}

function hasSessionHandledPopup() {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export default function NewVisitorSignupModal() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const query = searchParams.toString();
  const returnPath = useMemo(() => safeCurrentPath(pathname, query), [pathname, query]);

  const close = useCallback((reason: "closed" | "signup" | "signin") => {
    if (!open || closing) return;
    setClosing(true);
    markSessionHandled();
    try {
      window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Storage is optional for this non-critical prompt.
    }
    trackAnalyticsEvent(
      reason === "closed"
        ? "signup_popup_closed"
        : reason === "signup"
          ? "signup_popup_signup_clicked"
          : "signup_popup_signin_clicked",
      { source: "new_visitor_popup" },
    );
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
      previousFocusRef.current?.focus?.();
      if (reason === "signup") router.push(`/signup?next=${encodeURIComponent(returnPath)}`);
      if (reason === "signin") router.push(`/signin?next=${encodeURIComponent(returnPath)}`);
    }, 180);
  }, [closing, open, returnPath, router]);

  useEffect(() => {
    if (!isEligiblePath(pathname) || hasSessionHandledPopup() || wasDismissedRecently()) return;

    let cancelled = false;
    let timer: number | undefined;
    let attempts = 0;

    const schedule = () => {
      timer = window.setTimeout(async () => {
        if (cancelled || document.visibilityState !== "visible") return;
        try {
          const { data } = await getSupabaseBrowserClient().auth.getSession();
          if (cancelled || data.session) return;
        } catch {
          return;
        }

        const anotherDialog = document.querySelector('[role="dialog"], [aria-modal="true"]');
        if (anotherDialog && attempts < 3) {
          attempts += 1;
          schedule();
          return;
        }
        if (anotherDialog || cancelled) return;

        previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        markSessionHandled();
        setOpen(true);
        trackAnalyticsEvent("signup_popup_viewed", { source: "new_visitor_popup" });
      }, attempts === 0 ? OPEN_DELAY_MS : 2000);
    };

    schedule();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [pathname]);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const { data } = getSupabaseBrowserClient().auth.onAuthStateChange((_event, session) => {
        if (!session) return;
        markSessionHandled();
        setOpen(false);
        setClosing(false);
      });
      subscription = data.subscription;
    } catch {
      return;
    }
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => primaryActionRef.current?.focus(), 30);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close("closed");
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hasAttribute("hidden"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [close, open]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-2.5 backdrop-blur-md transition-opacity duration-200 motion-reduce:transition-none sm:p-5 ${closing ? "opacity-0" : "opacity-100"}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close("closed");
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gene-signup-popup-title"
        aria-describedby="gene-signup-popup-description"
        className={`relative flex max-h-[calc(100dvh-20px)] w-full max-w-[980px] flex-col overflow-hidden rounded-2xl border border-[#ff7a00]/55 bg-[#090d12]/95 text-white shadow-[0_0_0_1px_rgba(255,122,0,.12),0_28px_90px_rgba(0,0,0,.78),0_0_45px_rgba(255,122,0,.2)] transition duration-200 motion-reduce:transform-none motion-reduce:transition-none md:max-h-[min(760px,calc(100dvh-40px))] md:flex-row ${closing ? "translate-y-2 scale-[.985] opacity-0" : "translate-y-0 scale-100 opacity-100"}`}
      >
        <button
          type="button"
          aria-label="Close signup invitation"
          onClick={() => close("closed")}
          className="absolute right-3 top-3 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/60 text-white shadow-lg backdrop-blur-md transition hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative h-[145px] shrink-0 overflow-hidden md:h-auto md:w-[42%]">
          <Image
            src="/images/signup-bg-editorial.jpg"
            alt="A cinematic Gene travel journey"
            fill
            className="object-cover"
            sizes="(max-width: 767px) 100vw, 410px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090d12] via-black/5 to-black/15 md:bg-gradient-to-r md:from-transparent md:via-black/5 md:to-[#090d12]" />
          <p className="absolute bottom-4 left-5 max-w-[220px] font-serif text-xl leading-tight drop-shadow-lg md:bottom-8 md:left-8 md:text-3xl">
            More Meaningful <span className="text-[#ff7a00]">Journeys</span>
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3 pt-3 [scrollbar-width:thin] [scrollbar-color:#ff7a00_transparent] sm:px-7 md:px-8 md:pb-4 md:pt-7">
            <GeneLogo imageClassName="h-auto w-[88px] md:w-[108px]" />
            <h2 id="gene-signup-popup-title" className="mt-2 text-[25px] font-black leading-[1.06] sm:text-3xl md:mt-4 md:text-[38px]">
              Find the best choices — plus <span className="text-[#ff7a00]">exclusive Gene plans</span> ✈️
            </h2>
            <p id="gene-signup-popup-description" className="mt-2 text-[13px] leading-[1.45] text-white/72 sm:text-sm md:mt-3 md:text-[15px]">
              No endless searching. No confusing options. Gene gives you carefully selected choices and exclusive travel plans made for Gene users.
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 md:mt-5 md:grid-cols-1">
              {features.map(({ title, description, Icon }) => (
                <div key={title} className="flex min-h-[54px] items-center gap-3 rounded-xl border border-[#ff7a00]/25 bg-gradient-to-r from-[#ff7a00]/10 via-white/[.035] to-transparent px-3 py-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#ff7a00]/15 text-[#ff8a1c] ring-1 ring-[#ff7a00]/25">
                    <Icon className="h-[19px] w-[19px]" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-[13px] leading-tight md:text-sm">{title}</strong>
                    <span className="mt-0.5 block text-[11px] leading-tight text-white/58 md:text-xs">{description}</span>
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-3 text-center text-[13px] text-white/85 md:mt-5 md:text-sm">
              Better choices. Easier planning. <strong className="italic text-[#ff7a00]">All in Gene.</strong>
            </p>
          </div>

          <div className="shrink-0 border-t border-white/8 bg-[#090d12]/95 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 sm:px-7 md:px-8 md:pb-6">
            <button
              ref={primaryActionRef}
              type="button"
              onClick={() => close("signup")}
              className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#ff991c] to-[#ff6500] px-5 text-sm font-black text-white shadow-[0_12px_34px_rgba(255,103,0,.3)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transform-none sm:text-base"
            >
              Start for Free <ArrowRight className="h-5 w-5" />
            </button>
            <p className="mt-2.5 text-center text-xs text-white/70">
              Already have an account?{" "}
              <button type="button" onClick={() => close("signin")} className="min-h-8 font-semibold text-[#ff7a00] underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00]">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
