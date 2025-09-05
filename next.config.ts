import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,  // Ignores ESLint errors/warnings during builds
  },
  typescript: {
    ignoreBuildErrors: true,  // Ignores TypeScript compilation errors during builds
  },
};

export default nextConfig;
