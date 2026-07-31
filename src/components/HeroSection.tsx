import { PageHero } from "@/components/ui/PageHero";
import { IMAGES } from "@/lib/constants";

/**
 * Hero de la home sobre la primitiva P1. El titulo es el copy en español que ya
 * teniamos (el mockup lo trae en ingles, pendiente de confirmar con la clienta);
 * el subtitulo y los CTAs son los de Julia.
 *
 * "Acceso comunidad" es la etiqueta del mockup pero apunta a /cuenta: la
 * comunidad esta fuera de alcance en esta fase (docs/CONTEXT.md §6).
 */
export function HeroSection() {
  return (
    <PageHero
      image={IMAGES.heroHome}
      title={
        <>
          Sabiduría Cósmica para la{" "}
          <br className="hidden md:block" />
          Evolución Humana
        </>
      }
      subtitle="Experiencias privadas de transformación y retiros en entornos exclusivos."
      actions={[
        { label: "Explorar experiencias", href: "/viajes", variant: "solid" },
        { label: "Acceso comunidad", href: "/cuenta", variant: "ghost" },
      ]}
      scrollHint="Descubrir"
      scrollTo="portales"
    />
  );
}
