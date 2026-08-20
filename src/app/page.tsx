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
import { HOME_COPY, IMAGES } from "@/lib/constants";

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
 */
export default function Home() {
  return (
    <>
      <Header />
      <main>
        {/* Sin `pt-16`: el hero va debajo del navbar a propósito, que es
            translúcido y se apoya sobre la imagen, como en el mockup. */}
        <ImmersiveHero
          image={IMAGES.homeHero}
          imageAlt="Figura de partículas mirando hacia el cosmos"
          scrollHint="Descubrir"
          scrollTo="manifiesto"
        />

        <QuoteBand
          id="manifiesto"
          left={HOME_COPY.frase.left}
          right={HOME_COPY.frase.right}
          mask={IMAGES.homeFraseMask}
        />

        <HumanitySection id="humanidad" />

        <ImageStatements
          image={IMAGES.homePromesas}
          imageAlt="Figura en meditación con un núcleo de luz dorada"
          statements={HOME_COPY.promesas}
        />

        <TestimonialsSection id="voces" />

        <ClosingBanner image={IMAGES.homeCierre} />
        <GoldDivider />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
