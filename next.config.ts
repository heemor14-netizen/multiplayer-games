import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/multiplayer-games",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
