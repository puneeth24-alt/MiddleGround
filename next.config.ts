import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  },
  webpack: (config, { isServer }) => {
    // maplibre-gl uses browser APIs — exclude it from server bundle
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "maplibre-gl"
      ];
    }
    return config;
  }
};

export default nextConfig;
