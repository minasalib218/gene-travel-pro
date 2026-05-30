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

export async function GET() {
  const admin = await requireAdmin();
  const code = typeof (admin as any)?.code === "string" ? (admin as any).code : "FORBIDDEN";
  if (!admin.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  const rows = await prisma.event.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ ok: true, events: rows.map((row) => parseEventLiveRecord(row as any)) });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  const code = typeof (admin as any)?.code === "string" ? (admin as any).code : "FORBIDDEN";
  if (!admin.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  try {
    const payload = buildEventLiveData(await req.json().catch(() => ({})));
    const created = await prisma.event.create({ data: payload });
    revalidateEventPaths(created.slug);
    return NextResponse.json({ ok: true, id: created.id, event: parseEventLiveRecord(created as any) });
  } catch (error: any) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT", message: error?.message || "INVALID_INPUT" }, { status: 400 });
  }
}
