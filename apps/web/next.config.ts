import type { NextConfig } from "next";

const API_TARGET = process.env.API_TARGET ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Proxy /api and /socket.io to the Ace API server
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_TARGET}/api/:path*`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${API_TARGET}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
