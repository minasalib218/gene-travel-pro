import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function requireAdminUser(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!profile || profile.role !== UserRole.ADMIN) {
    return { ok: false as const, code: "NOT_ADMIN" as const };
  }

  return { ok: true as const };
}