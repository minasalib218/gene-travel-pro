import EventEditorForm from "@/components/admin/EventEditorForm";

export default function CreateEventPage() {
  return (
    <EventEditorForm
      mode="create"
      initial={{
        id: "",
        title: "",
        slug: "",
        imageUrl: "",
        iconUrl: "",
        affiliateLink: "",
        category: "",
        location: "",
        country: "",
        dateRange: "",
        description: "",
        showOnHome: false,
        status: "draft",
      }}
    />
  );
}
