import type { Metadata } from "next";

export const SITE_URL = "https://www.genefortravelers.com";
export const SITE_NAME = "Gene";
export const DEFAULT_OG_IMAGE = "/bg/home-hero-bottom-optimized.jpg";

type SeoInput = {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  type?: "website" | "article";
  noIndex?: boolean;
};

function trimText(value: string, maxLength: number) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).replace(/\s+\S*$/, "")}...`;
}

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path.startsWith("/") ? path : `/${path}`, SITE_URL).toString();
}

export function absoluteImageUrl(image?: string | null) {
  return absoluteUrl(image?.trim() || DEFAULT_OG_IMAGE);
}

export function buildSeoMetadata({
  title,
  description,
  path = "/",
  image,
  type = "website",
  noIndex = false,
}: SeoInput): Metadata {
  const cleanTitle = title.includes("| Gene") ? trimText(title, 62) : trimText(`${title} | Gene`, 62);
  const cleanDescription = trimText(description, 158);
  const canonical = absoluteUrl(path);
  const ogImage = absoluteImageUrl(image);

  return {
    title: cleanTitle,
    description: cleanDescription,
    alternates: {
      canonical,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title: cleanTitle,
      description: cleanDescription,
      url: canonical,
      siteName: SITE_NAME,
      type,
      images: [
        {
          url: ogImage,
          alt: cleanTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: cleanTitle,
      description: cleanDescription,
      images: [ogImage],
    },
  };
}

export function readyPlanDescription(input: {
  title: string;
  destination?: string | null;
  daysCount?: number | null;
  style?: string | null;
  subtitle?: string | null;
  summary?: string | null;
}) {
  if (input.summary?.trim()) return input.summary;
  if (input.subtitle?.trim()) return input.subtitle;
  const parts = [
    input.daysCount ? `${input.daysCount}-day` : "Cinematic",
    input.destination || input.title,
    input.style ? `${input.style} itinerary` : "ready plan",
  ];
  return `${parts.filter(Boolean).join(" ")} by Gene, built for travelers who want a polished trip structure before customizing.`;
}

export function jsonLdScript(data: Record<string, unknown>) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}
