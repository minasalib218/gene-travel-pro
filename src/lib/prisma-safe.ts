import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const tableExistsCache = new Map<string, boolean>();
const tableColumnsCache = new Map<string, string[]>();

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
    code === "P1000" ||
    code === "P1001" ||
    code === "P1002" ||
    code === "P1017" ||
    message.includes("Authentication failed against database server") ||
    message.includes("the provided database credentials") ||
    message.includes("You must provide a nonempty URL") ||
    message.includes("resolved to an empty string") ||
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

export async function getTableColumns(tableName: string) {
  if (tableColumnsCache.has(tableName)) {
    return tableColumnsCache.get(tableName) ?? [];
  }

  try {
    const rows = await prisma.$queryRaw<Array<{ column_name: string }>>(
      Prisma.sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ${tableName}
        ORDER BY ordinal_position
      `,
    );
    const columns = rows.map((row) => String(row.column_name).trim());
    tableColumnsCache.set(tableName, columns);
    return columns;
  } catch (error) {
    if (isMissingTableError(error) || isDatabaseUnavailableError(error)) {
      tableColumnsCache.set(tableName, []);
      return [];
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
