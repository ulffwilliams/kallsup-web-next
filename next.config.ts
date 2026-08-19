import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The social marks are first-party SVGs in /public. Next refuses to run
    // SVG through the optimizer without this, and the CSP keeps the escape
    // hatch narrow: no scripts, no external refs.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        // Shopify product photography served through next/image.
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
