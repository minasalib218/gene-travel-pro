import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/ready-plans", "/ready-plans/", "/destinations", "/destinations/", "/offers", "/offers/", "/events", "/events/", "/pricing"],
        disallow: [
          "/admin",
          "/admin/",
          "/api",
          "/api/",
          "/ai-planner",
          "/profile",
          "/signin",
          "/signup",
          "/activate",
          "/payment",
          "/payment/",
          "/planner",
          "/planner/",
          "/plan-summary",
          "/plan-summary/",
          "/summary",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
