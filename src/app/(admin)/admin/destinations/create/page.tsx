import DestinationEditorForm from "@/components/admin/DestinationEditorForm";

export default function CreateDestinationPage() {
  return (
    <DestinationEditorForm
      mode="create"
      initial={{
        id: "",
        title: "",
        slug: "",
        imageUrl: "",
        iconUrl: "",
        affiliateLink: "",
        description: "",
        status: "draft",
      }}
    />
  );
}
