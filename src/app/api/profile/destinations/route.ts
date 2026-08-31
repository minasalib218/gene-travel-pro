import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { tableExists } from "@/lib/prisma-safe";
import { createRouteClient } from "@/lib/supabase/server";
import { recordUserActivity } from "@/lib/customer-activity";

export const dynamic = "force-dynamic";

const destinationSchema = z.object({
  destinationId: z.string().min(1),
});

async function getUserId() {
  const supabase = createRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user.id;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  if (!(await tableExists("favorite_destinations"))) {
    return NextResponse.json({ ok: true, destinations: [] });
  }

  const rows = await prisma.favoriteDestination.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const destinationIds = rows.map((row) => row.destinationId);
  const destinations = destinationIds.length
    ? await prisma.destination.findMany({
        where: { id: { in: destinationIds }, status: "published" },
        select: {
          id: true,
          title: true,
          slug: true,
          imageUrl: true,
          iconUrl: true,
          section: true,
          tripStyles: true,
          description: true,
        },
      })
    : [];
  const destinationById = new Map(destinations.map((destination) => [destination.id, destination]));

  return NextResponse.json({
    ok: true,
    destinations: rows
      .map((row) => {
        const destination = destinationById.get(row.destinationId);
        return destination ? { ...destination, savedAt: row.createdAt } : null;
      })
      .filter(Boolean),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });
  if (!(await tableExists("favorite_destinations"))) {
    return NextResponse.json({ ok: false, code: "DESTINATION_FAVORITES_NOT_READY" }, { status: 503 });
  }

  const parsed = destinationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });

  const destination = await prisma.destination.findFirst({
    where: { id: parsed.data.destinationId, status: "published" },
    select: { id: true, slug: true, title: true, section: true, tripStyles: true },
  });
  if (!destination) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });

  const favorite = await prisma.favoriteDestination.upsert({
    where: { userId_destinationId: { userId, destinationId: destination.id } },
    update: {},
    create: {
      userId,
      destinationId: destination.id,
      metadata: { title: destination.title, slug: destination.slug, section: destination.section } as Prisma.InputJsonValue,
    },
  });

  await recordUserActivity({
    userId,
    event: "DESTINATION_SAVED",
    entityType: "DESTINATION",
    entityId: destination.id,
    metadata: { slug: destination.slug, title: destination.title },
  });

  return NextResponse.json({ ok: true, favorite });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false, code: "NOT_AUTHED" }, { status: 401 });

  const parsed = destinationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  if (!(await tableExists("favorite_destinations"))) return NextResponse.json({ ok: true });

  await prisma.favoriteDestination.deleteMany({
    where: { userId, destinationId: parsed.data.destinationId },
  });

  await recordUserActivity({
    userId,
    event: "DESTINATION_REMOVED",
    entityType: "DESTINATION",
    entityId: parsed.data.destinationId,
  });

  return NextResponse.json({ ok: true });
}
