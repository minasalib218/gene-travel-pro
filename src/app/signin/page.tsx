"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { trackAnalyticsEvent } from "@/lib/analytics";

const ORANGE = "#ff7a00";

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email.trim());
}

function SignInInner() {
  const { t } = useLanguage();
  const router = useRouter();
  const search = useSearchParams();
  const next = useMemo(() => search.get("next") || "/profile", [search]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail("");
    setPassword("");
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!email.trim() || !isValidEmail(email)) {
      setErr(t("signin.error.email", "Enter a valid email address."));
      return;
    }

    if (!password) {
      setErr(t("signin.error.password", "Password is required."));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErr(data?.error || "Could not sign in.");
        return;
      }

      trackAnalyticsEvent("login_completed", {
        source: "signin_page",
        next,
      });
      router.push(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/signup-bg-editorial.jpg"
          alt="Gene Travel cinematic background"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/70 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,122,0,0.18),transparent_55%)]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/25 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <Image src="/images/logo.png" alt="Gene Travel" width={200} height={200} />
          </Link>

          <nav className="flex items-center gap-6 text-sm text-white/75">
            <Link className="hover:text-white" href="/">
              {t("nav.home", "Home")}
            </Link>
            <Link className="hover:text-white" href="/offers">
              {t("nav.offers", "Offers")}
            </Link>
            <Link className="hover:text-white" href="/pricing">
              {t("nav.pricing", "Pricing")}
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.1fr,0.9fr]">
        <div className="pt-6">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#ffbf82]">
            {t("signin.welcome", "Welcome back")}
          </div>
          <h1 className="mt-6 font-serif text-5xl leading-[0.95] md:text-6xl">
            {t("signin.title", "Continue your smart journey.")}
          </h1>
          <p className="mt-6 max-w-xl text-white/75">
            {t(
              "signin.description",
              "Sign in with the email account you used for Gene, then jump back into your planner and recommendations.",
            )}
          </p>
        </div>

        <div className="rounded-[32px] border border-white/12 bg-black/35 p-6 shadow-[0_26px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                {t("signin.badge", "Sign In")}
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {t("signin.access", "Access your account")}
              </div>
            </div>
            <Link
              href="/signup"
              className="text-xs text-[#ffbf82] transition hover:text-white"
            >
              {t("signin.newHere", "New here? Create your account")}
            </Link>
          </div>

          {err ? (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          <form onSubmit={onSubmit} autoComplete="off" className="mt-6 space-y-4">
            <input type="text" name="gene-fake-user" autoComplete="username" className="hidden" tabIndex={-1} />
            <input type="password" name="gene-fake-pass" autoComplete="new-password" className="hidden" tabIndex={-1} />
            <div>
              <label className="block text-xs uppercase tracking-[0.22em] text-white/55">
                {t("signin.email", "Email")}
              </label>
              <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <input
                  type="email"
                  id="signin-email"
                  name="gene-signin-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent px-4 py-3 text-sm text-white/90 outline-none"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-form-type="other"
                  data-lpignore="true"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.22em] text-white/55">
                {t("signin.password", "Password")}
              </label>
              <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <input
                  type="password"
                  id="signin-password"
                  name="gene-signin-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent px-4 py-3 text-sm text-white/90 outline-none"
                  autoComplete="off"
                  data-form-type="other"
                  data-lpignore="true"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "mt-2 w-full rounded-full px-6 py-3 text-sm font-semibold text-black transition",
                loading ? "cursor-not-allowed opacity-70" : "hover:scale-[1.01]",
              )}
              style={{
                background: `linear-gradient(135deg, ${ORANGE}, rgba(255,200,140,0.95))`,
                boxShadow: "0 18px 60px rgba(255,122,0,0.18)",
              }}
            >
              {loading ? t("signin.submitting", "Signing in...") : t("signin.submit", "Sign In")}
            </button>
          </form>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#ffbf82]">
              {t("signin.afterTitle", "After sign in")}
            </div>
            <div className="mt-2 text-sm leading-7 text-white/65">
              {t(
                "signin.afterDescription",
                "You'll go straight to your profile, or back to the exact page you were trying to reach.",
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SignInFallback() {
  const { t } = useLanguage();
  return <div className="min-h-screen bg-black p-10 text-white">{t("signin.loading", "Loading...")}</div>;
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInInner />
    </Suspense>
  );
}
