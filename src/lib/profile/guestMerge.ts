import { prisma } from "@/lib/prisma";
import { ANALYTICS_ANONYMOUS_COOKIE, ANALYTICS_SESSION_COOKIE } from "@/lib/analytics-server";
import { recordUserActivity } from "@/lib/customer-activity";
import { isDatabaseUnavailableError, isSchemaDriftError, tableExists } from "@/lib/prisma-safe";

type GuestMergeInput = {
  userId: string;
  sessionId?: string | null;
  anonymousId?: string | null;
  source?: string;
};

export function readGuestIdentityFromCookieHeader(cookieHeader: string | null | undefined) {
  const cookies = new Map<string, string>();

  for (const part of (cookieHeader ?? "").split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf("=");
    const name = separator === -1 ? trimmed : trimmed.slice(0, separator);
    const value = separator === -1 ? "" : trimmed.slice(separator + 1);
    try {
      cookies.set(name, decodeURIComponent(value));
    } catch {
      cookies.set(name, value);
    }
  }

  return {
    sessionId: cookies.get(ANALYTICS_SESSION_COOKIE) ?? null,
    anonymousId: cookies.get(ANALYTICS_ANONYMOUS_COOKIE) ?? null,
  };
}

function hasGuestIdentity(input: GuestMergeInput) {
  return Boolean(input.sessionId?.trim() || input.anonymousId?.trim());
}

function guestWhere(sessionId: string | null, anonymousId: string | null) {
  const OR = [];
  if (sessionId) OR.push({ sessionId });
  if (anonymousId) OR.push({ anonymousId });
  return OR;
}

export async function mergeGuestDataIntoUser(input: GuestMergeInput) {
  if (!input.userId || !hasGuestIdentity(input)) {
    return { merged: false, reason: "NO_GUEST_IDENTITY" as const };
  }

  const sessionId = input.sessionId?.trim() || null;
  const anonymousId = input.anonymousId?.trim() || null;
  let updatedRows = 0;

  try {
    const operations = [];
    const guestFilters = guestWhere(sessionId, anonymousId);

    if (guestFilters.length && (await tableExists("analytics_events"))) {
      operations.push(
        prisma.analyticsEvent.updateMany({
          where: {
            userId: null,
            OR: guestFilters,
          },
          data: { userId: input.userId },
        }),
      );
    }

    if (await tableExists("analytics_sessions") && sessionId) {
      operations.push(
        prisma.analyticsSession.updateMany({
          where: { id: sessionId, userId: null },
          data: { userId: input.userId, anonymousId },
        }),
      );
    }

    if (guestFilters.length && (await tableExists("user_attribution"))) {
      operations.push(
        prisma.userAttribution.updateMany({
          where: {
            userId: null,
            OR: guestFilters,
          },
          data: { userId: input.userId },
        }),
      );
    }

    if (await tableExists("conversion_events") && sessionId) {
      operations.push(
        prisma.conversionEvent.updateMany({
          where: { userId: null, sessionId },
          data: { userId: input.userId },
        }),
      );
    }

    if (await tableExists("purchase_tracking") && sessionId) {
      operations.push(
        prisma.purchaseTracking.updateMany({
          where: { userId: null, sessionId },
          data: { userId: input.userId },
        }),
      );
    }

    if (await tableExists("funnel_events") && sessionId) {
      operations.push(
        prisma.funnelEvent.updateMany({
          where: { userId: null, sessionId },
          data: { userId: input.userId },
        }),
      );
    }

    if (!operations.length) {
      return { merged: false, reason: "NO_SUPPORTED_TABLES" as const };
    }

    const results = await prisma.$transaction(operations);
    updatedRows = results.reduce((total, result) => total + result.count, 0);

    await recordUserActivity({
      userId: input.userId,
      event: "GUEST_DATA_MERGED",
      entityType: "PROFILE",
      entityId: input.userId,
      metadata: {
        sessionId,
        anonymousId,
        source: input.source ?? "auth",
        updatedRows,
      },
    });

    return { merged: true, updatedRows };
  } catch (error) {
    if (isDatabaseUnavailableError(error) || isSchemaDriftError(error)) {
      console.error("guest merge database warning:", error);
      return { merged: false, reason: "DATABASE_UNAVAILABLE" as const };
    }
    throw error;
  }
}
