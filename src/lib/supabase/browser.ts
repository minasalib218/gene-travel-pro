"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const url = getSupabaseUrl();
  const publishableKey = getSupabaseAnonKey();
  if (!url || !publishableKey) {
    throw new Error("Missing Supabase browser environment variables");
  }

  browserClient = createBrowserClient(url, publishableKey);
  return browserClient;
}
