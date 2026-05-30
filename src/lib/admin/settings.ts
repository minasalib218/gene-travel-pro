import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPlanRules, type GenePlanType } from "@/lib/credits/planRules";

function isMissingSettingsTableError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (((error as any).code === "P2021") || ((error as any).code === "P2022"))
  );
}

export type StoredPlanConfig = {
  active: boolean;
  price: number;
  currency: string;
  packageName: string;
  mainCreditsTotal: number;
  editCreditsTotal: number;
  expiresInDays: number;
  whatIfFreeTotal: number;
  chatMessagesTotal: number | null;
  expertReviewTotal: number;
  dailyMainAiLimit: number;
  hourlyMainAiLimit: number;
  cooldownSeconds: number;
  monthlyTokenLimit: number;
  aiPriority: "slow" | "medium" | "highest";
};

export type PlanConfigs = Record<GenePlanType, StoredPlanConfig>;

export const DEFAULT_PLAN_CONFIGS: PlanConfigs = {
  starter: {
    active: true,
    price: 49,
    currency: "USD",
    ...getPlanRules("starter"),
  },
  pro: {
    active: true,
    price: 99,
    currency: "USD",
    ...getPlanRules("pro"),
  },
  agency: {
    active: true,
    price: 199,
    currency: "USD",
    ...getPlanRules("agency"),
  },
};

export async function getAdminSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const rows = await prisma.$queryRaw<Array<{ value: unknown }>>(
      Prisma.sql`SELECT value FROM admin_settings WHERE key = ${key} LIMIT 1`,
    );
    return (rows?.[0]?.value as T | undefined) ?? fallback;
  } catch (error) {
    if (isMissingSettingsTableError(error)) return fallback;
    throw error;
  }
}

export async function setAdminSetting<T>(key: string, value: T) {
  try {
    const serialized = JSON.stringify(value ?? {});
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO admin_settings (id, key, value, "updatedAt", "createdAt")
        VALUES (${`setting:${key}`}, ${key}, ${serialized}::jsonb, NOW(), NOW())
        ON CONFLICT (key)
        DO UPDATE SET value = ${serialized}::jsonb, "updatedAt" = NOW()
      `,
    );
    return { key, value };
  } catch (error) {
    if (isMissingSettingsTableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function getBlockedUserIds() {
  const blocked = await getAdminSetting<string[]>("blocked-users", []);
  return Array.isArray(blocked) ? blocked : [];
}

export async function setBlockedUserIds(userIds: string[]) {
  return setAdminSetting("blocked-users", userIds);
}

export async function getPlanConfigs() {
  const stored = await getAdminSetting<Partial<PlanConfigs>>("plan-configs", {});
  return {
    starter: { ...DEFAULT_PLAN_CONFIGS.starter, ...(stored?.starter ?? {}) },
    pro: { ...DEFAULT_PLAN_CONFIGS.pro, ...(stored?.pro ?? {}) },
    agency: { ...DEFAULT_PLAN_CONFIGS.agency, ...(stored?.agency ?? {}) },
  } satisfies PlanConfigs;
}
