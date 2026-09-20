import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/db/client";
import { isDatabaseUnavailableError, isSchemaDriftError, tableExists } from "@/lib/prisma-safe";
import { recordUserActivity } from "@/lib/customer-activity";

function cleanEmail(value: string | null | undefined) {
  const email = value?.trim().toLowerCase();
  return email || null;
}

function cleanName(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function displayNameFromUser(user: User) {
  const metadata = user.user_metadata ?? {};
  return (
    cleanName(metadata.full_name) ||
    cleanName(metadata.name) ||
    cleanName(metadata.display_name) ||
    cleanEmail(user.email)?.split("@")[0] ||
    "Traveler"
  );
}

async function linkLegacyCustomerRecords(userId: string, email: string | null) {
  if (!email) return;

  const operations = [];

  if (await tableExists("customer_events")) {
    operations.push(prisma.customerEvent.updateMany({ where: { email, userId: null }, data: { userId } }));
  }
  if (await tableExists("payments")) {
    operations.push(prisma.payment.updateMany({ where: { customerEmail: email, userId: null }, data: { userId } }));
  }
  if (await tableExists("passes")) {
    operations.push(
      prisma.pass.updateMany({
        where: { customerEmail: email, userId: null },
        data: { userId, profileId: userId },
      }),
    );
  }
  if (await tableExists("credit_ledger")) {
    operations.push(prisma.creditLedger.updateMany({ where: { customerEmail: email, userId: null }, data: { userId } }));
  }
  if (await tableExists("email_logs")) {
    operations.push(prisma.emailLog.updateMany({ where: { customerEmail: email, userId: null }, data: { userId } }));
  }

  if (operations.length) {
    await prisma.$transaction(operations);
  }
}

export async function ensureUserProfile(user: User, event?: string) {
  const email = cleanEmail(user.email);
  const fullName = displayNameFromUser(user);
  const avatarUrl = cleanName(user.user_metadata?.avatar_url);

  try {
    const existing = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { id: true, fullName: true, createdAt: true },
    });

    const profile = await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        email,
        fullName: existing?.fullName || fullName,
        avatarUrl,
      },
      create: {
        id: user.id,
        email,
        fullName,
        avatarUrl,
      },
    });

    await linkLegacyCustomerRecords(user.id, email).catch((error) => {
      console.error("ensureUserProfile legacy link warning:", error);
    });

    const activityEvent = event || (!existing ? "PROFILE_CREATED" : null);
    if (activityEvent) {
      await recordUserActivity({
        userId: user.id,
        event: activityEvent,
        entityType: "PROFILE",
        entityId: user.id,
        metadata: { email },
      });
    }

    return profile;
  } catch (error) {
    if (isDatabaseUnavailableError(error) || isSchemaDriftError(error)) {
      console.error("ensureUserProfile database warning:", error);
      return null;
    }
    throw error;
  }
}
