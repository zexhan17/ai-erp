import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling the Neon serverless driver so it uses
  // the native Node.js fetch (unpatched) which handles IPv4/IPv6 correctly.
  serverExternalPackages: ["@neondatabase/serverless", "@prisma/adapter-neon"],
};

export default nextConfig;
