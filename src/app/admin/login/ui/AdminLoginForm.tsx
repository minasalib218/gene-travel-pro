"use client";

import { useState } from "react";

export default function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = (await res.json()) as { ok: boolean; error?: string };

      if (!res.ok || !json.ok) {
        setErr(json.error ?? "Login failed");
        return;
      }

      window.location.href = "/admin";
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-white/60">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          className="mt-1 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-white/25"
          placeholder="Enter your email"
          required
        />
      </div>

      <div>
        <label className="text-xs text-white/60">Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          className="mt-1 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-white/25"
          placeholder="Enter your password"
          required
        />
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      ) : null}

      <button
        disabled={loading}
        className="w-full rounded-2xl px-4 py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: "#ff7a00" }}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
