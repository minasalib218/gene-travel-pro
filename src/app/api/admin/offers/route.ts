import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { buildOfferLiveData, parseOfferLiveRecord } from "@/lib/content/offers-live";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

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
    const baseSlug = payload.slug || "offer";
    let slug = baseSlug;
    let suffix = 2;
    while (await prisma.offer.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    const created = await prisma.offer.create({ data: { ...payload, slug } });
    revalidateOfferPaths(created.slug);
    return NextResponse.json({ ok: true, id: created.id, offer: parseOfferLiveRecord(created as any) });
  } catch (error: any) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Please check the offer fields.";
      return NextResponse.json({ ok: false, code: "INVALID_INPUT", message }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ ok: false, code: "DUPLICATE_OFFER", message: "An offer with this slug already exists. Change the slug and try again." }, { status: 409 });
    }
    console.error("admin offer create failed", error);
    return NextResponse.json({ ok: false, code: "SAVE_FAILED", message: "The offer could not be saved. Please try again." }, { status: 500 });
  }
}
