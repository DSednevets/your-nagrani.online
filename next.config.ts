import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "your-nagrani.online"],
    },
  },
};

export default nextConfig;
