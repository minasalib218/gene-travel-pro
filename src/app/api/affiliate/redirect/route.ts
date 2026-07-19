import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRouteClient } from "@/lib/supabase/server";
import type { RecommendationPayload } from "@/lib/recommendation/types";
import { ANALYTICS_SESSION_COOKIE, getAnalyticsLocation, parseUserAgent, recordAnalyticsEvent } from "@/lib/analytics-server";
import { tableExists } from "@/lib/prisma-safe";
import { buildDefaultReadyPlanContent } from "@/lib/ready-plan-content";

export const dynamic = "force-dynamic";

function getBookingItemFromPayload(payload: RecommendationPayload | null | undefined, itemKey: string) {
  return payload?.summaryState?.bookingState?.items?.find((item) => item.key === itemKey) ?? null;
}

function getSafeAffiliateUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const destination = new URL(value);
    if (destination.protocol !== "https:") return null;
    return destination.toString();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteClient();
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id ?? null;

    const affiliateLinkId = req.nextUrl.searchParams.get("id");
    const contentType = req.nextUrl.searchParams.get("type");
    const readyPlanItemId = req.nextUrl.searchParams.get("itemId");
    const planId = req.nextUrl.searchParams.get("planId");
    const itemKey = req.nextUrl.searchParams.get("itemKey");
    const resolveOnly = req.nextUrl.searchParams.get("resolve") === "1";
    const sessionId = req.cookies.get(ANALYTICS_SESSION_COOKIE)?.value || crypto.randomUUID();
    const { country, city } = getAnalyticsLocation(req.headers);
    const { deviceType, browser, os } = parseUserAgent(req.headers.get("user-agent"));

    if (readyPlanItemId) {
      const [readyPlanId, contentItemId] = readyPlanItemId.split(":");
      if (!readyPlanId || !contentItemId) {
        return NextResponse.json({ ok: false, message: "Booking link is not available yet. Please try another option." }, { status: 400 });
      }

      const itemRecord = await prisma.readyPlanItem
        .findUnique({
          where: { id: contentItemId },
          select: {
            id: true,
            title: true,
            type: true,
            affiliateUrl: true,
            day: {
              select: {
                readyPlan: {
                  select: {
                    id: true,
                    slug: true,
                    title: true,
                    status: true,
                  },
                },
              },
            },
          },
        })
        .catch(() => null);

      if (itemRecord) {
        const itemPlan = itemRecord.day?.readyPlan;
        const destinationUrl = getSafeAffiliateUrl(itemRecord.affiliateUrl);

        if (!itemPlan || itemPlan.id !== readyPlanId || itemPlan.status !== "PUBLISHED" || !destinationUrl) {
          return NextResponse.json({ ok: false, message: "Booking link is not available yet. Please try another option." }, { status: 404 });
        }

        const metadata = {
          contentType: "ready-plan-item",
          readyPlanId,
          contentItemId,
          itemRecordId: itemRecord.id,
          slug: itemPlan.slug,
          title: itemPlan.title,
          itemTitle: itemRecord.title,
          itemType: itemRecord.type,
        };

        await (prisma as any).trafficEvent
          ?.create({
            data: {
              userId,
              path: `/api/affiliate/redirect`,
              source: "ready-plan-item",
              eventType: "AFFILIATE_BOOKING_CLICK",
              metadata,
            },
          })
          ?.catch(() => null);

        await recordAnalyticsEvent({
          userId: userId ?? undefined,
          sessionId,
          eventName: "affiliate_redirect_clicked",
          eventCategory: "commerce",
          pagePath: "/api/affiliate/redirect",
          referrer: req.headers.get("referer"),
          country,
          city,
          deviceType,
          browser,
          os,
          metadata,
        });

        if (resolveOnly) return NextResponse.json({ ok: true });
        return NextResponse.redirect(destinationUrl, { status: 302 });
      }

      const plan = await prisma.readyPlan.findUnique({
        where: { id: readyPlanId },
        select: {
          id: true,
          slug: true,
          title: true,
          subtitle: true,
          destination: true,
          daysCount: true,
          heroImage: true,
          coverImage: true,
          priceFrom: true,
          currency: true,
          status: true,
          daysJson: true,
          contentJson: true,
          style: true,
        },
      }).catch(() => null);

      if (!plan || plan.status !== "PUBLISHED") {
        return NextResponse.json({ ok: false, message: "Booking link is not available yet. Please try another option." }, { status: 404 });
      }

      const content = buildDefaultReadyPlanContent({
        title: plan.title,
        subtitle: plan.subtitle,
        destination: plan.destination,
        daysCount: plan.daysCount,
        heroImage: plan.heroImage,
        coverImage: plan.coverImage,
        currency: plan.currency,
        priceFrom: plan.priceFrom,
        style: (plan as any).style,
        daysJson: plan.daysJson,
        contentJson: (plan as any).contentJson,
      });

      const item = content.days.flatMap((day) => day.timelineItems).find((entry) => entry.id === contentItemId);
      const destinationUrl = getSafeAffiliateUrl(item?.deeplink);
      if (!destinationUrl) {
        return NextResponse.json({ ok: false, message: "Booking link is not available yet. Please try another option." }, { status: 404 });
      }

      const metadata = {
        contentType: "ready-plan-item",
        readyPlanId,
        contentItemId,
        slug: plan.slug,
        title: plan.title,
        itemTitle: item.title,
        itemType: item.type,
      };

      await (prisma as any).trafficEvent
        ?.create({
          data: {
            userId,
            path: `/api/affiliate/redirect`,
            source: "ready-plan-item",
            eventType: "AFFILIATE_BOOKING_CLICK",
            metadata,
          },
        })
        ?.catch(() => null);

      await recordAnalyticsEvent({
        userId: userId ?? undefined,
        sessionId,
        eventName: "affiliate_redirect_clicked",
        eventCategory: "commerce",
        pagePath: "/api/affiliate/redirect",
        referrer: req.headers.get("referer"),
        country,
        city,
        deviceType,
        browser,
        os,
        metadata,
      });

      if (resolveOnly) return NextResponse.json({ ok: true });
      return NextResponse.redirect(destinationUrl, { status: 302 });
    }

    if (affiliateLinkId && ["destination", "offer", "event", "ready-plan"].includes(contentType || "")) {
      let linkUrl = "";
      let metadata: Record<string, unknown> = { contentType, affiliateLinkId };

      if (contentType === "destination") {
        const destination = await prisma.destination.findUnique({ where: { id: affiliateLinkId } }).catch(() => null);
        if (!destination || destination.status !== "published" || !destination.affiliateLink) {
          return NextResponse.json({ ok: false, message: "Booking link is not available yet. Please try another option." }, { status: 404 });
        }
        linkUrl = destination.affiliateLink;
        metadata = { ...metadata, slug: destination.slug, title: destination.title };
      } else if (contentType === "offer") {
        const offer = await prisma.offer.findUnique({ where: { id: affiliateLinkId } }).catch(() => null);
        if (!offer || offer.status !== "published" || !offer.affiliateLink) {
          return NextResponse.json({ ok: false, message: "Booking link is not available yet. Please try another option." }, { status: 404 });
        }
        linkUrl = offer.affiliateLink;
        metadata = { ...metadata, slug: offer.slug, title: offer.title };
      } else if (contentType === "event") {
        const event = await prisma.event.findUnique({ where: { id: affiliateLinkId } }).catch(() => null);
        if (!event || event.status !== "published" || !event.affiliateLink) {
          return NextResponse.json({ ok: false, message: "Booking link is not available yet. Please try another option." }, { status: 404 });
        }
        linkUrl = event.affiliateLink;
        metadata = { ...metadata, slug: event.slug, title: event.title };
      } else if (contentType === "ready-plan") {
        const includeLinks = await tableExists("ready_plan_links");
        const plan = await (includeLinks
          ? prisma.readyPlan.findUnique({
              where: { id: affiliateLinkId },
              include: { links: { orderBy: { sortOrder: "asc" } } },
            })
          : prisma.readyPlan.findUnique({
              where: { id: affiliateLinkId },
            })).catch(() => null);
        const firstLink = Array.isArray((plan as any)?.links)
          ? (plan as any).links.find((entry: any) => Boolean(entry?.deeplink))
          : null;
        if (!plan || plan.status !== "PUBLISHED" || !firstLink?.deeplink) {
          return NextResponse.json({ ok: false, message: "Booking link is not available yet. Please try another option." }, { status: 404 });
        }
        linkUrl = firstLink.deeplink;
        metadata = { ...metadata, slug: plan.slug, title: plan.title };
      }

      await (prisma as any).trafficEvent
        ?.create({
          data: {
            userId,
            path: `/api/affiliate/redirect`,
            source: contentType || "affiliate",
            eventType: "AFFILIATE_BOOKING_CLICK",
            metadata,
          },
        })
        ?.catch(() => null);

      await recordAnalyticsEvent({
        userId: userId ?? undefined,
        sessionId,
        eventName: "affiliate_redirect_clicked",
        eventCategory: "commerce",
        pagePath: "/api/affiliate/redirect",
        referrer: req.headers.get("referer"),
        country,
        city,
        deviceType,
        browser,
        os,
        metadata,
      });

      const destinationUrl = getSafeAffiliateUrl(linkUrl);
      if (!destinationUrl) {
        return NextResponse.json({ ok: false, message: "Booking link is not available yet. Please try another option." }, { status: 400 });
      }

      if (resolveOnly) return NextResponse.json({ ok: true, url: destinationUrl });
      return NextResponse.redirect(destinationUrl, { status: 302 });
    }

    if (affiliateLinkId) {
      const link = await (prisma as any).affiliateLink?.findUnique?.({ where: { id: affiliateLinkId } }).catch(() => null);
      if (!link || link.status !== "ACTIVE" || !link.url) {
        return NextResponse.json({ ok: false, message: "Booking link is not available yet. Please try another option." }, { status: 404 });
      }

      await (prisma as any).trafficEvent
        ?.create({
          data: {
            userId,
            path: `/api/affiliate/redirect`,
            source: link.provider || "affiliate",
            eventType: "AFFILIATE_BOOKING_CLICK",
            metadata: {
              affiliateLinkId: link.id,
              category: link.category,
              destination: link.destination ?? null,
            },
          },
        })
        ?.catch(() => null);

      await recordAnalyticsEvent({
        userId: userId ?? undefined,
        sessionId,
        eventName: "affiliate_redirect_clicked",
        eventCategory: "commerce",
        pagePath: "/api/affiliate/redirect",
        referrer: req.headers.get("referer"),
        country,
        city,
        deviceType,
        browser,
        os,
        metadata: {
          affiliateLinkId: link.id,
          category: link.category,
          destination: link.destination ?? null,
          provider: link.provider || "affiliate",
        },
      });

      const destinationUrl = getSafeAffiliateUrl(link.url);
      if (!destinationUrl) {
        return NextResponse.json({ ok: false, message: "Booking link is not available yet. Please try another option." }, { status: 400 });
      }

      if (resolveOnly) {
        return NextResponse.json({ ok: true, url: destinationUrl });
      }

      return NextResponse.redirect(destinationUrl, { status: 302 });
    }

    if (!planId || !itemKey) {
      return NextResponse.json({ ok: false, message: "Booking link is not available yet. Please try another option." }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ ok: false, message: "Please sign in to continue booking." }, { status: 401 });
    }

    const plan = await prisma.plan.findFirst({
      where: {
        id: planId,
        userId,
      },
      select: {
        id: true,
        summaryJson: true,
      },
    });

    if (!plan) {
      return NextResponse.json({ ok: false, message: "Booking item could not be verified for this trip." }, { status: 404 });
    }

    const summaryJson = (plan.summaryJson as Record<string, any> | null) ?? {};
    const payload = (summaryJson.payload ?? null) as RecommendationPayload | null;
    const bookingItem = getBookingItemFromPayload(payload, itemKey);

    if (!bookingItem) {
      return NextResponse.json({ ok: false, message: "Booking link is not available yet. Please try another option." }, { status: 404 });
    }

    const destinationUrl = getSafeAffiliateUrl(
      bookingItem.bookingReference?.sourceUrl ?? bookingItem.affiliateRedirectUrl,
    );
    if (!destinationUrl) {
      return NextResponse.json({ ok: false, message: "Booking link is not available yet. Please try another option." }, { status: 404 });
    }

    await (prisma as any).trafficEvent
      ?.create({
        data: {
        userId,
          path: `/api/affiliate/redirect`,
          source: bookingItem.affiliateProvider || bookingItem.provider || "affiliate",
          eventType: "AFFILIATE_BOOKING_CLICK",
          metadata: {
            planId,
            itemKey,
            itemId: bookingItem.id,
            itemType: bookingItem.type,
            destinationId: bookingItem.destinationId ?? null,
          },
        },
      })
      ?.catch(() => null);

    await recordAnalyticsEvent({
        userId,
      sessionId,
      eventName: "affiliate_redirect_clicked",
      eventCategory: "commerce",
      pagePath: "/api/affiliate/redirect",
      referrer: req.headers.get("referer"),
      country,
      city,
      deviceType,
      browser,
      os,
      metadata: {
        planId,
        itemKey,
        itemId: bookingItem.id,
        itemType: bookingItem.type,
        destinationId: bookingItem.destinationId ?? null,
        provider: bookingItem.affiliateProvider || bookingItem.provider || "affiliate",
      },
    });

    if (resolveOnly) {
      return NextResponse.json({ ok: true, url: destinationUrl });
    }

    return NextResponse.redirect(destinationUrl, { status: 302 });
  } catch (error) {
    console.error("affiliate redirect error", error);
    return NextResponse.json({ ok: false, message: "Booking link is not available yet. Please try another option." }, { status: 500 });
  }
}
