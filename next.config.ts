import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium', 'pdf-lib', 'nodemailer'],
  // Webpack externals for Puppeteer/Chromium (used with next build --webpack)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'puppeteer-core': 'commonjs puppeteer-core',
        '@sparticuz/chromium': 'commonjs @sparticuz/chromium',
        'nodemailer': 'commonjs nodemailer',
      });
    }
    return config;
  },
};

export default nextConfig;
