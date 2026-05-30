import { NextResponse } from "next/server";

export async function GET() {
  const raw = process.env.DATABASE_URL || "";

  const masked = raw.replace(/:(.*?)@/, ":****@");

  return NextResponse.json({
    exists: !!raw,
    masked,
    startsWithPostgresql: raw.startsWith("postgresql://"),
    hasDirectHost: raw.includes(".supabase.co:5432"),
    hasPoolerHost: raw.includes("pooler.supabase.com"),
    hasPgbouncerFlag: raw.includes("pgbouncer=true"),
    hasSchemaFlag: raw.includes("schema="),
    hasSslmodeFlag: raw.includes("sslmode="),
  });
}