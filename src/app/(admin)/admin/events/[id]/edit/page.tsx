import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseEventLiveRecord } from "@/lib/content/events-live";
import EventEditorForm from "@/components/admin/EventEditorForm";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const row = await prisma.event.findUnique({ where: { id: params.id } });
  if (!row) return notFound();
  return <EventEditorForm mode="edit" initial={parseEventLiveRecord(row as any)} />;
}
