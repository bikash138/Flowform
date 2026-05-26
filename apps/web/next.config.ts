import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.t3.tigrisfiles.io",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
