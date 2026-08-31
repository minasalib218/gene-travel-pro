import { prisma } from "@/lib/db/client";
import { tableExists } from "@/lib/prisma-safe";
import { Prisma } from "@prisma/client";

type JsonRecord = Record<string, unknown>;

async function hasTable(tableName: string) {
  try {
    return await tableExists(tableName);
  } catch {
    return false;
  }
}

export async function recordUserActivity(input: {
  userId?: string | null;
  event: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: JsonRecord | null;
}) {
  if (!input.userId) return;
  if (!(await hasTable("user_activity"))) return;

  await prisma.userActivity
    .create({
      data: {
        userId: input.userId,
        event: input.event,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    })
    .catch((error) => {
      console.error("recordUserActivity error", error);
    });
}

export async function recordBookingClick(input: {
  userId?: string | null;
  planId?: string | null;
  planItemId?: string | null;
  readyPlanId?: string | null;
  readyPlanItemId?: string | null;
  provider?: string | null;
  providerItemId?: string | null;
  itemName: string;
  itemType?: string | null;
  destination?: string | null;
  metadata?: JsonRecord | null;
}) {
  if (!(await hasTable("booking_clicks"))) return;

  await prisma.bookingClick
    .create({
      data: {
        userId: input.userId ?? null,
        planId: input.planId ?? null,
        planItemId: input.planItemId ?? null,
        readyPlanId: input.readyPlanId ?? null,
        readyPlanItemId: input.readyPlanItemId ?? null,
        provider: input.provider ?? null,
        providerItemId: input.providerItemId ?? null,
        itemName: input.itemName,
        itemType: input.itemType ?? null,
        destination: input.destination ?? null,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    })
    .catch((error) => {
      console.error("recordBookingClick error", error);
    });
}

export async function upsertRecentlyViewed(input: {
  userId?: string | null;
  entityType: string;
  entityId: string;
  metadata?: JsonRecord | null;
}) {
  if (!input.userId) return;
  if (!(await hasTable("recently_viewed"))) return;

  await prisma.recentlyViewed
    .upsert({
      where: {
        userId_entityType_entityId: {
          userId: input.userId,
          entityType: input.entityType,
          entityId: input.entityId,
        },
      },
      update: {
        viewedAt: new Date(),
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
      create: {
        userId: input.userId,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    })
    .catch((error) => {
      console.error("upsertRecentlyViewed error", error);
    });
}
