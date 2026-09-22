import { randomUUID } from "crypto";
import { supabaseAdmin } from "./admin";
import {
  adminImageBucketSchema,
  imageUploadConstraints,
  imageUploadConstraintsLabel,
} from "@/lib/content/shared";

const PUBLIC_CACHE = "3600";
const bucketEnsureCache = new Map<string, Promise<string>>();

export async function ensureBucket(bucket: string) {
  const parsed = adminImageBucketSchema.parse(bucket);

  let existingPromise = bucketEnsureCache.get(parsed);
  if (!existingPromise) {
    existingPromise = (async () => {
      const { data: existing } = await supabaseAdmin.storage
        .getBucket(parsed)
        .catch(() => ({ data: null }));
      if (existing) {
        await supabaseAdmin.storage.updateBucket(parsed, {
          public: true,
          fileSizeLimit: `${imageUploadConstraints.maxBytes}`,
          allowedMimeTypes: [...imageUploadConstraints.allowedTypes],
        });
        return parsed;
      }

      const { error } = await supabaseAdmin.storage.createBucket(parsed, {
        public: true,
        fileSizeLimit: `${imageUploadConstraints.maxBytes}`,
        allowedMimeTypes: [...imageUploadConstraints.allowedTypes],
      });

      if (error && !/already exists/i.test(error.message)) {
        throw error;
      }

      return parsed;
    })().catch((error) => {
      bucketEnsureCache.delete(parsed);
      throw error;
    });

    bucketEnsureCache.set(parsed, existingPromise);
  }

  return existingPromise;
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

  const { error } = await supabaseAdmin.storage
    .from(safeBucket)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: PUBLIC_CACHE,
      upsert: false,
    });

  if (error) {
    const normalizedMessage = error.message?.toLowerCase?.() ?? "";
    if (normalizedMessage.includes("mime") || normalizedMessage.includes("content type")) {
      throw new Error("INVALID_IMAGE_TYPE");
    }
    if (normalizedMessage.includes("size") || normalizedMessage.includes("too large")) {
      throw new Error("IMAGE_TOO_LARGE");
    }
    throw new Error(
      error.message || `Upload failed. Please use ${imageUploadConstraintsLabel.allowedTypesText} under ${imageUploadConstraintsLabel.maxSizeText}.`,
    );
  }

  const { data } = supabaseAdmin.storage.from(safeBucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl, bucket: safeBucket };
}
