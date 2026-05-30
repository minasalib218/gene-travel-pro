import "./globals.css";
import type { ReactNode } from "react";
import localFont from "next/font/local";
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

export const metadata={title:"Gene Travel",description:"Cinematic AI travel planner"};
export default function RootLayout({children}:{children:ReactNode}){
  return(
    <html lang="en" suppressHydrationWarning>
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
