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

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  const code = typeof (admin as any)?.code === "string" ? (admin as any).code : "FORBIDDEN";
  if (!admin.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  const row = await prisma.destination.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true, destination: parseDestinationRecord(row as any) });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  const code = typeof (admin as any)?.code === "string" ? (admin as any).code : "FORBIDDEN";
  if (!admin.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  const existing = await prisma.destination.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });

  try {
    const payload = buildDestinationData({ ...(existing as any), ...(await req.json().catch(() => ({}))) });
    const updated = await prisma.destination.update({ where: { id: params.id }, data: payload });
    revalidateDestinationPaths(updated.slug);
    return NextResponse.json({ ok: true, destination: parseDestinationRecord(updated as any) });
  } catch (error: any) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT", message: error?.message || "INVALID_INPUT" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  const code = typeof (admin as any)?.code === "string" ? (admin as any).code : "FORBIDDEN";
  if (!admin.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  const existing = await prisma.destination.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });

  const updated = await prisma.destination.update({
    where: { id: params.id },
    data: { status: "removed" },
  });
  revalidateDestinationPaths(updated.slug);
  return NextResponse.json({ ok: true });
}
