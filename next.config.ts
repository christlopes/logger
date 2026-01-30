import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Set the workspace root to suppress lockfile warning
  outputFileTracingRoot: __dirname,
};

export default nextConfig;



