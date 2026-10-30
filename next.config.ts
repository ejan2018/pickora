import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    // Allow product images pasted from any https host (uploads are local).
    // On Vercel, images are automatically optimized at the edge.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    minimumCacheTTL: 3600,
  },
};

export default nextConfig;
