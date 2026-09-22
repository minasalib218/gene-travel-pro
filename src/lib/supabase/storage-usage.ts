import { adminImageBucketSchema } from "@/lib/content/shared";
import { supabaseAdmin } from "@/lib/supabase/admin";

const DEFAULT_STORAGE_LIMIT_MB = 1024;
const PAGE_SIZE = 1000;

type StorageObjectRow = {
  bucket_id: string | null;
  metadata: unknown;
};

function getMetadataSize(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return 0;
  const value = (metadata as { size?: unknown })?.size;
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }
  return 0;
}

function getStorageLimitBytes() {
  const configuredMb = Number(process.env.SUPABASE_STORAGE_LIMIT_MB);
  const limitMb = Number.isFinite(configuredMb) && configuredMb > 0 ? configuredMb : DEFAULT_STORAGE_LIMIT_MB;
  return {
    limitBytes: limitMb * 1024 * 1024,
    limitMb,
    source: Number.isFinite(configuredMb) && configuredMb > 0 ? "env" : "default",
  };
}

export async function getSupabaseStorageUsage() {
  const buckets = adminImageBucketSchema.options;
  const { limitBytes, limitMb, source } = getStorageLimitBytes();
  const byBucket = new Map<string, { objects: number; bytes: number }>();
  buckets.forEach((bucket) => byBucket.set(bucket, { objects: 0, bytes: 0 }));

  let from = 0;
  let keepGoing = true;

  while (keepGoing) {
    const { data, error } = await (supabaseAdmin as any)
      .schema("storage")
      .from("objects")
      .select("bucket_id, metadata")
      .in("bucket_id", buckets)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const rows = Array.isArray(data) ? (data as StorageObjectRow[]) : [];
    for (const row of rows) {
      if (!row.bucket_id || !byBucket.has(row.bucket_id)) continue;
      const bucket = byBucket.get(row.bucket_id)!;
      bucket.objects += 1;
      bucket.bytes += getMetadataSize(row.metadata);
    }

    keepGoing = rows.length === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  const usedBytes = Array.from(byBucket.values()).reduce((total, bucket) => total + bucket.bytes, 0);
  const percentUsed = limitBytes > 0 ? Math.min(100, (usedBytes / limitBytes) * 100) : 0;

  return {
    buckets: Array.from(byBucket.entries()).map(([bucket, value]) => ({
      bucket,
      objects: value.objects,
      bytes: value.bytes,
    })),
    usedBytes,
    limitBytes,
    limitMb,
    limitSource: source,
    percentUsed,
    canAddReadyPlans: percentUsed < 90,
  };
}
