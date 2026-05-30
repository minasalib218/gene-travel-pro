import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const tableExistsCache = new Map<string, boolean>();

export function isMissingTableError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (((error as { code?: string }).code === "P2021") ||
      ((error as { code?: string }).code === "P2022"))
  );
}

export function isDatabaseUnavailableError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;

  const code = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const message = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";

  return (
    code === "P1001" ||
    code === "P1002" ||
    code === "P1017" ||
    message.includes("Can't reach database server") ||
    message.includes("Server has closed the connection") ||
    message.includes("Connection terminated unexpectedly") ||
    message.includes("Timed out fetching a new connection") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND")
  );
}

export async function tableExists(tableName: string) {
  if (tableExistsCache.has(tableName)) {
    return tableExistsCache.get(tableName) ?? false;
  }

  try {
    const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>(
      Prisma.sql`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = ${tableName}
        ) AS exists
      `,
    );
    const exists = Boolean(rows?.[0]?.exists);
    tableExistsCache.set(tableName, exists);
    return exists;
  } catch (error) {
    if (isMissingTableError(error) || isDatabaseUnavailableError(error)) {
      tableExistsCache.set(tableName, false);
      return false;
    }
    throw error;
  }
}

export async function withExistingTable<T>(
  tableName: string,
  query: () => Promise<T>,
  fallback: T,
) {
  if (!(await tableExists(tableName))) {
    return fallback;
  }

  try {
    return await query();
  } catch (error) {
    if (isMissingTableError(error) || isDatabaseUnavailableError(error)) {
      tableExistsCache.set(tableName, false);
      return fallback;
    }
    throw error;
  }
}

export async function withDatabaseFallback<T>(
  query: () => Promise<T>,
  fallback: T,
) {
  try {
    return await query();
  } catch (error) {
    if (isMissingTableError(error) || isDatabaseUnavailableError(error)) {
      return fallback;
    }
    throw error;
  }
}
