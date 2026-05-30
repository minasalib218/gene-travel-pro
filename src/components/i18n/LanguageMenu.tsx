"use client";

import { useEffect, useRef, useState } from "react";
import { Globe2 } from "lucide-react";
import { SUPPORTED_LANGUAGES, useLanguage } from "./LanguageProvider";

export default function LanguageMenu({ embedded = false }: { embedded?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div className={embedded ? "pointer-events-auto" : "pointer-events-none fixed right-5 top-5 z-[90]"}>
      <div ref={panelRef} className="pointer-events-auto relative">
        <button
          type="button"
          aria-label={t("nav.language", "Language")}
          onClick={() => setOpen((value) => !value)}
          className={`flex items-center justify-center text-white/82 transition hover:text-white ${
            embedded
              ? ""
              : "h-11 w-11 rounded-full border border-white/12 bg-black/55 shadow-[0_14px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl hover:border-[#ffb066]/40 hover:bg-black/65"
          }`}
        >
          <Globe2 size={18} />
        </button>

        <div
          className={`absolute right-0 mt-3 w-44 origin-top-right rounded-[22px] border border-white/12 bg-black/70 p-2 text-white shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-2xl transition-all duration-200 ${
            open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
          }`}
        >
          <div className="px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-[#ffbf82]">
            {t("nav.language", "Language")}
          </div>

          {SUPPORTED_LANGUAGES.map((option) => {
            const active = option.code === language;
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => {
                  setLanguage(option.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition ${
                  active ? "bg-[#ff7a00]/18 text-white" : "text-white/78 hover:bg-white/8 hover:text-white"
                }`}
              >
                <span>{option.nativeLabel}</span>
                <span className="text-[11px] text-white/45">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
