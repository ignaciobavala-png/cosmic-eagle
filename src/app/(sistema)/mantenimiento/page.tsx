import type { Metadata } from "next";

/**
 * La pantalla de "en construcción" del dominio propio (30/09/2026).
 *
 * El sitio ya responde en cosmiceaglejourney.com pero todavía no pasó las
 * pruebas, así que mientras `MAINTENANCE_MODE=on` el proxy reescribe todo lo
 * público de ese dominio a esta página (ver `src/lib/maintenance.ts`). En
 * `cosmic-eagle.vercel.app` el sitio sigue entero, para probar.
 *
 * Vive en `(sistema)` y no en `[locale]`: es una sola pantalla, sin navbar ni
 * idioma, y no tiene que depender de nada que se esté probando.
 *
 * El logo es un WebP animado con canal alfa, recortado del `LOGO ANIMADO.mov`
 * que mandaron (QuickTime Animation, ARGB): el negro que se ve al abrir el
 * .mov es el reproductor, no el archivo. Un `<img>` y no un `<video>` porque el
 * WebP animado con transparencia anda en todos los browsers, Safari incluido,
 * y arranca solo sin políticas de autoplay.
 */
export const metadata: Metadata = {
  title: "Cosmic Eagle Journey",
  robots: { index: false, follow: false },
};

export default function MantenimientoPage() {
  return (
    // El degradé azul recto del navbar y el footer (#05125A → #0079B3), no el
    // fondo oscuro del `body`: es la pantalla entera y tiene que leerse azul.
    <main className="relative z-10 flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-[#05125A] to-[#0079B3] px-gutter text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- next/image no anima un WebP animado */}
      <img
        src="/img/logo-animado.webp"
        alt="Cosmic Eagle"
        width={496}
        height={400}
        className="w-64 max-w-[70vw] sm:w-80"
      />
      {/* Oro sobre azul: `primary-container`, regla del 28/08. */}
      <h1 className="mt-6 max-w-xl font-display text-headline-lg text-balance text-primary-container md:text-display-lg">
        Evolucionando hacia nuestra mejor versión
      </h1>
    </main>
  );
}
