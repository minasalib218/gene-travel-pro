"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { trackAnalyticsEvent, trackLead } from "@/lib/analytics";

const ORANGE = "#ff7a00";

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function isValidPhone(phone: string) {
  const cleaned = phone.replace(/\s+/g, "");
  return /^\d{6,14}$/.test(cleaned);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email.trim());
}

function passwordStrength(pw: string) {
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNum = /\d/.test(pw);
  const hasSym = /[^A-Za-z0-9]/.test(pw);
  const len = pw.length;

  const score =
    (len >= 8 ? 1 : 0) +
    (len >= 12 ? 1 : 0) +
    (hasLower ? 1 : 0) +
    (hasUpper ? 1 : 0) +
    (hasNum ? 1 : 0) +
    (hasSym ? 1 : 0);

  if (score <= 2) return { label: "Weak", pct: 28 };
  if (score <= 4) return { label: "Good", pct: 62 };
  return { label: "Strong", pct: 92 };
}

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function SignUpPageContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const search = useSearchParams();
  const paymentSuccess = search.get("payment") === "success";
  const next = search.get("next") || "/pricing";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errorTop, setErrorTop] = useState<string | null>(null);
  const [agreedToPolicies, setAgreedToPolicies] = useState(false);

  useEffect(() => {
    setFullName("");
    setEmail("");
    setPhone("");
    setBirthDate("");
    setPassword("");
    setConfirm("");
  }, []);

  const minBirth = useMemo(() => toISODate(new Date(1900, 0, 1)), []);
  const maxBirth = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13);
    return toISODate(d);
  }, []);

  const strength = useMemo(() => {
    const result = passwordStrength(password);
    if (result.label === "Weak") return { ...result, label: t("signup.password.weak", "Weak") };
    if (result.label === "Good") return { ...result, label: t("signup.password.good", "Good") };
    return { ...result, label: t("signup.password.strong", "Strong") };
  }, [password, t]);

  const fullPhone = `${countryCode}${phone.replace(/\s+/g, "")}`;

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!fullName.trim()) e.fullName = "Full name is required.";
    else if (fullName.trim().length < 3) e.fullName = "Name is too short.";

    if (!email.trim()) e.email = "Email is required.";
    else if (!isValidEmail(email)) e.email = "Use a valid email address.";

    if (!phone.trim()) e.phone = "Phone number is required.";
    else if (!isValidPhone(phone)) e.phone = "Enter a valid phone number.";

    if (!birthDate) e.birthDate = "Birth date is required.";

    if (!password) e.password = "Password is required.";
    else if (password.length < 8) e.password = "Password must be at least 8 characters.";

    if (!confirm) e.confirm = "Please confirm your password.";
    else if (confirm !== password) e.confirm = "Passwords do not match.";

    if (!agreedToPolicies) e.agreement = "You need to agree to the terms, privacy policy, and refund policy.";

    return e;
  }, [fullName, email, phone, birthDate, password, confirm, agreedToPolicies]);

  const canSubmit = Object.keys(errors).length === 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      birthDate: true,
      password: true,
      confirm: true,
      agreement: true,
    });

    if (!canSubmit) {
      setErrorTop("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    setErrorTop(null);
    trackLead("signup_started", {
      source: paymentSuccess ? "payment_success_signup" : "signup_page",
      next,
    });

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email: email.trim().toLowerCase(),
          phone: fullPhone,
          birthDate,
          password,
          confirm,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorTop(data?.error || "Could not create your account.");
        return;
      }

      const signInResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const signInData = await signInResponse.json().catch(() => ({}));
      if (!signInResponse.ok) {
        setErrorTop(signInData?.error || "Could not sign in after account creation.");
        return;
      }

      trackAnalyticsEvent("signup_completed", {
        source: paymentSuccess ? "payment_success_signup" : "signup_page",
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
        <div className="absolute inset-0 [box-shadow:inset_0_120px_140px_rgba(0,0,0,0.70)]" />
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
          <div className="text-xs uppercase tracking-[0.28em] text-white/60">
            {t("signup.titleBadge", "Create your account")}
          </div>

          <h1 className="mt-4 font-serif text-5xl leading-[0.95] md:text-6xl">
            {t("signup.title", "Your journey, crafted with precision.")}
          </h1>

          <p className="mt-6 max-w-xl text-white/75">
            {t(
              "signup.description",
              "Set up your Gene account, keep your details private, and continue to pricing.",
            )}
          </p>
        </div>

        <div className="rounded-[28px] border border-white/12 bg-black/35 p-6 shadow-[0_26px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                {t("signup.cardBadge", "Sign Up")}
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {t("signup.cardTitle", "Create your account")}
              </div>
            </div>
            <div className="text-xs text-white/55">
              {t("signup.haveAccount", "This page is reserved for payment continuation.")}
            </div>
          </div>

          {errorTop ? (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorTop}
            </div>
          ) : null}

          <form onSubmit={onSubmit} autoComplete="off" className="mt-6 space-y-4">
            <input type="text" name="gene-fake-user" autoComplete="username" className="hidden" tabIndex={-1} />
            <input type="password" name="gene-fake-pass" autoComplete="new-password" className="hidden" tabIndex={-1} />
            <Field
              label={t("signup.fullName", "Full name")}
              value={fullName}
              onChange={setFullName}
              error={touched.fullName ? errors.fullName : undefined}
              onBlur={() => setTouched((p) => ({ ...p, fullName: true }))}
              autoComplete="off"
              name="gene-signup-name"
            />

            <Field
              label={t("signup.email", "Email")}
              value={email}
              onChange={setEmail}
              error={touched.email ? errors.email : undefined}
              onBlur={() => setTouched((p) => ({ ...p, email: true }))}
              type="email"
              autoComplete="off"
              name="gene-signup-email"
              autoCapitalize="none"
              spellCheck={false}
            />

            <div>
              <label className="block text-xs uppercase tracking-[0.22em] text-white/55">
                {t("signup.phone", "Phone number")}
              </label>
              <div
                className={cn(
                  "mt-2 grid grid-cols-[180px_1fr] rounded-2xl border bg-white/5 backdrop-blur-xl",
                  touched.phone && errors.phone ? "border-red-500/40" : "border-white/10",
                )}
              >
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="rounded-l-2xl border-r border-white/10 bg-transparent px-3 py-3 text-sm text-white/90 outline-none"
                >
                  {COUNTRIES.map((country) => (
                    <option
                      key={`${country.code}-${country.dialCode}`}
                      value={country.dialCode}
                      className="bg-[#111]"
                    >
                      {country.flag} {country.name} ({country.dialCode})
                    </option>
                  ))}
                </select>
                <input
                  name="gene-signup-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                  className="w-full bg-transparent px-4 py-3 text-sm text-white/90 outline-none"
                  autoComplete="off"
                  data-form-type="other"
                  data-lpignore="true"
                />
              </div>
              {touched.phone && errors.phone ? (
                <div className="mt-2 text-xs text-red-200">{errors.phone}</div>
              ) : null}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.22em] text-white/55">
                {t("signup.birthDate", "Birth date")}
              </label>
              <div
                className={cn(
                  "mt-2 rounded-2xl border bg-white/5 backdrop-blur-xl",
                  touched.birthDate && errors.birthDate ? "border-red-500/40" : "border-white/10",
                )}
              >
                <input
                  type="date"
                  name="gene-signup-birthdate"
                  value={birthDate}
                  min={minBirth}
                  max={maxBirth}
                  onChange={(e) => setBirthDate(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, birthDate: true }))}
                  className="w-full bg-transparent px-4 py-3 text-sm text-white/90 outline-none [color-scheme:dark]"
                />
              </div>
              {touched.birthDate && errors.birthDate ? (
                <div className="mt-2 text-xs text-red-200">{errors.birthDate}</div>
              ) : null}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.22em] text-white/55">
                {t("signup.password", "Password")}
              </label>
              <div
                className={cn(
                  "mt-2 rounded-2xl border bg-white/5 backdrop-blur-xl",
                  touched.password && errors.password ? "border-red-500/40" : "border-white/10",
                )}
              >
                <input
                  type="password"
                  name="gene-signup-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  className="w-full bg-transparent px-4 py-3 text-sm text-white/90 outline-none"
                  autoComplete="new-password"
                  data-form-type="other"
                  data-lpignore="true"
                />
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-white/55">
                  <span>{t("signup.passwordStrength", "Password strength")}</span>
                  <span className="text-white/70">{strength.label}</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${strength.pct}%`,
                      background: `linear-gradient(90deg, ${ORANGE}, rgba(255,200,140,0.95))`,
                    }}
                  />
                </div>
              </div>
              {touched.password && errors.password ? (
                <div className="mt-2 text-xs text-red-200">{errors.password}</div>
              ) : null}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.22em] text-white/55">
                {t("signup.confirmPassword", "Confirm password")}
              </label>
              <div
                className={cn(
                  "mt-2 rounded-2xl border bg-white/5 backdrop-blur-xl",
                  touched.confirm && errors.confirm ? "border-red-500/40" : "border-white/10",
                )}
              >
                <input
                  type="password"
                  name="gene-signup-confirm-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, confirm: true }))}
                  className="w-full bg-transparent px-4 py-3 text-sm text-white/90 outline-none"
                  autoComplete="new-password"
                  data-form-type="other"
                  data-lpignore="true"
                />
              </div>
              {touched.confirm && errors.confirm ? (
                <div className="mt-2 text-xs text-red-200">{errors.confirm}</div>
              ) : null}
            </div>

            <div>
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm text-white/78 transition backdrop-blur-xl",
                  touched.agreement && errors.agreement
                    ? "border-red-500/40 bg-red-500/8"
                    : "border-white/10 bg-white/5 hover:bg-white/7",
                )}
              >
                <input
                  type="checkbox"
                  checked={agreedToPolicies}
                  onChange={(e) => setAgreedToPolicies(e.target.checked)}
                  onBlur={() => setTouched((p) => ({ ...p, agreement: true }))}
                  className="mt-0.5 h-5 w-5 rounded-full border border-white/20 bg-transparent accent-[#ff7a00]"
                />
                <span className="leading-6">
                  I agree to the{" "}
                  <Link href="/terms" className="font-medium text-[#ff7a00] hover:text-[#ff9a3d]">
                    Terms
                  </Link>
                  ,{" "}
                  <Link href="/privacy-policy" className="font-medium text-[#ff7a00] hover:text-[#ff9a3d]">
                    Privacy Policy
                  </Link>
                  , and{" "}
                  <Link href="/refund-policy" className="font-medium text-[#ff7a00] hover:text-[#ff9a3d]">
                    Refund Policy
                  </Link>
                  .
                </span>
              </label>
              {touched.agreement && errors.agreement ? (
                <div className="mt-2 text-xs text-red-200">{errors.agreement}</div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className={cn(
                "mt-2 w-full rounded-full px-6 py-3 text-sm font-semibold text-black transition",
                !canSubmit || loading ? "cursor-not-allowed opacity-70" : "hover:scale-[1.01]",
              )}
              style={{
                background: `linear-gradient(135deg, ${ORANGE}, rgba(255,200,140,0.95))`,
                boxShadow: "0 18px 60px rgba(255,122,0,0.18)",
              }}
            >
              {loading
                ? t("signup.creating", "Creating account...")
                : t("signup.continue", "Continue to Pricing")}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<main className="relative min-h-screen overflow-hidden bg-black text-white" />}>
      <SignUpPageContent />
    </Suspense>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  onBlur,
  type = "text",
  autoComplete = "off",
  name,
  autoCapitalize,
  spellCheck,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  onBlur?: () => void;
  type?: string;
  autoComplete?: string;
  name?: string;
  autoCapitalize?: string;
  spellCheck?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-[0.22em] text-white/55">{label}</label>
      <div
        className={cn(
          "mt-2 rounded-2xl border bg-white/5 backdrop-blur-xl",
          error ? "border-red-500/40" : "border-white/10",
        )}
      >
        <input
          type={type}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="w-full bg-transparent px-4 py-3 text-sm text-white/90 outline-none"
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          spellCheck={spellCheck}
          data-form-type="other"
          data-lpignore="true"
        />
      </div>
      {error ? <div className="mt-2 text-xs text-red-200">{error}</div> : null}
    </div>
  );
}
