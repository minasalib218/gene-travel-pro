import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { recordUserActivity } from "@/lib/customer-activity";
import { tableExists } from "@/lib/prisma-safe";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";
import { createRouteClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PRIVATE_DOCUMENT_BUCKET = process.env.SUPABASE_TRAVEL_DOCUMENTS_BUCKET || "gene-travel-documents";
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_TYPES = new Set(["passport", "visa", "insurance", "flight", "hotel", "trip", "other"]);

async function ensurePrivateDocumentBucket() {
  const { data: existing } = await supabaseAdmin.storage
    .getBucket(PRIVATE_DOCUMENT_BUCKET)
    .catch(() => ({ data: null }));

  if (existing) {
    await supabaseAdmin.storage.updateBucket(PRIVATE_DOCUMENT_BUCKET, {
      public: false,
      fileSizeLimit: `${MAX_DOCUMENT_BYTES}`,
      allowedMimeTypes: [...ALLOWED_MIME_TYPES],
    });
    return;
  }

  const { error } = await supabaseAdmin.storage.createBucket(PRIVATE_DOCUMENT_BUCKET, {
    public: false,
    fileSizeLimit: `${MAX_DOCUMENT_BYTES}`,
    allowedMimeTypes: [...ALLOWED_MIME_TYPES],
  });

  if (error && !/already exists/i.test(error.message)) throw error;
}

function cleanFileName(name: string) {
  return name.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "document";
}

export async function POST(req: NextRequest) {
  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });

  const user = data.user;
  await ensureUserProfile(user);

  if (!(await tableExists("travel_documents"))) {
    return NextResponse.json({ ok: false, code: "DOCUMENTS_NOT_READY" }, { status: 503 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  const displayName = String(formData?.get("displayName") || "").trim();
  const type = String(formData?.get("type") || "other").trim();
  const expiryDate = String(formData?.get("expiryDate") || "").trim();
  const tripId = String(formData?.get("tripId") || "").trim();

  if (!(file instanceof File) || !displayName || !ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ ok: false, code: "INVALID_DOCUMENT_TYPE" }, { status: 400 });
  }

  if (file.size > MAX_DOCUMENT_BYTES) {
    return NextResponse.json({ ok: false, code: "DOCUMENT_TOO_LARGE" }, { status: 400 });
  }

  try {
    await ensurePrivateDocumentBucket();
  } catch (bucketError) {
    const message = bucketError instanceof Error ? bucketError.message : "Document storage is not configured.";
    return NextResponse.json(
      { ok: false, code: "DOCUMENT_STORAGE_UNAVAILABLE", message },
      { status: 503 },
    );
  }

  const storageKey = `${user.id}/${new Date().getUTCFullYear()}/${randomUUID()}-${cleanFileName(file.name)}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(PRIVATE_DOCUMENT_BUCKET)
    .upload(storageKey, file, {
      cacheControl: "private, max-age=0",
      contentType: file.type,
      upsert: false,
    })
    .catch((uploadError) => ({ error: uploadError }));

  if (uploadError) {
    return NextResponse.json(
      { ok: false, code: "DOCUMENT_UPLOAD_FAILED", message: uploadError.message },
      { status: 500 },
    );
  }

  const document = await prisma.travelDocument.create({
    data: {
      userId: user.id,
      type,
      displayName,
      storageKey,
      mimeType: file.type,
      fileSize: file.size,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      tripId: tripId || null,
      metadata: {
        bucket: PRIVATE_DOCUMENT_BUCKET,
        originalName: file.name,
      } as Prisma.InputJsonValue,
    },
    select: {
      id: true,
      type: true,
      displayName: true,
      mimeType: true,
      fileSize: true,
      expiryDate: true,
      tripId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await recordUserActivity({
    userId: user.id,
    event: "TRAVEL_DOCUMENT_UPLOADED",
    entityType: "TRAVEL_DOCUMENT",
    entityId: document.id,
    metadata: {
      type: document.type,
      fileSize: document.fileSize,
      hasExpiryDate: Boolean(document.expiryDate),
    },
  });

  return NextResponse.json({ ok: true, document });
}
