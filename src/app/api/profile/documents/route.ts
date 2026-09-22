import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { recordUserActivity } from "@/lib/customer-activity";
import { tableExists } from "@/lib/prisma-safe";
import { ensureUserProfile } from "@/lib/profile/ensureUserProfile";
import { createRouteClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const documentTypeSchema = z.enum([
  "passport",
  "visa",
  "insurance",
  "flight",
  "hotel",
  "trip",
  "other",
]);

const documentCreateSchema = z.object({
  type: documentTypeSchema,
  displayName: z.string().min(1).max(160),
  storageKey: z.string().min(3).max(600),
  mimeType: z
    .enum([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]),
  fileSize: z.number().int().min(1).max(10 * 1024 * 1024),
  expiryDate: z.string().datetime().optional().nullable(),
  tripId: z.string().min(1).max(120).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

const documentUpdateSchema = z.object({
  id: z.string().min(1),
  type: documentTypeSchema.optional(),
  displayName: z.string().min(1).max(160).optional(),
  expiryDate: z.string().datetime().optional().nullable(),
  tripId: z.string().min(1).max(120).optional().nullable(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

const documentDeleteSchema = z.object({
  id: z.string().min(1),
});

async function getUser() {
  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  await ensureUserProfile(data.user);
  return data.user;
}

function publicDocumentSelect() {
  return {
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
  } as const;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  if (!(await tableExists("travel_documents"))) {
    return NextResponse.json({ ok: true, documents: [] });
  }

  const documents = await prisma.travelDocument.findMany({
    where: { userId: user.id, status: { not: "DELETED" } },
    orderBy: { createdAt: "desc" },
    select: publicDocumentSelect(),
  });

  return NextResponse.json({ ok: true, documents });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  if (!(await tableExists("travel_documents"))) {
    return NextResponse.json({ ok: false, code: "DOCUMENTS_NOT_READY" }, { status: 503 });
  }

  const parsed = documentCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });

  if (!parsed.data.storageKey.startsWith(`${user.id}/`)) {
    return NextResponse.json({ ok: false, code: "INVALID_STORAGE_KEY" }, { status: 400 });
  }

  const document = await prisma.travelDocument.create({
    data: {
      userId: user.id,
      type: parsed.data.type,
      displayName: parsed.data.displayName,
      storageKey: parsed.data.storageKey,
      mimeType: parsed.data.mimeType,
      fileSize: parsed.data.fileSize,
      expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null,
      tripId: parsed.data.tripId ?? null,
      metadata: parsed.data.metadata ? (parsed.data.metadata as Prisma.InputJsonValue) : undefined,
    },
    select: publicDocumentSelect(),
  });

  await recordUserActivity({
    userId: user.id,
    event: "TRAVEL_DOCUMENT_ADDED",
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

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  if (!(await tableExists("travel_documents"))) {
    return NextResponse.json({ ok: false, code: "DOCUMENT_NOT_FOUND" }, { status: 404 });
  }

  const parsed = documentUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });

  const { id, expiryDate, metadata, ...updates } = parsed.data;
  const result = await prisma.travelDocument.updateMany({
    where: { id, userId: user.id, status: { not: "DELETED" } },
    data: {
      ...updates,
      expiryDate: expiryDate === undefined ? undefined : expiryDate ? new Date(expiryDate) : null,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });

  if (!result.count) return NextResponse.json({ ok: false, code: "DOCUMENT_NOT_FOUND" }, { status: 404 });

  await recordUserActivity({
    userId: user.id,
    event: "TRAVEL_DOCUMENT_UPDATED",
    entityType: "TRAVEL_DOCUMENT",
    entityId: id,
  });

  const document = await prisma.travelDocument.findFirst({
    where: { id, userId: user.id },
    select: publicDocumentSelect(),
  });

  return NextResponse.json({ ok: true, document });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  if (!(await tableExists("travel_documents"))) return NextResponse.json({ ok: true });

  const parsed = documentDeleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });

  await prisma.travelDocument.updateMany({
    where: { id: parsed.data.id, userId: user.id },
    data: { status: "DELETED" },
  });

  await recordUserActivity({
    userId: user.id,
    event: "TRAVEL_DOCUMENT_DELETED",
    entityType: "TRAVEL_DOCUMENT",
    entityId: parsed.data.id,
  });

  return NextResponse.json({ ok: true });
}
