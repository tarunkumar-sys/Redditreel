import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Image optimization
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.redd.it" },
      { protocol: "https", hostname: "**.reddit.com" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "**.imgur.com" },
      { protocol: "https", hostname: "thumbs.gfycat.com" },
      { protocol: "https", hostname: "preview.redd.it" },
      { protocol: "https", hostname: "external-preview.redd.it" },
      { protocol: "https", hostname: "v.redd.it" },
    ],
    unoptimized: false,
  },
  // Security & API headers
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
      // Security headers for all pages
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      // Proper MIME type for SVG icons
      {
        source: "/app-icon.svg",
        headers: [
          { key: "Content-Type", value: "image/svg+xml" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Proper MIME type for manifest
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
