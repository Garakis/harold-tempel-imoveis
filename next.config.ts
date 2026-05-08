import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "cgimkxpskikdcuwvfrlv.supabase.co";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Legacy Kenlo images (transition period before full migration)
        protocol: "https",
        hostname: "img.kenlo.io",
      },
      {
        protocol: "https",
        hostname: "imgs.kenlo.io",
      },
      {
        // Mock data placeholders (dev only — remove before production)
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    qualities: [60, 75, 90],
  },
  experimental: {
    // Enables tree-shaking for these libraries
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
