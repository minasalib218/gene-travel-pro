import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdmin } from "@/lib/admin/requireAdmin";

type HomeConfigPayload = {
  heroTitle?: string;
  heroSubtitle?: string;
  ctaPrimaryText?: string;
  ctaPrimaryHref?: string;
  ctaSecondaryText?: string;
  ctaSecondaryHref?: string;
};

function deny(a: any) {
  const code = typeof a?.code === "string" ? a.code : "FORBIDDEN";
  return NextResponse.json({ ok: false, code }, { status: 403 });
}

export async function GET() {
  const a = await requireAdmin();
  if (!a.ok) return deny(a);

  const cfg = await prisma.homeConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      heroTitle: "Gene Travel Planner",
      heroSubtitle: "Cinematic ready plans + AI ranking from real providers.",
      ctaPrimaryText: "Explore ready plans",
      ctaPrimaryHref: "/ready-plans",
      ctaSecondaryText: "Create my smart plan",
      ctaSecondaryHref: "/pricing",
    },
  });

  return NextResponse.json({
    ok: true,
    config: {
      heroTitle: cfg.heroTitle,
      heroSubtitle: cfg.heroSubtitle,
      ctaPrimaryText: cfg.ctaPrimaryText,
      ctaPrimaryHref: cfg.ctaPrimaryHref,
      ctaSecondaryText: cfg.ctaSecondaryText,
      ctaSecondaryHref: cfg.ctaSecondaryHref,
      updatedAt: cfg.updatedAt,
    },
  });
}

export async function POST(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return deny(a);

  const body = (await req.json()) as { config?: HomeConfigPayload };
  const patch = body?.config ?? {};

  const cfg = await prisma.homeConfig.upsert({
    where: { id: "singleton" },
    update: {
      heroTitle: patch.heroTitle ?? undefined,
      heroSubtitle: patch.heroSubtitle ?? undefined,
      ctaPrimaryText: patch.ctaPrimaryText ?? undefined,
      ctaPrimaryHref: patch.ctaPrimaryHref ?? undefined,
      ctaSecondaryText: patch.ctaSecondaryText ?? undefined,
      ctaSecondaryHref: patch.ctaSecondaryHref ?? undefined,
    },
    create: {
      id: "singleton",
      heroTitle: patch.heroTitle ?? "Gene Travel Planner",
      heroSubtitle: patch.heroSubtitle ?? "Cinematic ready plans + AI ranking from real providers.",
      ctaPrimaryText: patch.ctaPrimaryText ?? "Explore ready plans",
      ctaPrimaryHref: patch.ctaPrimaryHref ?? "/ready-plans",
      ctaSecondaryText: patch.ctaSecondaryText ?? "Create my smart plan",
      ctaSecondaryHref: patch.ctaSecondaryHref ?? "/pricing",
    },
  });

  return NextResponse.json({
    ok: true,
    config: {
      heroTitle: cfg.heroTitle,
      heroSubtitle: cfg.heroSubtitle,
      ctaPrimaryText: cfg.ctaPrimaryText,
      ctaPrimaryHref: cfg.ctaPrimaryHref,
      ctaSecondaryText: cfg.ctaSecondaryText,
      ctaSecondaryHref: cfg.ctaSecondaryHref,
      updatedAt: cfg.updatedAt,
    },
  });
}