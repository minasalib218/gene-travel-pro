"use client";

import { useCallback, useEffect, useState } from "react";

export type PassStatusResponse =
  | {
      ok: true;
      hasPass: boolean;
      remaining: number;
      remainingPlanCredits?: number;
      remainingEditCredits?: number;
      packageName?: string | null;
      enabledFeatures?: string[];
      lockedFeatures?: string[];
      isAdminBypass?: boolean;
      pass?: any;
    }
  | {
      ok: false;
      code?: string;
      message?: string;
    };

export function usePass() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PassStatusResponse | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pass/current", {
        method: "GET",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();
      if (json?.ok && json?.pass) {
        setData({
          ok: true,
          hasPass: true,
          remaining: Number(json.pass.remainingPlanCredits ?? 0),
          remainingPlanCredits: Number(json.pass.remainingPlanCredits ?? 0),
          remainingEditCredits: Number(json.pass.remainingEditCredits ?? 0),
          packageName: json.pass.packageName ?? null,
          enabledFeatures: json.pass.enabledFeatures ?? [],
          lockedFeatures: json.pass.lockedFeatures ?? [],
          isAdminBypass: Boolean(json.pass.isAdminBypass),
          pass: json.pass,
        });
      } else if (json?.code === "PASS_UNAVAILABLE") {
        setData({ ok: true, hasPass: false, remaining: 0, remainingPlanCredits: 0, remainingEditCredits: 0 });
      } else {
        setData(json as PassStatusResponse);
      }
    } catch {
      setData({ ok: false, code: "NETWORK_ERROR" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasPass = data?.ok === true && data.hasPass === true;
  const remaining = data?.ok === true ? Number(data.remaining ?? 0) : 0;
  const remainingEditCredits = data?.ok === true ? Number(data.remainingEditCredits ?? 0) : 0;
  const packageName = data?.ok === true ? data.packageName ?? null : null;
  const enabledFeatures = data?.ok === true ? data.enabledFeatures ?? [] : [];
  const lockedFeatures = data?.ok === true ? data.lockedFeatures ?? [] : [];
  const isAdminBypass = data?.ok === true ? Boolean(data.isAdminBypass) : false;

  return {
    loading,
    hasPass,
    remaining,
    remainingEditCredits,
    packageName,
    enabledFeatures,
    lockedFeatures,
    isAdminBypass,
    data,     // optional (in case you want pass details later)
    refresh,  // used by recommendation page after consuming actions
  };
}
