import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseOfferLiveRecord } from "@/lib/content/offers-live";
import OfferEditorForm from "@/components/admin/OfferEditorForm";

export const dynamic = "force-dynamic";

export default async function EditOfferPage({ params }: { params: { id: string } }) {
  const row = await prisma.offer.findUnique({ where: { id: params.id } });
  if (!row) return notFound();
  return <OfferEditorForm mode="edit" initial={parseOfferLiveRecord(row as any)} />;
}
