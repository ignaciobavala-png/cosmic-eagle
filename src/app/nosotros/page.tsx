import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { PageHero, renderTitle } from "@/components/ui/PageHero";
import { CreamSection } from "@/components/ui/CreamSection";
import { WordSequence } from "@/components/ui/WordSequence";
import { MediaStatement } from "@/components/ui/MediaStatement";
import { StickyStory } from "@/components/ui/StickyStory";
import { ClosingHero } from "@/components/ui/ClosingHero";
import { Reveal } from "@/components/ui/Reveal";
import { getSiteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Nosotros | Cosmic Eagle",
  description:
    "Nuestro enfoque reúne conocimiento ancestral y galáctico, tecnologías cósmicas y prácticas de conciencia para sostener procesos de transformación, liberación y reconexión con el alma.",
};

/**
 * /nosotros según el rediseño de Julia (`NOSOTROS.html`, ver
 * docs/REDISENO_JULIA_HTML.md §4).
 *
 * Recorrido: hero → cuatro palabras sobre crema → Nuestro enfoque → Nuestro
 * propósito → frase sobre imagen → relato sticky → cierre.
 *
 * Dos decisiones que se ven en el código:
 *
 * 1. **Donde Julia puso video va la imagen que ya está cargada.** Los videos no
 *    llegaron todavía; `MediaStatement` se cambia a `<video>` sin tocar la
 *    página cuando lleguen.
 * 2. **Las claves de los slots no cambian aunque cambie la sección.** Las dos
 *    imágenes de los bloques que el rediseño elimina (`nosotros.proposito.image`
 *    y `nosotros.metodologia.image`) se reusan acá con la misma key, así lo que
 *    la clienta ya subió desde /admin/multimedia sigue apareciendo. Renombrarlas
 *    hubiera dejado las filas huérfanas y la página con los assets del repo.
 *
 * El copy es de la clienta y está literal del mockup. El texto viejo de
 * metodología (hongos, dosis, seres de luz) que esta versión deja afuera quedó
 * guardado en docs/COPY_HUERFANO.md — no se perdió, falta decidir a dónde va.
 */
export default async function NosotrosPage() {
  const content = await getSiteContent();

  return (
    <>
      <Header />
      <main className="pt-16 lg:pt-21">
        <PageHero
          image={content("nosotros.hero.image")}
          imageAlt="Siluetas de almas en partículas de luz"
          title={renderTitle(content("nosotros.hero.title"))}
          subtitle={content("nosotros.hero.subtitle")}
          scrollHint="Conocenos"
          scrollTo="enfoque"
          height="full"
        />

        <CreamSection id="enfoque">
          <WordSequence
            words={["Liberar", "Recordar", "Reconectar", "Encarnar"]}
          />
        </CreamSection>

        <CreamSection>
          <Reveal className="mx-auto max-w-3xl">
            <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
              Nuestro enfoque
            </h2>
            <div
              aria-hidden="true"
              className="mt-3 mb-6 h-0.5 w-16 bg-[#f9d78f]"
            />
            <div className="space-y-6 text-body-md leading-relaxed text-[#333] text-justify">
              <p>
                Nuestro enfoque reúne conocimiento ancestral y galáctico,
                tecnologías cósmicas y prácticas de conciencia para sostener
                procesos de transformación, liberación y reconexión con el alma.
              </p>
              <p>
                El camino comienza liberando los patrones y estructuras que nos
                limitan, permitiendo que emerjan una memoria más profunda y un
                conocimiento interior. Desde ahí, reconectamos con la
                inteligencia del alma y aprendemos a llevar esa conciencia al
                cuerpo, a nuestras relaciones, a nuestro propósito y a la forma
                en que vivimos.
              </p>
              <p>
                Para los sanadores, esto puede abrir el acceso a nuevas formas de
                conocimiento y sanación. Para los líderes, puede expandir la
                percepción, la intuición y las capacidades humanas. Para los
                buscadores espirituales, puede traer mayor claridad sobre el
                propósito y el camino del alma. Y para quienes ya están inmersos
                en un trabajo evolutivo, puede abrir capas más profundas de
                conocimiento sobre la conciencia y la evolución humana.
              </p>
            </div>
            <p className="mt-8 border-t border-[#05125a]/15 pt-6 font-display text-xl italic leading-relaxed text-[#05125a]">
              Nuestro rol no es definir lo que alguien debe experimentar o en qué
              debe convertirse, sino crear las condiciones para que su propio
              proceso se despliegue.
            </p>
          </Reveal>
        </CreamSection>

        <CreamSection id="proposito">
          <Reveal className="mx-auto max-w-3xl">
            <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
              Nuestro propósito
            </h2>
            <div
              aria-hidden="true"
              className="mt-3 mb-6 h-0.5 w-16 bg-[#f9d78f]"
            />
            <div className="space-y-6 text-body-md leading-relaxed text-[#333] text-justify [&_strong]:font-display [&_strong]:font-bold [&_strong]:text-[#05125a]">
              <p>
                Creamos espacios donde las personas puedan{" "}
                <strong>trascender</strong> patrones limitantes,{" "}
                <strong>reconectar</strong> con su naturaleza más profunda y
                acceder a la luz, la sabiduría y el poder interior que ya habitan
                en ellas.
              </p>
              <p>
                <strong>
                  Nuestro trabajo acompaña a personas en distintas etapas de este
                  camino:
                </strong>{" "}
                desde quienes comienzan un proceso profundo de transformación,
                hasta sanadores, guías y practicantes experimentados que entran
                en nuevas etapas de evolución, desarrollo y servicio.
              </p>
            </div>
          </Reveal>
        </CreamSection>

        {/* Julia pidió video acá; va la imagen hasta que llegue. La key del slot
            es la del bloque "Evolución Consciente" que el rediseño elimina, para
            no perder la foto que la clienta ya subió. */}
        <MediaStatement
          image={content("nosotros.proposito.image")}
          imageAlt="Círculo de ceremonia iluminado"
          text={content("nosotros.frase")}
        />

        <StickyStory
          id="somos"
          paragraphs={[
            "Somos investigadores y exploradores apasionados de la conciencia, la transformación humana y la naturaleza de la realidad. Nuestro trabajo se nutre de la exploración de la metafísica, las civilizaciones antiguas, las filosofías espirituales, las tradiciones de sanación, las prácticas de bienestar, los estudios de la conciencia y el conocimiento cósmico.",
            "Existimos para quienes sienten el llamado de ir más allá de la transformación personal, hacia un proceso evolutivo más profundo: expandir la conciencia, liberar patrones humanos limitantes, fortalecer la conexión con el alma y explorar las capacidades que pueden emerger a medida que esa conexión se profundiza.",
            <span key="cierre" className="font-semibold text-primary-container">
              A través de nuestro cuerpo de conocimiento en evolución, nuestras
              prácticas y tecnologías cósmicas, ofrecemos un camino hacia el
              recuerdo y la encarnación de la luz, la inteligencia y el potencial
              que existen dentro de nosotros.
            </span>,
          ]}
        />

        <ClosingHero
          id="vision"
          image={content("nosotros.metodologia.image")}
          imageAlt="Textura cósmica"
          title={
            <>
              Un viaje hacia el
              <br />
              Humano Luminoso
            </>
          }
          actions={[
            { label: "Explorar experiencias", href: "/viajes" },
            {
              label: "Ir más profundo",
              href: "/contenidos",
              variant: "ghost",
            },
          ]}
        />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
