"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { completePendingAction, safeInternalPath } from "@/lib/auth/pendingAction";

function AuthCompleteInner() {
  const search = useSearchParams();

  useEffect(() => {
    let active = true;
    const next = safeInternalPath(search.get("next"));
    completePendingAction(next).then((destination) => {
      if (active) window.location.replace(destination);
    });
    return () => {
      active = false;
    };
  }, [search]);

  return <div className="flex min-h-screen items-center justify-center bg-black text-sm text-white/70">Opening your Gene account...</div>;
}

export default function AuthCompletePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <AuthCompleteInner />
    </Suspense>
  );
}
