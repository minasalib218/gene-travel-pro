import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import MetaPixel from "@/components/analytics/MetaPixel";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import AnalyticsRuntime from "@/components/analytics/AnalyticsRuntime";

const titleFont = localFont({
  src: [
    { path: "./fonts/BodoniMT-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/BodoniMT-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-title",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gene Travel",
  description: "Cinematic AI travel planner",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

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
      </head>
      <body className={titleFont.variable}>
        <LanguageProvider>
          <MetaPixel />
          <GoogleAnalytics />
          <AnalyticsRuntime />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
