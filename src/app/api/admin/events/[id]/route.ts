import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { buildEventLiveData, parseEventLiveRecord } from "@/lib/content/events-live";
import { revalidatePath } from "next/cache";

function revalidateEventPaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath("/events");
  if (slug) revalidatePath(`/events/${slug}`);
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  const code = typeof (admin as any)?.code === "string" ? (admin as any).code : "FORBIDDEN";
  if (!admin.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  const row = await prisma.event.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true, event: parseEventLiveRecord(row as any) });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  const code = typeof (admin as any)?.code === "string" ? (admin as any).code : "FORBIDDEN";
  if (!admin.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  const existing = await prisma.event.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });

  try {
    const payload = buildEventLiveData({ ...(existing as any), ...(await req.json().catch(() => ({}))) });
    const updated = await prisma.event.update({ where: { id: params.id }, data: payload });
    revalidateEventPaths(updated.slug);
    return NextResponse.json({ ok: true, event: parseEventLiveRecord(updated as any) });
  } catch (error: any) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT", message: error?.message || "INVALID_INPUT" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  const code = typeof (admin as any)?.code === "string" ? (admin as any).code : "FORBIDDEN";
  if (!admin.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  const existing = await prisma.event.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  await prisma.event.update({ where: { id: params.id }, data: { status: "removed" } });
  revalidateEventPaths(existing.slug);
  return NextResponse.json({ ok: true });
}
