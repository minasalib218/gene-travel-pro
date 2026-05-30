import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { buildDestinationData, parseDestinationRecord } from "@/lib/content/destinations";
import { revalidatePath } from "next/cache";

function revalidateDestinationPaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/destinations");
  revalidatePath("/destinations");
  if (slug) revalidatePath(`/destinations/${slug}`);
}

export async function GET() {
  const admin = await requireAdmin();
  const code = typeof (admin as any)?.code === "string" ? (admin as any).code : "FORBIDDEN";
  if (!admin.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  const rows = await prisma.destination.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ ok: true, destinations: rows.map((row) => parseDestinationRecord(row as any)) });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  const code = typeof (admin as any)?.code === "string" ? (admin as any).code : "FORBIDDEN";
  if (!admin.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  try {
    const payload = buildDestinationData(await req.json().catch(() => ({})));
    const created = await prisma.destination.create({ data: payload });
    revalidateDestinationPaths(created.slug);
    return NextResponse.json({ ok: true, id: created.id, destination: parseDestinationRecord(created as any) });
  } catch (error: any) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT", message: error?.message || "INVALID_INPUT" }, { status: 400 });
  }
}
