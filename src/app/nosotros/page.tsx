import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { PageHero } from "@/components/ui/PageHero";
import { FeatureBlock } from "@/components/ui/FeatureBlock";
import { DocumentCard } from "@/components/ui/DocumentCard";
import { ClosingSection } from "@/components/ui/ClosingSection";
import { IMAGES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Nosotros | Cosmic Eagle",
  description:
    "Un espacio de luz y amor. Más de 10 años acompañando transformaciones a través de viajes cósmicos y ceremonias ancestrales.",
};

/**
 * Composicion del mockup NOSOTROS de Julia con las primitivas del sistema:
 * P1 hero -> P3+P2 proposito -> P3+P2 metodologia -> P5 cierre.
 * Los textos son los del mockup (contenido de la clienta), no se inventan.
 */
export default function NosotrosPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <PageHero
          image={IMAGES.heroNosotros}
          title="Un espacio de luz y amor."
          subtitle="+10 años acompañando transformaciones"
          scrollHint="Conocenos"
          scrollTo="proposito"
        />

        <FeatureBlock
          id="proposito"
          image={IMAGES.nosotrosProposito}
          imageAlt="Círculo de ceremonia iluminado"
          imageSide="left"
          shape="oval"
        >
          <DocumentCard title="Un camino de" titleAccent="Evolución Consciente">
            <p>
              Los viajes cósmicos son experiencias sagradas, que nos conectan
              con la sabiduría del dios que llevamos dentro. La sanación o
              liberación del sufrimiento es el punto de partida para activar el
              proceso de ascensión hacia una dimensión superior de la
              existencia.
            </p>
          </DocumentCard>
        </FeatureBlock>

        <FeatureBlock
          id="metodologia"
          image={IMAGES.nosotrosMetodologia}
          imageAlt="Hongo bioluminiscente en un entorno cósmico"
          imageSide="right"
        >
          <DocumentCard>
            <p>
              Los viajes se realizan durante el día, ya que se trabaja con seres
              de luz, quienes acompañan y contienen los procesos de cada persona
              con amor y profundidad.
            </p>
            <p>
              Como tecnología de acceso a la dimensión cósmica, ocupamos dosis
              medias de hongos mágicos o también llamado &ldquo;psylocibe&rdquo;.
              Desde tiempos antiguos, los hongos de psilocibina han sido usados
              para acceder a estados expandidos de conciencia y potenciar el
              bienestar humano.
            </p>
            <p>
              El hongo psilocibio tiene la capacidad de adaptarse al sistema
              nervioso y neurológico de cada persona, lo que contribuye a
              acelerar la regeneración neuronal y la recodificación del ADN.
            </p>
            <p>
              La psilocibina posee una capacidad especial para
              &ldquo;sanar&rdquo; o &ldquo;mejorar&rdquo; nuestras mentes,
              mientras que amplía nuestra comprensión de la experiencia humana
              al conectarnos con nuestra identidad energética.
            </p>
          </DocumentCard>
        </FeatureBlock>

        <ClosingSection
          id="vision"
          title="Nuestra Visión"
          action={{ label: "Explorar viajes", href: "/viajes" }}
        >
          <p>
            Ocupamos tecnologías sagradas, como los{" "}
            <strong>&ldquo;Niños de Luz&rdquo;</strong>, como llaves maestras de
            acceso a la dimensión energética y cósmica. Nuestra visión es
            democratizar el acceso a los misterios celestiales, permitiendo que
            cada individuo experimente su propia divinidad en un entorno guiado
            y curado.
          </p>
        </ClosingSection>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
