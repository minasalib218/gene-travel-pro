const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "rvgcasonehvlvukigwsp.supabase.co",
      },
      {
        protocol: "https",
        hostname: "igqsznadqigliqpxjtez.supabase.co",
      },
    ],
  },
};

module.exports = withBundleAnalyzer(nextConfig);
