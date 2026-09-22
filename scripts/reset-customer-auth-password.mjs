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

const cwd = process.cwd();
const localEnv = {
  ...parseDotenv(path.join(cwd, ".env")),
  ...parseDotenv(path.join(cwd, ".env.local")),
  ...process.env,
};

const email = String(process.argv[2] || "").trim().toLowerCase();
const password = String(process.argv[3] || "");

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
  throw new Error("Usage: node scripts/reset-customer-auth-password.mjs customer@example.com new-password");
}

const supabaseUrl = localEnv.NEXT_PUBLIC_SUPABASE_URL || localEnv.SUPABASE_URL;
const serviceRoleKey = localEnv.SUPABASE_SERVICE_ROLE_KEY || localEnv.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase admin environment variables.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let authUser = null;
for (let page = 1; page <= 20 && !authUser; page += 1) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw error;
  authUser = data.users.find((user) => user.email?.toLowerCase() === email) || null;
  if (!data.users.length || data.users.length < 100) break;
}

if (!authUser) {
  throw new Error(`No Supabase Auth user found for ${email}.`);
}

const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
  password,
  email_confirm: true,
  user_metadata: {
    ...authUser.user_metadata,
    full_name:
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      email.split("@")[0],
  },
});

if (error) throw error;

console.log(JSON.stringify({ ok: true, userId: authUser.id, email }, null, 2));
