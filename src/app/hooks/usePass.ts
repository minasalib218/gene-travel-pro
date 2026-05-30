"use client";

import { useCallback, useEffect, useState } from "react";

type PassData = {
  id?: string;
  tier?: string; // "basic" | "pro" | "agency"
  packageName?: string | null;
  status?: string; // "active" | "expired" | ...
  tierActionsTotal?: number;
  tierActionsUsed?: number;
  remainingPlanCredits?: number;
  remainingEditCredits?: number;
  expiresAt?: string | null;
};

export type PassState =
  | { status: "loading" }
  | { status: "authed_no_pass" }
  | { status: "active"; pass: PassData; remaining: number }
  | { status: "expired"; pass?: PassData }
  | { status: "error"; message: string };

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export function usePass() {
  const [state, setState] = useState<PassState>({ status: "loading" });

  const refresh = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const res = await fetch("/api/pass/current", { credentials: "include" });
      const json = await safeJson(res);

      // If not authed
      if (res.status === 401 || json?.code === "NOT_AUTHED") {
        setState({ status: "authed_no_pass" });
        return;
      }

      if (!res.ok) {
        setState({
          status: "error",
          message: json?.message || `Failed to load pass (${res.status})`,
        });
        return;
      }

      // Support multiple shapes:
      // A) { ok:true, pass:{...} }
      // B) { pass:{...} }
      // C) { ok:true, tier:"basic", ... }
      const pass: PassData | null = json?.pass ?? null;

      if (!pass) {
        setState({ status: "authed_no_pass" });
        return;
      }

      const total = Number(pass.remainingPlanCredits ?? pass.tierActionsTotal ?? 0);
      const used = Number(pass.tierActionsUsed ?? 0);
      const remaining =
        typeof pass.remainingPlanCredits === "number"
          ? pass.remainingPlanCredits
          : Math.max(0, total - used);

      const st = String(pass.status ?? "active").toLowerCase();
      if (st === "expired") {
        setState({ status: "expired", pass });
        return;
      }

      setState({ status: "active", pass, remaining });
    } catch (e: any) {
      setState({ status: "error", message: e?.message || "Unknown error" });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { state, refresh };
}
