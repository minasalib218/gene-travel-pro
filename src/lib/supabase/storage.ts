import { randomUUID } from "crypto";
import { supabaseAdmin } from "./admin";
import { adminImageBucketSchema, imageUploadConstraints } from "@/lib/content/shared";

const PUBLIC_CACHE = "3600";

export async function ensureBucket(bucket: string) {
  const parsed = adminImageBucketSchema.parse(bucket);
  const { data: existing } = await supabaseAdmin.storage.getBucket(parsed).catch(() => ({ data: null }));
  if (existing) return parsed;

  const { error } = await supabaseAdmin.storage.createBucket(parsed, {
    public: true,
    fileSizeLimit: `${imageUploadConstraints.maxBytes}`,
    allowedMimeTypes: [...imageUploadConstraints.allowedTypes],
  });
  if (error && !/already exists/i.test(error.message)) {
    throw error;
  }
  return parsed;
}

export async function uploadAdminImage(bucket: string, file: File) {
  const safeBucket = await ensureBucket(bucket);

  if (!imageUploadConstraints.allowedTypes.includes(file.type as any)) {
    throw new Error("INVALID_IMAGE_TYPE");
  }
  if (file.size > imageUploadConstraints.maxBytes) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${new Date().getUTCFullYear()}/${new Date().getUTCMonth() + 1}/${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from(safeBucket)
    .upload(path, buffer, { contentType: file.type, cacheControl: PUBLIC_CACHE, upsert: true });

  if (error) throw error;

  const { data } = supabaseAdmin.storage.from(safeBucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl, bucket: safeBucket };
}
