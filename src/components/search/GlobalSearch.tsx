"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

type SearchScope = "public" | "profile";

type SearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  href: string;
  image?: string;
};

type Props = {
  scope?: SearchScope;
  placeholder?: string;
  compact?: boolean;
};

function highlightParts(title: string, query: string) {
  const needle = query.trim();
  if (!needle) return [title];

  const index = title.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) return [title];

  return [
    title.slice(0, index),
    <mark key="match" className="bg-[#ff7a00]/25 text-[#ffd0a3]">
      {title.slice(index, index + needle.length)}
    </mark>,
    title.slice(index + needle.length),
  ];
}

function resultTypeLabel(type: string) {
  const labels: Record<string, string> = {
    "ready-plan": "Ready Plan",
    ready_plan: "Ready Plan",
    destination: "Destination",
    offer: "Offer",
    event: "Event",
    trip: "My Trip",
    favorite: "Favorite",
    reminder: "Reminder",
    booking: "Booking",
  };
  return labels[type] || type.replace(/[-_]/g, " ");
}

export default function GlobalSearch({
  scope = "public",
  placeholder = "Search destinations, plans, offers...",
  compact = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const trimmed = query.trim();

  const resultUrl = useMemo(() => {
    const params = new URLSearchParams({ q: trimmed, scope });
    return `/api/search?${params.toString()}`;
  }, [scope, trimmed]);

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, []);

  useEffect(() => {
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(resultUrl, {
          signal: controller.signal,
          headers: { accept: "application/json" },
        });
        const data = await response.json().catch(() => null);
        setResults(response.ok && data?.ok ? data.results ?? [] : []);
        setActiveIndex(0);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [resultUrl, trimmed]);

  function submitActive() {
    const target = results[activeIndex] || results[0];
    if (target?.href) window.location.href = target.href;
  }

  return (
    <div ref={boxRef} className={`relative ${compact ? "w-full" : "w-full md:w-[22rem]"}`}>
      <label className="sr-only" htmlFor={`gene-search-${scope}`}>
        Search Gene Travel
      </label>
      <div className="flex h-11 items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-4 text-sm text-white shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl transition focus-within:border-[#ff7a00]/45">
        <Search className="h-4 w-4 shrink-0 text-white/62" />
        <input
          id={`gene-search-${scope}`}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => Math.min(results.length - 1, index + 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(0, index - 1));
            }
            if (event.key === "Enter" && results.length) {
              event.preventDefault();
              submitActive();
            }
            if (event.key === "Escape") setOpen(false);
          }}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/45"
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-[#ffb36c]" /> : null}
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open && trimmed.length >= 2 ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 max-h-[70vh] w-full min-w-[min(92vw,26rem)] overflow-hidden rounded-2xl border border-white/12 bg-[#07111a]/96 shadow-[0_28px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          {results.length ? (
            <div className="max-h-[70vh] overflow-y-auto p-2">
              {results.map((result, index) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl p-3 text-left transition ${
                    index === activeIndex ? "bg-[#ff7a00]/14" : "hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="flex min-h-9 min-w-[72px] shrink-0 items-center justify-center rounded-xl border border-[#ff7a00]/25 bg-[#ff7a00]/12 px-2 text-[9px] font-black uppercase tracking-[0.08em] text-[#ffbf82]">
                    {resultTypeLabel(result.type)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {highlightParts(result.title, trimmed)}
                    </span>
                    <span className="mt-1 block truncate text-xs text-white/55">
                      {result.subtitle || resultTypeLabel(result.type)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-5 text-sm text-white/60">
              {loading ? "Searching..." : "No matching published items found."}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
