"use client";

import { useLanguage } from "./LanguageProvider";

export default function LocalizedText({ tKey, fallback }: { tKey: string; fallback?: string }) {
  const { t } = useLanguage();
  return <>{t(tKey, fallback)}</>;
}
