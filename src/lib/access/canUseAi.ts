import { prisma } from "@/lib/db/client";
import { UserRole } from "@prisma/client";

export async function isAdmin(userId: string) {
  const p = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return p?.role === UserRole.ADMIN;
}