import ProtectedAI from "@/components/ProtectedAI";
import AiPlannerClient from "./AiPlannerClient";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: "AI Travel Planner",
  description: "Build and customize your trip with Gene's AI travel planner after choosing your access package.",
  path: "/ai-planner",
  image: "/bg/home-hero-bottom-optimized.jpg",
  noIndex: true,
});

export default function AiPlannerPage() {
  return (
    <ProtectedAI requiredFeature="AI Trip Personality Engine">
      <AiPlannerClient />
    </ProtectedAI>
  );
}
