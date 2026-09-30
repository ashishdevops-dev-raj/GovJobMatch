import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
};

export default nextConfig;

void import("@opennextjs/cloudflare")
  .then((mod) => mod.initOpenNextCloudflareForDev())
  .catch(() => {
    // Package is optional until `npm install` finishes; local `next dev` must still start.
  });
