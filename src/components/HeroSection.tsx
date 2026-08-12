import { PageHero } from "@/components/ui/PageHero";
import { getSiteContent } from "@/lib/site-content";

/**
 * Hero de la home sobre la primitiva P1. El titulo, la bajada y la imagen se
 * editan desde /admin/multimedia; los CTAs siguen en codigo porque son rutas,
 * no copy.
 *
 * "Acceso comunidad" es la etiqueta del mockup pero apunta a /cuenta: la
 * comunidad esta fuera de alcance en esta fase (docs/CONTEXT.md §6).
 */
export async function HeroSection() {
  const content = await getSiteContent();

  return (
    <PageHero
      image={content("home.hero.image")}
      title={renderTitle(content("home.hero.title"))}
      subtitle={content("home.hero.subtitle")}
      actions={[
        { label: "Explorar experiencias", href: "/viajes", variant: "solid" },
        { label: "Acceso comunidad", href: "/cuenta", variant: "ghost" },
      ]}
      scrollHint="Descubrir"
      scrollTo="portales"
    />
  );
}

/**
 * Cada salto de linea del texto cargado es un quiebre de titulo en desktop. En
 * mobile se ignora y deja que el titulo fluya, que es como venia antes de que
 * el copy fuera editable.
 */
export function renderTitle(title: string) {
  const lines = title.split("\n");

  return lines.map((line, i) => (
    <span key={i}>
      {i > 0 && <br className="hidden md:block" />}
      {i > 0 ? ` ${line}` : line}
    </span>
  ));
}
