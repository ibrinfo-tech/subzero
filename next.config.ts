import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
  // Enable strict mode for better development experience
  reactStrictMode: true,
  // TypeScript errors should fail the build in production
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
