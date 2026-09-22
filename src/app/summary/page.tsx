import ProtectedAI from "@/components/ProtectedAI";
import SummaryClient from "./ui";

export default async function Page() {
  return (
    <ProtectedAI requiredFeature="AI Trip Personality Engine">
      <SummaryClient />
    </ProtectedAI>
  );
}
