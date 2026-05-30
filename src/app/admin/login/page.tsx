"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok || !json?.ok) {
      setError(json?.code || "LOGIN_FAILED");
      return;
    }

    router.replace("/admin");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.18),transparent_20%),linear-gradient(180deg,#111111,#050505)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(255,122,0,0.08),transparent_35%,transparent_70%,rgba(255,255,255,0.03))]" />

      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-2xl">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#ffbf82]">
            Gene Admin
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">
            Secure access to the control layer behind the trip engine.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/70">
            Open the dashboard for ready plans, customer records, analytics, accounting, and the operational side of the Gene platform.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
              <div className="text-sm font-semibold text-white">Operational visibility</div>
              <p className="mt-2 text-sm leading-7 text-white/60">
                Watch passes, content, and customer activity from one premium control room.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
              <div className="text-sm font-semibold text-white">Protected workflow</div>
              <p className="mt-2 text-sm leading-7 text-white/60">
                Admin access stays isolated from the traveler-facing planning flow.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="w-full rounded-[36px] border border-white/10 bg-white/[0.06] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/45">Admin Sign In</div>
              <h1 className="mt-3 text-3xl font-semibold">Open dashboard</h1>
              <p className="mt-2 text-sm leading-7 text-white/60">
                Restricted access for Gene operations only.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#ffbf82]">
              Secure
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <div>
              <label className="text-xs uppercase tracking-[0.22em] text-white/55">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none transition focus:border-white/20"
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.22em] text-white/55">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none transition focus:border-white/20"
                required
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <button
              disabled={loading}
              className="w-full rounded-2xl px-4 py-3 font-semibold text-black transition disabled:opacity-50"
              style={{ backgroundColor: "#ff7a00" }}
            >
              {loading ? "Logging in..." : "Open Admin Dashboard"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
