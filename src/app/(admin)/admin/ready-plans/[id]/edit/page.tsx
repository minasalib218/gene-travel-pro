import ReadyPlanStudio from "@/components/admin/ReadyPlanStudio";

export default function EditReadyPlanPage({ params }: { params: { id: string } }) {
  return <ReadyPlanStudio mode="edit" planId={params.id} />;
}
