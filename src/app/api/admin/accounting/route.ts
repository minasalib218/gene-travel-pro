import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdmin } from "@/lib/admin/requireAdmin";

function deny(a: any) {
  const code = typeof a?.code === "string" ? a.code : "FORBIDDEN";
  return NextResponse.json({ ok: false, code }, { status: 403 });
}

export async function GET() {
  const a = await requireAdmin();
  if (!a.ok) return deny(a);

  const rows = await prisma.accountingEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ ok: true, rows });
}

export async function POST(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return deny(a);

  const body = await req.json();

  const created = await prisma.accountingEntry.create({
    data: {
      kind: String(body.kind ?? "SPEND"), // "EARN" | "SPEND"
      title: String(body.title ?? "Untitled"),
      amount: Number(body.amount ?? 0),
      currency: String(body.currency ?? "USD"),
      day: body.day ? String(body.day) : null,

      // ✅ بدل note (اللي مش موجودة عندك)
      // نخزن أي تفاصيل داخل meta JSON (لو موجود) وإلا نشيلها تمامًا
      // لو موديلك ما فيهوش meta برضه، احذف السطر ده.
      meta: body.meta ?? null,
    } as any,
  });

  return NextResponse.json({ ok: true, created });
}