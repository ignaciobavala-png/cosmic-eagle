import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { ClosingBanner } from "@/components/ClosingBanner";
import { HumanitySection } from "@/components/HumanitySection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { ImageStatements } from "@/components/ui/ImageStatements";
import { ImmersiveHero } from "@/components/ui/ImmersiveHero";
import { QuoteBand } from "@/components/ui/QuoteBand";
import { IMAGES } from "@/lib/constants";
import { getSiteContent } from "@/lib/site-content";

/**
 * La máscara de la frase NO es un slot editable: no es una foto sino una capa de
 * atmósfera con transparencia, calzada al degradé del fondo. Cambiarla por una
 * imagen cualquiera desde el panel rompería el efecto en vez de personalizarlo.
 */
const FRASE_MASK = IMAGES.homeFraseMask;

/**
 * Home rediseñada (docs/HOME_REDISENO.md).
 *
 * Es puramente narrativa: ya no consulta `trips`. Los viajes viven en /viajes,
 * cada uno en su tipo (decision del 20/08, §4 del doc). El efecto lateral es que
 * la página vuelve a ser prerender estático — antes era dinámica (`ƒ`) por esa
 * consulta — así que se sirve entera desde el CDN y no gasta egress de Supabase.
 *
 * El único camino al embudo de inscripción pasa a ser el navbar, por eso
 * "Experiencias" tiene que quedar visible ahí.
 *
 * Las imágenes y los textos sueltos salen de `site-content`, así que la clienta
 * los cambia desde /admin/multimedia. Eso NO la vuelve dinámica: `getSiteContent`
 * lee con `unstable_cache` y un cliente sin cookies, y la página sigue siendo `○`
 * en el build (lo mismo que ya hacía /nosotros).
 *
 * El copy de "La humanidad" y los testimonios siguen en `constants.ts`: son
 * bloques largos, y hacerlos editables pide una pantalla distinta a la de un
 * campo por texto. Anotado en docs/HOME_REDISENO.md.
 */
export default async function Home() {
  const content = await getSiteContent();

  return (
    <>
      <Header />
      <main>
        {/* Sin `pt-16`: el hero va debajo del navbar a propósito, que es
            translúcido y se apoya sobre la imagen, como en el mockup. */}
        <ImmersiveHero
          image={content("home.hero.image")}
          imageAlt="Figura de partículas mirando hacia el cosmos"
          scrollHint="Descubrir"
          scrollTo="manifiesto"
        />

        <QuoteBand
          id="manifiesto"
          left={content("home.frase.left")}
          right={content("home.frase.right")}
          mask={FRASE_MASK}
        />

        <HumanitySection id="humanidad" />

        <ImageStatements
          image={content("home.promesas.image")}
          imageAlt="Figura en meditación con un núcleo de luz dorada"
          statements={[
            content("home.promesas.1"),
            content("home.promesas.2"),
            content("home.promesas.3"),
            content("home.promesas.4"),
          ]}
        />

        <TestimonialsSection id="voces" />

        <ClosingBanner image={content("home.cierre.image")} />
        <GoldDivider />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
