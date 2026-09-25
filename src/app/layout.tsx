import "./globals.css";
import { Suspense, type ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import MetaPixel from "@/components/analytics/MetaPixel";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import AnalyticsRuntime from "@/components/analytics/AnalyticsRuntime";
import { absoluteImageUrl, buildSeoMetadata, jsonLdScript, SITE_NAME, SITE_URL } from "@/lib/seo";

const titleFont = localFont({
  src: [
    { path: "./fonts/BodoniMT-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/BodoniMT-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-title",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...buildSeoMetadata({
    title: "Gene Travel Smarter",
    description: "Explore cinematic ready plans, destination ideas, travel offers, and AI-assisted trip planning with Gene.",
    path: "/",
    image: "/bg/home-hero-bottom-optimized.jpg",
  }),
  applicationName: SITE_NAME,
  category: "travel",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({children}:{children:ReactNode}){
  const travelpayoutsTrsId = process.env.TRAVELPAYOUTS_TRS_ID || "142507";
  return(
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="travelpayouts-bootstrap"
          strategy="afterInteractive"
          data-noptimize="1"
          data-cfasync="false"
          data-wpfc-render="false"
          seraph-accel-crit="1"
          data-no-defer="1"
          dangerouslySetInnerHTML={{
            __html: `(function () {
  if (window.__geneTravelpayoutsLoaded) return;
  window.__geneTravelpayoutsLoaded = true;
  var script = document.createElement("script");
  script.async = 1;
  script.src = 'https://emrld.ltd/MTQyNTA3.js?t=${travelpayoutsTrsId}';
  document.head.appendChild(script);
})();`,
          }}
        />
        <Script
          id="getyourguide-analytics"
          src="https://widget.getyourguide.com/dist/pa.umd.production.min.js"
          strategy="afterInteractive"
          data-gyg-partner-id="T1FCRGE"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
            logo: absoluteImageUrl("/images/logo.png"),
          })}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE_NAME,
            url: SITE_URL,
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE_URL}/ready-plans?search={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          })}
        />
      </head>
      <body className={titleFont.variable}>
        <LanguageProvider>
          <MetaPixel />
          <GoogleAnalytics />
          <Suspense fallback={null}>
            <AnalyticsRuntime />
          </Suspense>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
