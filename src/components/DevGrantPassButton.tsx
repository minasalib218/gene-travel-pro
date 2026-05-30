"use client";

import { useState } from "react";

export default function DevGrantPassButton({ tier = "basic" }: { tier?: "basic" | "pro" | "agency" }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch(`/api/dev/grant-pass?tier=${tier}`, { method: "GET" });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "Failed to grant pass");
      }

      window.location.href = "/ai/recommendation";
    } catch (e: any) {
      setErr(e?.message ?? "Error");
      setLoading(false);
    }
  }

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="text-sm text-white/80 mb-3">Dev tools (local only)</div>

      <button
        onClick={onClick}
        disabled={loading}
        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition disabled:opacity-50"
      >
        {loading ? "Granting pass..." : `Skip payment (Grant ${tier} pass)`}
      </button>

      {err && <div className="mt-3 text-sm text-red-300">{err}</div>}
    </div>
  );
}
