"use client";

import { useEffect, useState, useTransition } from "react";
import { Heart } from "lucide-react";

type Props = {
  readyPlanId: string;
  initialSaved?: boolean;
  className?: string;
};

const PENDING_ACTION_KEY = "gene.pendingAction";

function getReturnPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function isSafeInternalPath(path: string) {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\");
}

function savePendingFavorite(readyPlanId: string) {
  const returnTo = getReturnPath();
  if (!isSafeInternalPath(returnTo)) return;

  localStorage.setItem(
    PENDING_ACTION_KEY,
    JSON.stringify({
      type: "favorite_ready_plan",
      readyPlanId,
      returnTo,
      createdAt: Date.now(),
    }),
  );
}

export default function ReadyPlanFavoriteButton({
  readyPlanId,
  initialSaved = false,
  className = "",
}: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function handleFavoriteChange(event: Event) {
      const detail = (event as CustomEvent<{ readyPlanId?: string; saved?: boolean }>).detail;
      if (detail?.readyPlanId === readyPlanId && typeof detail.saved === "boolean") {
        setSaved(detail.saved);
      }
    }

    window.addEventListener("gene:ready-plan-favorite-change", handleFavoriteChange);
    return () => window.removeEventListener("gene:ready-plan-favorite-change", handleFavoriteChange);
  }, [readyPlanId]);

  function toggleFavorite() {
    const nextSaved = !saved;
    setSaved(nextSaved);

    startTransition(async () => {
      try {
        const response = await fetch("/api/profile/favorites", {
          method: nextSaved ? "POST" : "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ readyPlanId }),
        });

        if (response.status === 401) {
          setSaved(!nextSaved);
          if (nextSaved) savePendingFavorite(readyPlanId);
          window.location.href = `/signin?next=${encodeURIComponent(getReturnPath())}`;
          return;
        }

        if (!response.ok) {
          setSaved(!nextSaved);
          return;
        }

        window.dispatchEvent(
          new CustomEvent("gene:ready-plan-favorite-change", {
            detail: { readyPlanId, saved: nextSaved },
          }),
        );
      } catch {
        setSaved(!nextSaved);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite();
      }}
      disabled={isPending}
      aria-label={saved ? "Remove from favorite ready plans" : "Save ready plan"}
      aria-pressed={saved}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-[0_12px_28px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:scale-105 hover:border-[#ff7a00]/45 hover:text-[#ffb46c] disabled:opacity-60 ${className}`}
    >
      <Heart
        size={17}
        className={saved ? "fill-[#ff7a00] text-[#ff7a00]" : "text-white"}
      />
    </button>
  );
}
