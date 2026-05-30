import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseDestinationRecord } from "@/lib/content/destinations";
import DestinationEditorForm from "@/components/admin/DestinationEditorForm";

export const dynamic = "force-dynamic";

export default async function EditDestinationPage({ params }: { params: { id: string } }) {
  const row = await prisma.destination.findUnique({ where: { id: params.id } });
  if (!row) return notFound();
  return <DestinationEditorForm mode="edit" initial={parseDestinationRecord(row as any)} />;
}
