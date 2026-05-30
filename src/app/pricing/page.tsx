"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import PaddleCheckoutButton from "@/components/payments/PaddleCheckoutButton";
import { getPlanRules, type GenePlanType } from "@/lib/credits/planRules";
import { trackAnalyticsEvent, trackCheckoutStart } from "@/lib/analytics";

type CurrencyCode = "USD" | "EUR" | "GBP" | "SAR" | "AED" | "EGP";

type CurrencyState = {
  rates: Record<CurrencyCode, number>;
  source: "live" | "fallback";
  updatedAt: string | null;
};

type TierCard = {
  key: GenePlanType;
  title: string;
  tagline: string;
  basePriceUSD: number;
  highlight?: boolean;
};

const BRAND_ORANGE = "#ff7a00";
const currencySymbols: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "EUR ",
  GBP: "GBP ",
  SAR: "SAR ",
  AED: "AED ",
  EGP: "EGP ",
};

function formatMoney(amount: number, currency: CurrencyCode) {
  return `${currencySymbols[currency]}${Math.round(amount).toLocaleString()}`;
}

function statLabel(value: number | null, label: string) {
  if (value === null) return `Unlimited ${label}`;
  return `${value} ${label}`;
}

export default function PricingPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const bgUrl = "/bg/pricing-airplane.jpg";
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [currencyState, setCurrencyState] = useState<CurrencyState>({
    rates: {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      SAR: 3.75,
      AED: 3.67,
      EGP: 50,
    },
    source: "fallback",
    updatedAt: null,
  });

  useEffect(() => {
    trackAnalyticsEvent("pricing_view", {
      contentName: "Pricing",
      category: "commerce",
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadRates() {
      try {
        const res = await fetch("/api/pricing/currencies", { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as
          | { ok?: boolean; rates?: Record<CurrencyCode, number>; source?: "live" | "fallback"; updatedAt?: string | null }
          | null;
        if (!cancelled && res.ok && json?.ok && json.rates) {
          setCurrencyState({
            rates: json.rates,
            source: json.source || "fallback",
            updatedAt: json.updatedAt || null,
          });
        }
      } catch {
        // keep fallback rates
      }
    }
    loadRates();
    return () => {
      cancelled = true;
    };
  }, []);

  const tiers: TierCard[] = useMemo(
    () => [
      {
        key: "starter",
        title: t("pricing.starter.name", "Starter"),
        tagline: t("pricing.starter.tagline", "Focused planning for one strong trip"),
        basePriceUSD: 25,
      },
      {
        key: "pro",
        title: t("pricing.pro.name", "Pro"),
        tagline: t("pricing.pro.tagline", "Balanced power for deeper trip design"),
        basePriceUSD: 40,
        highlight: true,
      },
      {
        key: "agency",
        title: t("pricing.agency.name", "Agency"),
        tagline: t("pricing.agency.tagline", "Full planning power with premium controls"),
        basePriceUSD: 50,
      },
    ],
    [t],
  );
  const pendingCheckout = useMemo(() => {
    const requested = searchParams.get("checkout");
    return requested === "starter" || requested === "pro" || requested === "agency"
      ? requested
      : null;
  }, [searchParams]);

  function tierPrice(usd: number) {
    return formatMoney(usd * (currencyState.rates[currency] || 1), currency);
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bgUrl} alt="Gene Travel pricing background" className="h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/65 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,122,0,0.22),transparent_40%)]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/35 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${BRAND_ORANGE}, rgba(255,200,120,0.9))`,
                boxShadow: "0 10px 30px rgba(255,122,0,0.25)",
              }}
            />
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/60">Gene Travel</div>
              <div className="text-lg font-semibold">{t("pricing.headerTitle", "Pricing & Pass")}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/60">
              {currencyState.source === "live" ? "Live FX" : "FX fallback"}
              {currencyState.updatedAt ? ` • ${new Date(currencyState.updatedAt).toLocaleDateString()}` : ""}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
              {(["USD", "EUR", "GBP", "SAR", "AED", "EGP"] as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  onClick={() => setCurrency(code)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    currency === code ? "bg-white/10 text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-10">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BRAND_ORANGE }} />
            {t("pricing.heroBadge", "AI planning credits • route tracking • real booking handoff")}
          </div>

          <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">
            {t("pricing.heroTitle", "Choose the Gene pass that fits your trip.")}
          </h1>

          <p className="mt-4 max-w-2xl text-white/70">
            {t(
              "pricing.heroDescription",
              "Each pass controls your AI planning credits, edit power, and advanced features. Your profile opens only the tools your active pass allows.",
            )}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => {
            const rules = getPlanRules(tier.key);
            return (
              <div
                key={tier.key}
                className={`group relative overflow-hidden rounded-3xl border bg-white/5 p-6 backdrop-blur-xl transition ${
                  tier.highlight ? "border-white/20" : "border-white/10 hover:border-white/20"
                }`}
                style={{
                  boxShadow: tier.highlight
                    ? "0 25px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,122,0,0.20) inset"
                    : "0 25px 60px rgba(0,0,0,0.45)",
                  transform: "translateZ(0)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px) scale(1.01)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0px) scale(1)";
                }}
              >
                <div
                  className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full opacity-0 blur-3xl transition group-hover:opacity-100"
                  style={{ backgroundColor: "rgba(255,122,0,0.28)" }}
                />

                {tier.highlight ? (
                  <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                    {t("pricing.mostPopular", "Most Popular")}
                  </div>
                ) : null}

                <div>
                  <h3 className="text-xl font-semibold">{tier.title}</h3>
                  <p className="mt-1 text-sm text-white/70">{tier.tagline}</p>
                </div>

                <div className="mt-5">
                  <div className="text-4xl font-semibold">
                    {tierPrice(tier.basePriceUSD)}
                    <span className="ml-2 text-sm font-normal text-white/60">{t("pricing.oneTime", "one-time")}</span>
                  </div>
                  <div className="mt-2 text-sm text-white/70">
                    {rules.expiresInDays} day access window
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Main Credits</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{rules.mainCreditsTotal}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Edit Credits</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{rules.editCreditsTotal}</div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/72">
                    {statLabel(rules.whatIfFreeTotal, "free What If simulations")}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/72">
                    {rules.chatMessagesTotal === null
                      ? "Companion chat anytime"
                      : rules.chatMessagesTotal === 0
                        ? "No companion chat"
                        : `${rules.chatMessagesTotal} chat messages`}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/72">
                  {rules.expertReviewTotal > 0
                    ? `${rules.expertReviewTotal} expert review included`
                    : "Expert review not included in this pass"}
                </div>

                <ul className="mt-6 space-y-2 text-sm text-white/75">
                  {rules.features.slice(0, 7).map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <span className="mt-[7px] inline-block h-2 w-2 rounded-full" style={{ backgroundColor: BRAND_ORANGE }} />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-xs text-white/60">
                  Tracking: remaining credits, live pass status, feature access, and expiry all stay attached to your profile.
                </div>

                <PaddleCheckoutButton
                  planId={tier.key}
                  autoStart={pendingCheckout === tier.key}
                  onCheckoutIntent={(selectedPlan) =>
                    trackAnalyticsEvent("package_selected", {
                      packageName: selectedPlan,
                      value: tier.basePriceUSD,
                      currency: "USD",
                      source: "pricing_page",
                    })
                  }
                  onCheckoutStarted={(selectedPlan) =>
                    trackCheckoutStart(selectedPlan, tier.basePriceUSD, "USD", {
                      provider: "paddle",
                      source: "pricing_page",
                    })
                  }
                  className="mt-7 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition"
                  style={{
                    background: tier.highlight
                      ? `linear-gradient(135deg, ${BRAND_ORANGE}, rgba(255,170,90,0.95))`
                      : "rgba(255,255,255,0.08)",
                    boxShadow: tier.highlight ? "0 12px 35px rgba(255,122,0,0.22)" : "0 10px 25px rgba(0,0,0,0.35)",
                  }}
                >
                  {t("pricing.payUnlock", "Pay & Unlock Planner")}
                </PaddleCheckoutButton>

                <p className="mt-3 text-xs text-white/55">
                  Secure checkout is handled through the current payment provider, while Gene keeps pass activation, credits, and profile access under its own control.
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h4 className="text-lg font-semibold">{t("pricing.footerTitle", "Profile access stays feature-aware")}</h4>
            <p className="mt-2 text-sm text-white/70">
              Your profile shows only the planning tools, credits, and advanced modules allowed by your active pass.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h4 className="text-lg font-semibold">Currencies made easier</h4>
            <p className="mt-2 text-sm text-white/70">
              Switch between major currencies from the top bar. Live exchange data can plug in through the pricing currency endpoint, with a safe fallback when a provider is not configured.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
