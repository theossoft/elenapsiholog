import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/webp"],
  },
  serverExternalPackages: ["https"],
};

export default nextConfig;
