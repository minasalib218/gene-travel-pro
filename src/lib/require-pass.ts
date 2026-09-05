import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getActivePassOrNull(userId: string) {
  const now = new Date();
  const rows = await prisma.$queryRaw<Array<any>>(
    Prisma.sql`
      SELECT *
      FROM "passes"
      WHERE "userId" = ${userId}
        AND "status" = 'ACTIVE'
        AND ("expiresAt" IS NULL OR "expiresAt" > ${now})
      ORDER BY "expiresAt" DESC NULLS FIRST, "createdAt" DESC
      LIMIT 1
    `,
  );

  return rows[0] ?? null;
}

export async function requireActivePass(userId: string) {
  const pass = await getActivePassOrNull(userId);
  if (!pass) {
    return { ok: false as const, pass: null, code: "NO_ACTIVE_PASS" as const };
  }

  const total = Number(pass.mainCreditsTotal || pass.tierActionsTotal || 0);
  const used = Number(pass.mainCreditsUsed || pass.tierActionsUsed || 0);
  const remaining = total - used;
  if (remaining <= 0) {
    return { ok: false as const, pass, code: "PASS_EXHAUSTED" as const, remaining: 0 };
  }

  return { ok: true as const, pass, remaining };
}
