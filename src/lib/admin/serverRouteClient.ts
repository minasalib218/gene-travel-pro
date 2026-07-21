import { createServerClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

function parseCookieHeader(cookieHeader: string) {
  return cookieHeader
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const idx = c.indexOf("=");
      return {
        name: idx === -1 ? c : c.slice(0, idx),
        value: idx === -1 ? "" : decodeURIComponent(c.slice(idx + 1)),
      };
    });
}

export function createRequestSupabaseClient(req: Request, res: Response) {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase client environment variables");
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(req.headers.get("cookie") ?? "");
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // @ts-expect-error NextResponse extends the standard Response with cookies helpers
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );
}
