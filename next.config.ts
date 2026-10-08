import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // /calendario se saco a pedido de la organizacion (08/10). Estuvo publica
  // desde el 17/09 y alguien puede tenerla guardada: va a /viajes, que tiene
  // las mismas carteleras.
  async redirects() {
    return [
      { source: "/calendario", destination: "/viajes", permanent: true },
      {
        source: "/:locale(es|en)/calendario",
        destination: "/:locale/viajes",
        permanent: true,
      },
    ];
  },
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

export default withNextIntl(nextConfig);
