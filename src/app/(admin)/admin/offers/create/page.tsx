import OfferEditorForm from "@/components/admin/OfferEditorForm";

export default function CreateOfferPage() {
  return (
    <OfferEditorForm
      mode="create"
      initial={{
        id: "",
        title: "",
        slug: "",
        imageUrl: "",
        iconUrl: "",
        affiliateLink: "",
        location: "",
        country: "",
        duration: "",
        startingPrice: "",
        description: "",
        discountBadge: "",
        expiresAt: "",
        featured: false,
        showOnHome: false,
        status: "draft",
      }}
    />
  );
}
