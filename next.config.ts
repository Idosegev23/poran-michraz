import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium', 'pdf-lib'],
  turbopack: {},
};

export default nextConfig;
