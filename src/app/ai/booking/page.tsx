import ProtectedAI from "@/components/ProtectedAI";
import BookingClient from "@/app/ai/booking/ui";

export default async function BookingPage() {
  return (
    <ProtectedAI requiredFeature="Live prices and booking integration">
      <BookingClient />
    </ProtectedAI>
  );
}
