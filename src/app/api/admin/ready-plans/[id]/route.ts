import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { Prisma, ReadyPlanStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  buildDefaultReadyPlanContent,
  contentToDaysJson,
  normalizeReadyPlanContent,
  type ReadyPlanContent,
} from "@/lib/ready-plan-content";
import { tableExists } from "@/lib/prisma-safe";

function toOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toStatus(value: unknown) {
  return value === ReadyPlanStatus.PUBLISHED
    ? ReadyPlanStatus.PUBLISHED
    : ReadyPlanStatus.DRAFT;
}

function toLinks(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry, index) => {
      const item = entry as Record<string, unknown>;
      const label = String(item?.label ?? "").trim();
      const deeplink = String(item?.deeplink ?? item?.url ?? "").trim();
      if (!label || !deeplink) return null;

      return {
        kind: String(item?.kind ?? "booking").trim() || "booking",
        label,
        deeplink,
        imageUrl: toOptionalString(item?.imageUrl),
        sortOrder: Number(item?.sortOrder ?? index) || index,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function toDayRecords(content: ReadyPlanContent) {
  return content.days.map((day, index) => ({
    dayNumber: day.dayNumber || index + 1,
    title: day.title || null,
    city: day.destinationLabel || null,
    country: day.countryLabel || null,
    date: day.dateLabel || null,
    temperature: day.weatherLabel || null,
    mainImageUrl: day.heroImage || day.previewImage || null,
    locationName: day.routeTo || day.destinationLabel || null,
    locationDescription: day.description || null,
    description: day.quote || null,
    notesJson: day.notes as Prisma.InputJsonValue,
    sortOrder: index,
    items: contentToDaysJson({ ...content, days: [day] })[0]?.items as Prisma.InputJsonValue,
    itemRecords: {
      create: [
        ...day.timelineItems.map((item, itemIndex) => ({
          type: item.type,
          title: item.title || "Untitled item",
          description: item.description || null,
          imageUrl: item.imageUrl || null,
          price: item.price || null,
          peopleCount: item.people || null,
          statusLabel: item.status || null,
          categoryLabel: item.badge || null,
          affiliateUrl: item.deeplink || null,
          buttonLabel: item.buttonLabel || "Book Now",
          sortOrder: itemIndex,
        })),
        ...day.suggestions.map((item, suggestionIndex) => ({
          type: "suggestion",
          title: item.title || "Untitled suggestion",
          description: item.matchReason || null,
          imageUrl: item.imageUrl || null,
          price: item.price || null,
          peopleCount: item.duration || null,
          statusLabel: item.matchScore || null,
          categoryLabel: item.category || null,
          affiliateUrl: null,
          buttonLabel: item.ctaText || "Add to Plan",
          sortOrder: day.timelineItems.length + suggestionIndex,
        })),
        {
          type: "story",
          title: `${day.title || `Day ${day.dayNumber}`} Story`,
          description: day.story.quote || null,
          imageUrl: day.story.imageUrl || null,
          price: null,
          peopleCount: null,
          statusLabel: null,
          categoryLabel: "story",
          affiliateUrl: null,
          buttonLabel: day.story.musicLabel || "Open Story",
          sortOrder: day.timelineItems.length + day.suggestions.length,
        },
      ],
    },
  }));
}

function buildUpdateData(body: any) {
  const data: Record<string, unknown> = {};

  if (body?.status !== undefined) data.status = toStatus(body.status);
  if (body?.slug !== undefined) data.slug = String(body.slug).trim();
  if (body?.title !== undefined) data.title = String(body.title).trim();
  if (body?.subtitle !== undefined) data.subtitle = toOptionalString(body.subtitle);
  if (body?.country !== undefined) data.country = toOptionalString(body.country);
  if (body?.city !== undefined) data.city = toOptionalString(body.city);
  if (body?.destination !== undefined) data.destination = String(body.destination).trim();
  if (body?.style !== undefined) data.style = toOptionalString(body.style);
  if (body?.daysCount !== undefined || body?.days !== undefined) {
    data.daysCount = Math.max(0, Number(body.daysCount ?? body.days) || 0);
  }
  if (body?.priceFrom !== undefined) data.priceFrom = toOptionalNumber(body.priceFrom);
  if (body?.currency !== undefined) data.currency = toOptionalString(body.currency) ?? "USD";
  if (body?.heroImage !== undefined || body?.heroImageUrl !== undefined || body?.imageUrl !== undefined) {
    data.heroImage = toOptionalString(body.heroImage ?? body.heroImageUrl ?? body.imageUrl);
  }
  if (body?.coverImage !== undefined) data.coverImage = toOptionalString(body.coverImage);
  if (body?.summary !== undefined) data.summary = toOptionalString(body.summary);
  if (body?.seoTitle !== undefined) data.seoTitle = toOptionalString(body.seoTitle);
  if (body?.seoDescription !== undefined) data.seoDescription = toOptionalString(body.seoDescription);
  if (body?.tags !== undefined) data.tags = Array.isArray(body.tags) ? body.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean) : [];
  if (body?.season !== undefined) data.season = toOptionalString(body.season);
  if (body?.showOnHome !== undefined) data.showOnHome = Boolean(body.showOnHome);
  if (body?.links !== undefined) data.links = toLinks(body.links);

  const basePlan = {
    title: String(data.title ?? body?.title ?? "").trim(),
    subtitle: (data.subtitle as string | null | undefined) ?? toOptionalString(body?.subtitle),
    destination: String(data.destination ?? body?.destination ?? "").trim(),
    daysCount: Number(data.daysCount ?? body?.daysCount ?? body?.days ?? 0) || 0,
    heroImage:
      (data.heroImage as string | null | undefined) ??
      toOptionalString(body?.heroImage ?? body?.heroImageUrl ?? body?.imageUrl),
    coverImage: (data.coverImage as string | null | undefined) ?? toOptionalString(body?.coverImage),
    priceFrom: (data.priceFrom as number | null | undefined) ?? toOptionalNumber(body?.priceFrom),
    currency: (data.currency as string | undefined) ?? toOptionalString(body?.currency) ?? "USD",
    style: (data.style as string | null | undefined) ?? toOptionalString(body?.style),
    daysJson: Array.isArray(body?.daysJson) ? body.daysJson : [],
    contentJson: body?.contentJson,
  };

  const normalizedContent = normalizeReadyPlanContent(
    body?.contentJson ?? buildDefaultReadyPlanContent(basePlan),
    basePlan,
  );

  data.daysJson = contentToDaysJson(normalizedContent);
  data.contentJson = normalizedContent;
  data.dayRecords = toDayRecords(normalizedContent);

  return data;
}

function isSchemaMismatchError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    ((error as any).code === "P2021" || (error as any).code === "P2022")
  );
}

function revalidateReadyPlanPaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/ready-plans");
  revalidatePath("/ready-plans");
  revalidatePath("/destinations");

  if (slug) {
    revalidatePath(`/ready-plans/${slug}`);
    revalidatePath(`/destinations/${slug}`);
  }
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin();
  const code = typeof (a as any)?.code === "string" ? (a as any).code : "FORBIDDEN";
  if (!a.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  const includeLinks = await tableExists("ready_plan_links");
  let plan;
  try {
    if (includeLinks) {
      plan = await prisma.readyPlan.findUnique({
        where: { id: params.id },
        include: {
          links: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });
    } else {
      plan = await prisma.readyPlan.findUnique({
        where: { id: params.id },
      });
    }
  } catch (error) {
    if (!isSchemaMismatchError(error)) throw error;
    plan = await prisma.readyPlan.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        slug: true,
        title: true,
        subtitle: true,
        destination: true,
        daysCount: true,
        heroImage: true,
        coverImage: true,
        priceFrom: true,
        currency: true,
        daysJson: true,
        createdAt: true,
        updatedAt: true,
        ...(includeLinks
          ? {
              links: {
                orderBy: { sortOrder: "asc" },
              },
            }
          : {}),
      },
    } as any);
  }
  if (!plan) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ ok: true, plan });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin();
  const code = typeof (a as any)?.code === "string" ? (a as any).code : "FORBIDDEN";
  if (!a.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const data = buildUpdateData(body);
  const linksTableExists = await tableExists("ready_plan_links");
  const dayRecordsTableExists = await tableExists("ready_plan_days");
  const itemRecordsTableExists = await tableExists("ready_plan_items");
  const richUpdateData = {
    ...(data.status !== undefined ? { status: data.status as ReadyPlanStatus } : {}),
    ...(data.slug !== undefined ? { slug: data.slug as string } : {}),
    ...(data.title !== undefined ? { title: data.title as string } : {}),
    ...(data.subtitle !== undefined ? { subtitle: data.subtitle as string | null } : {}),
    ...(data.country !== undefined ? { country: data.country as string | null } : {}),
    ...(data.city !== undefined ? { city: data.city as string | null } : {}),
    ...(data.destination !== undefined ? { destination: data.destination as string } : {}),
    ...(data.style !== undefined ? { style: data.style as string | null } : {}),
    ...(data.daysCount !== undefined ? { daysCount: data.daysCount as number } : {}),
    ...(data.priceFrom !== undefined ? { priceFrom: data.priceFrom as number | null } : {}),
    ...(data.currency !== undefined ? { currency: data.currency as string } : {}),
    ...(data.heroImage !== undefined ? { heroImage: data.heroImage as string | null } : {}),
    ...(data.coverImage !== undefined ? { coverImage: data.coverImage as string | null } : {}),
    ...(data.summary !== undefined ? { summary: data.summary as string | null } : {}),
    ...(data.seoTitle !== undefined ? { seoTitle: data.seoTitle as string | null } : {}),
    ...(data.seoDescription !== undefined ? { seoDescription: data.seoDescription as string | null } : {}),
    ...(data.tags !== undefined ? { tags: data.tags as string[] } : {}),
    ...(data.season !== undefined ? { season: data.season as string | null } : {}),
    ...(data.showOnHome !== undefined ? { showOnHome: data.showOnHome as boolean } : {}),
    ...(data.daysJson !== undefined ? { daysJson: data.daysJson as Prisma.InputJsonValue } : {}),
    ...(data.contentJson !== undefined ? { contentJson: data.contentJson as Prisma.InputJsonValue } : {}),
    ...(dayRecordsTableExists && data.dayRecords !== undefined
      ? {
          dayRecords: {
            deleteMany: {},
            create: (itemRecordsTableExists
              ? data.dayRecords
              : (data.dayRecords as any[]).map(({ itemRecords, ...dayRecord }) => dayRecord)) as any,
          },
        }
      : {}),
    ...(linksTableExists && data.links !== undefined
      ? {
          links: {
            deleteMany: {},
            create: data.links as {
              kind: string;
              label: string;
              deeplink: string;
              imageUrl: string | null;
              sortOrder: number;
            }[],
          },
        }
      : {}),
  };

  const legacyUpdateData = {
    ...(data.status !== undefined ? { status: data.status as ReadyPlanStatus } : {}),
    ...(data.slug !== undefined ? { slug: data.slug as string } : {}),
    ...(data.title !== undefined ? { title: data.title as string } : {}),
    ...(data.subtitle !== undefined ? { subtitle: data.subtitle as string | null } : {}),
    ...(data.destination !== undefined ? { destination: data.destination as string } : {}),
    ...(data.daysCount !== undefined ? { daysCount: data.daysCount as number } : {}),
    ...(data.priceFrom !== undefined ? { priceFrom: data.priceFrom as number | null } : {}),
    ...(data.currency !== undefined ? { currency: data.currency as string } : {}),
    ...(data.heroImage !== undefined ? { heroImage: data.heroImage as string | null } : {}),
    ...(data.coverImage !== undefined ? { coverImage: data.coverImage as string | null } : {}),
    ...(data.daysJson !== undefined ? { daysJson: data.daysJson as Prisma.InputJsonValue } : {}),
    ...(dayRecordsTableExists && data.dayRecords !== undefined
      ? {
          dayRecords: {
            deleteMany: {},
            create: (itemRecordsTableExists
              ? data.dayRecords
              : (data.dayRecords as any[]).map(({ itemRecords, ...dayRecord }) => dayRecord)) as any,
          },
        }
      : {}),
    ...(linksTableExists && data.links !== undefined
      ? {
          links: {
            deleteMany: {},
            create: data.links as {
              kind: string;
              label: string;
              deeplink: string;
              imageUrl: string | null;
              sortOrder: number;
            }[],
          },
        }
      : {}),
  };

  let updated;
  try {
    updated = await prisma.readyPlan.update({
      where: { id: params.id },
      data: richUpdateData,
      include: {
        ...(linksTableExists
          ? {
              links: {
                orderBy: { sortOrder: "asc" },
              },
            }
          : {}),
      },
    });
  } catch (error) {
    if (!isSchemaMismatchError(error)) throw error;
    updated = await prisma.readyPlan.update({
      where: { id: params.id },
      data: legacyUpdateData,
      include: {
        ...(linksTableExists
          ? {
              links: {
                orderBy: { sortOrder: "asc" },
              },
            }
          : {}),
      },
    } as any);
  }

  revalidateReadyPlanPaths(updated.slug);

  return NextResponse.json({ ok: true, plan: updated });
}

export async function PUT(req: Request, ctx: { params: { id: string } }) {
  return PATCH(req, ctx);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin();
  const code = typeof (a as any)?.code === "string" ? (a as any).code : "FORBIDDEN";
  if (!a.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  const existing = await prisma.readyPlan.findUnique({ where: { id: params.id } });
  await prisma.readyPlan.delete({ where: { id: params.id } });
  revalidateReadyPlanPaths(existing?.slug);
  return NextResponse.json({ ok: true });
}
