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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

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

function toDaysJson(value: unknown) {
  return Array.isArray(value) ? value : [];
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

function buildPlanData(body: any) {
  const title = String(body?.title ?? "").trim();
  const destination = String(body?.destination ?? "").trim();
  const slug = slugify(String(body?.slug ?? title));
  const daysCount = Math.max(0, Number(body?.daysCount ?? body?.days ?? 0) || 0);
  const basePlan = {
    title,
    subtitle: toOptionalString(body?.subtitle),
    destination,
    daysCount,
    heroImage: toOptionalString(body?.heroImage ?? body?.heroImageUrl ?? body?.imageUrl),
    coverImage: toOptionalString(body?.coverImage),
    priceFrom: toOptionalNumber(body?.priceFrom),
    currency: toOptionalString(body?.currency) ?? "USD",
    style: toOptionalString(body?.style),
    daysJson: toDaysJson(body?.daysJson),
    contentJson: body?.contentJson,
  };
  const normalizedContent = normalizeReadyPlanContent(
    body?.contentJson ?? buildDefaultReadyPlanContent(basePlan),
    basePlan,
  );
  const dayRecords = toDayRecords(normalizedContent);

  return {
    status: toStatus(body?.status),
    slug,
    title,
    subtitle: toOptionalString(body?.subtitle),
    country: toOptionalString(body?.country),
    city: toOptionalString(body?.city),
    destination,
    style: toOptionalString(body?.style),
    daysCount,
    heroImage: basePlan.heroImage,
    coverImage: basePlan.coverImage,
    summary: toOptionalString(body?.summary),
    seoTitle: toOptionalString(body?.seoTitle),
    seoDescription: toOptionalString(body?.seoDescription),
    tags: Array.isArray(body?.tags) ? body.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean) : [],
    season: toOptionalString(body?.season),
    showOnHome: Boolean(body?.showOnHome),
    priceFrom: basePlan.priceFrom,
    currency: basePlan.currency,
    daysJson: contentToDaysJson(normalizedContent),
    contentJson: normalizedContent,
    links: toLinks(body?.links),
    dayRecords,
  };
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

export async function GET() {
  const admin = await requireAdmin();
  const code = typeof (admin as any)?.code === "string" ? (admin as any).code : "FORBIDDEN";
  if (!admin.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  const includeLinks = await tableExists("ready_plan_links");
  const plans = includeLinks
    ? await prisma.readyPlan.findMany({
        include: {
          links: {
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { updatedAt: "desc" },
      })
    : await prisma.readyPlan.findMany({
        orderBy: { updatedAt: "desc" },
      });

  return NextResponse.json({ ok: true, plans });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  const code = typeof (admin as any)?.code === "string" ? (admin as any).code : "FORBIDDEN";
  if (!admin.ok) return NextResponse.json({ ok: false, code }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const data = buildPlanData(body);

  if (!data.title || !data.destination || !data.slug) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  }

  const linksTableExists = await tableExists("ready_plan_links");
  const dayRecordsTableExists = await tableExists("ready_plan_days");
  const itemRecordsTableExists = await tableExists("ready_plan_items");
  const richCreateData = {
    status: data.status,
    slug: data.slug,
    title: data.title,
    subtitle: data.subtitle,
    destination: data.destination,
    country: data.country,
    city: data.city,
    style: data.style,
    daysCount: data.daysCount,
    heroImage: data.heroImage,
    coverImage: data.coverImage,
    summary: data.summary,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    tags: data.tags,
    season: data.season,
    showOnHome: data.showOnHome,
    priceFrom: data.priceFrom,
    currency: data.currency,
    daysJson: data.daysJson as Prisma.InputJsonValue,
    contentJson: data.contentJson as Prisma.InputJsonValue,
    ...(dayRecordsTableExists
      ? {
          dayRecords: {
            create: (itemRecordsTableExists
              ? data.dayRecords
              : data.dayRecords.map(({ itemRecords, ...dayRecord }: any) => dayRecord)) as any,
          },
        }
      : {}),
    ...(linksTableExists
      ? {
          links: {
            create: data.links,
          },
        }
      : {}),
  };

  const legacyCreateData = {
    status: data.status,
    slug: data.slug,
    title: data.title,
    subtitle: data.subtitle,
    destination: data.destination,
    daysCount: data.daysCount,
    heroImage: data.heroImage,
    coverImage: data.coverImage,
    priceFrom: data.priceFrom,
    currency: data.currency,
    daysJson: data.daysJson as Prisma.InputJsonValue,
    ...(dayRecordsTableExists
      ? {
          dayRecords: {
            create: (itemRecordsTableExists
              ? data.dayRecords
              : data.dayRecords.map(({ itemRecords, ...dayRecord }: any) => dayRecord)) as any,
          },
        }
      : {}),
    ...(linksTableExists
      ? {
          links: {
            create: data.links,
          },
        }
      : {}),
  };

  let created;
  try {
    created = await prisma.readyPlan.create({
      data: richCreateData,
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
    created = await prisma.readyPlan.create({
      data: legacyCreateData,
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

  revalidateReadyPlanPaths(created.slug);

  return NextResponse.json({ ok: true, id: created.id, plan: created });
}
