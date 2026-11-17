import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // La guia del asistente de IA se lee del disco (src/lib/ia/guide-tools.ts):
  // sin esto el archivo no viaja en el bundle de Vercel.
  outputFileTracingIncludes: {
    "/api/ia/chat": ["./docs/GUIA_ORG.md"],
  },
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
      // 7.2 (17/11): las URLs en ingles pasan a palabras en ingles. Las viejas
      // ya circulaban: 301 a la nueva, conservando lo que sigue en el path.
      // Los sub-paths que tambien cambian de nombre van ANTES del generico.
      ...[
        ["viajes/:id/solicitar", "experiences/:id/apply"],
        ["viajes/:id/salud", "experiences/:id/health"],
        ["viajes/:id/consentimiento", "experiences/:id/consent"],
        ["cuenta/recuperar", "account/recover"],
        ["cuenta/nueva-clave", "account/new-password"],
      ].map(([viejo, nuevo]) => ({
        source: `/en/${viejo}`,
        destination: `/en/${nuevo}`,
        permanent: true,
      })),
      ...[
        ["nosotros", "about-us"],
        ["viajes", "experiences"],
        ["contenidos", "content"],
        ["privacidad", "privacy"],
        ["terminos", "terms"],
        ["cuenta", "account"],
        ["compartido", "shared"],
      ].flatMap(([viejo, nuevo]) => [
        {
          source: `/en/${viejo}`,
          destination: `/en/${nuevo}`,
          permanent: true,
        },
        {
          source: `/en/${viejo}/:path*`,
          destination: `/en/${nuevo}/:path*`,
          permanent: true,
        },
      ]),
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
