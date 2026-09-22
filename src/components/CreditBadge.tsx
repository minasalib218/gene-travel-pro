"use client";

import { usePass } from "@/hooks/usePass";

export default function CreditBadge() {
  const { loading, hasPass, remaining, isAdminBypass } = usePass();

  if (loading) return null;
  if (!hasPass && !isAdminBypass) return null;

  return (
    <div className="fixed left-6 bottom-6 z-50 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl px-4 py-3 text-sm text-white">
      <div className="text-white/70 text-xs">{isAdminBypass ? "Admin access" : "Remaining actions"}</div>
      <div className="font-semibold">{isAdminBypass ? "Unlimited" : remaining ?? 0}</div>
    </div>
  );
}
