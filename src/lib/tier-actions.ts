import { prisma } from "@/lib/prisma";

export async function consumeTierAction(opts: {
  userId: string;
  passId: string;
  actionType: "GENERATE_FULL_PLAN" | "RUN_ANALYSIS";
  idempotencyKey: string;
}) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.tierActionLog.findUnique({
      where: { idempotencyKey: opts.idempotencyKey },
    });
    if (existing) return { ok: true as const, alreadyProcessed: true, remaining: null as number | null };

    const pass = await tx.pass.findFirst({
      where: { id: opts.passId, userId: opts.userId },
    });
    if (!pass) return { ok: false as const, code: "PASS_NOT_FOUND" };

    const now = new Date();
    if (pass.status !== "ACTIVE") return { ok: false as const, code: "PASS_NOT_ACTIVE" };
    if (pass.expiresAt && pass.expiresAt <= now) return { ok: false as const, code: "PASS_EXPIRED" };

    const total = Number(pass.tierActionsTotal ?? 0);
    const used = Number(pass.tierActionsUsed ?? 0);
    const remaining = total - used;
    if (remaining < 1) return { ok: false as const, code: "NO_ACTIONS_LEFT", remaining };

    await tx.tierActionLog.create({
  data: {
    passId: pass.id,
    userId: opts.userId,
    idempotencyKey: opts.idempotencyKey,
    actionType: opts.actionType, // ✅ correct field
  },
});


    await tx.pass.update({
      where: { id: pass.id },
      data: { tierActionsUsed: { increment: 1 } },
    });

    return { ok: true as const, alreadyProcessed: false, remaining: remaining - 1 };
  });
}
