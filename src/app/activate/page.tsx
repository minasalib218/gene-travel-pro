"use client";

import { useEffect, useMemo, useState } from "react";

const BRAND_ORANGE = "#ff7a00";

export default function ActivatePage() {
  // Use the same cinematic feel (you can reuse pricing bg or set a specific one)
  const bgUrl = "/bg/pricing-airplane.jpg";

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string>("Preparing activation…");

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    return url.searchParams.get("token") || "";
  }, []);

  useEffect(() => {
    async function run() {
      if (!token) {
        setStatus("error");
        setMessage("Activation token is missing. Please return from checkout link.");
        return;
      }

      setStatus("loading");
      setMessage("Activating your pass…");

      try {
        const res = await fetch("/api/auth/consume-activation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(data?.error || "Activation failed.");
          return;
        }

        setStatus("success");
        setMessage("Pass activated ✅ Redirecting to AI Planner…");

        // Redirect to AI planner input page (next page in traffic)
        setTimeout(() => {
          window.location.href = "/ai-planner";
        }, 900);
      } catch (e: any) {
        setStatus("error");
        setMessage(e?.message || "Activation failed.");
      }
    }

    run();
  }, [token]);

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* background */}
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bgUrl}
          alt="Gene Travel activation background"
          className="h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,122,0,0.22),transparent_45%)]" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${BRAND_ORANGE}, rgba(255,200,120,0.9))`,
                boxShadow: "0 12px 35px rgba(255,122,0,0.22)",
              }}
            />
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/60">
                Gene Travel
              </div>
              <div className="text-lg font-semibold">Activating your pass</div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="text-sm text-white/70">{message}</div>

            <div className="mt-3 h-2 w-full rounded-full bg-white/10">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width:
                    status === "loading"
                      ? "70%"
                      : status === "success"
                      ? "100%"
                      : status === "error"
                      ? "35%"
                      : "10%",
                  backgroundColor:
                    status === "error" ? "rgba(255,90,90,0.95)" : BRAND_ORANGE,
                }}
              />
            </div>

            {status === "error" && (
              <div className="mt-4 text-xs text-white/60">
                Tip: make sure you returned to this page from Lemon checkout and
                the token is valid.
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-white/50">
            <span>Secure activation</span>
            <span>Token-based</span>
          </div>
        </div>
      </div>
    </main>
  );
}
