"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LANGUAGE, getDirection, isLanguageCode, SUPPORTED_LANGUAGES, translate, type LanguageCode } from "@/lib/i18n";

const STORAGE_KEY = "gene-language";

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (value: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  direction: "ltr" | "rtl";
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && isLanguageCode(saved)) {
      setLanguageState(saved);
      return;
    }

    const browser = navigator.language.toLowerCase().slice(0, 2);
    if (isLanguageCode(browser)) {
      setLanguageState(browser);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = getDirection(language);
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value: LanguageContextValue = {
    language,
    setLanguage: setLanguageState,
    t: (key, fallback) => translate(language, key, fallback),
    direction: getDirection(language),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}

export { SUPPORTED_LANGUAGES };
