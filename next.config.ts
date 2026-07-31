import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Portadas de viaje y avatares (bucket publico de Supabase Storage)
      {
        protocol: "https",
        hostname: "hwayqsgwoaznfqofsyly.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
