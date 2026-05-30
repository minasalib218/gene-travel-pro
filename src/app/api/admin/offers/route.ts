import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { buildOfferLiveData, parseOfferLiveRecord } from "@/lib/content/offers-live";
import { revalidatePath } from "next/cache";

function revalidateOfferPaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/offers");
  revalidatePath("/offers");
  if (slug) revalidatePath(`/offers/${slug}`);
}

export async function GET() {
  const admin = await requireAdmin();
  const code = typeof (admin as any)?.code === "string" ? (admin as any).code : "FORBIDDEN";
  if (!admin.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  const rows = await prisma.offer.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ ok: true, offers: rows.map((row) => parseOfferLiveRecord(row as any)) });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  const code = typeof (admin as any)?.code === "string" ? (admin as any).code : "FORBIDDEN";
  if (!admin.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  try {
    const payload = buildOfferLiveData(await req.json().catch(() => ({})));
    const created = await prisma.offer.create({ data: payload });
    revalidateOfferPaths(created.slug);
    return NextResponse.json({ ok: true, id: created.id, offer: parseOfferLiveRecord(created as any) });
  } catch (error: any) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT", message: error?.message || "INVALID_INPUT" }, { status: 400 });
  }
}
