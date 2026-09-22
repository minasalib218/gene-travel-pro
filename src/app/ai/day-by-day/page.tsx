import ProtectedAI from "@/components/ProtectedAI";
import DayByDayWorkspace from "@/app/ai/day-by-day/ui";

export default function DayByDayPage() {
  return (
    <ProtectedAI requiredFeature="Dynamic itinerary editing">
      <DayByDayWorkspace />
    </ProtectedAI>
  );
}
