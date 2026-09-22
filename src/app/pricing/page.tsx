import { Suspense } from "react";
import PricingClient from "./PricingClient";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: "Pricing",
  description: "Choose a Gene travel-planning package and unlock AI-powered trip planning credits for your next journey.",
  path: "/pricing",
  image: "/bg/home-hero-bottom-optimized.jpg",
});

export default function PricingPage() {
  return (
    <Suspense fallback={null}>
      <PricingClient />
    </Suspense>
  );
}
