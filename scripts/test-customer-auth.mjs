import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function parseDotenv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = {
  ...parseDotenv(path.join(process.cwd(), ".env")),
  ...parseDotenv(path.join(process.cwd(), ".env.local")),
  ...process.env,
};

const email = String(process.argv[2] || "").trim().toLowerCase();
const password = String(process.argv[3] || "");
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const anonKey =
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  env.SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  env.SUPABASE_PUBLISHABLE_KEY;

if (!email || !password || !supabaseUrl || !anonKey) {
  throw new Error("Missing test input or Supabase public environment variables.");
}

const supabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.auth.signInWithPassword({ email, password });

if (error || !data.user) {
  console.log(JSON.stringify({ ok: false, error: error?.message || "No user returned" }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ ok: true, userId: data.user.id, email: data.user.email }, null, 2));
}
