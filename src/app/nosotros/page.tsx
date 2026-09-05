import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { PageHero, renderTitle } from "@/components/ui/PageHero";
import { WordSequence } from "@/components/ui/WordSequence";
import { MediaStatement } from "@/components/ui/MediaStatement";
import { StickyStory } from "@/components/ui/StickyStory";
import { ClosingHero } from "@/components/ui/ClosingHero";
import { Reveal, RevealItem, RevealLine } from "@/components/ui/Reveal";
import { SymbolRow } from "@/components/ui/NosSymbols";
import { ScrollHintButton } from "@/components/ui/ScrollHintButton";
import { getSiteContent, isEnabled } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Nosotros | Cosmic Eagle",
  description:
    "Nuestro enfoque reúne conocimiento ancestral y galáctico, tecnologías cósmicas y prácticas de conciencia para sostener procesos de transformación, liberación y reconexión con el alma.",
};

/**
 * /nosotros según el rediseño de Julia (`NOSOTROS.html`, ver
 * docs/REDISENO_JULIA_HTML.md §4).
 *
 * Recorrido: hero → cuatro palabras sobre crema + símbolo 1 → Nuestro enfoque +
 * símbolo 2 → Nuestro propósito → frase sobre imagen → relato sticky → cierre.
 *
 * Las dos filas de símbolos decorativos (arte final entregado el 2/9 junto con
 * este mockup) replican `.nos-symbol-row`/`nosCenterSymbol()` del original: el
 * centrado se mide en runtime contra los textos vecinos, no con valores fijos.
 * El símbolo 2 usa su propio observer (umbral 0.6), no el de las pantallas.
 *
 * Tres decisiones que se ven en el código:
 *
 * 1. **Donde Julia puso video va la imagen que ya está cargada.** Los videos no
 *    llegaron todavía; `MediaStatement` se cambia a `<video>` sin tocar la
 *    página cuando lleguen.
 * 2. **Las claves de los slots no cambian aunque cambie la sección.** Las dos
 *    imágenes de los bloques que el rediseño elimina (`nosotros.proposito.image`
 *    y `nosotros.metodologia.image`) se reusan acá con la misma key, así lo que
 *    la clienta ya subió desde /admin/multimedia sigue apareciendo. Renombrarlas
 *    hubiera dejado las filas huérfanas y la página con los assets del repo.
 * 3. **Los botones de scroll internos del mockup** (IR MÁS PROFUNDO → video,
 *    SOBRE NOSOTROS → relato, CONTINUAR → cierre) se portan como anclas, con el
 *    mismo lenguaje visual que el hint del hero.
 *
 * El copy es de la clienta y está literal del mockup. El texto viejo de
 * metodología (hongos, dosis, seres de luz) que esta versión deja afuera quedó
 * guardado en docs/COPY_HUERFANO.md — no se perdió, falta decidir a dónde va.
 */
export default async function NosotrosPage() {
  const content = await getSiteContent();
  const cierreTitle = content("nosotros.cierre.title").trim();

  return (
    <>
      <Header />
      <main className="pt-18 md:pt-24">
        <PageHero
          image={content("nosotros.hero.image")}
          imageAlt="Siluetas de almas en partículas de luz"
          title={renderTitle(content("nosotros.hero.title"))}
          subtitle={content("nosotros.hero.subtitle")}
          scrollHint="Conocenos"
          scrollTo="enfoque"
          height="full"
          overlay={isEnabled(content("nosotros.hero.overlay"))}
        />

        {/* Pantalla 1 — las cuatro palabras sobre crema. En mobile el copy queda
            arriba con aire fijo (mockup 2/9: `justify-start`, padding-top 110px,
            sin alto minimo) y el simbolo lo sigue en flujo; en desktop la fila
            se centra verticalmente y el simbolo viaja absoluto medido. */}
        <section
          id="enfoque"
          className="relative flex w-full flex-col items-center justify-start bg-[#fff7ea] px-margin-mobile pt-[110px] text-[#05125a] md:min-h-[100svh] md:justify-center md:px-margin-desktop md:py-24"
        >
          <div id="nos-words-seq">
            <WordSequence
              words={["Liberar", "Recordar", "Reconectar", "Encarnar"]}
            />
          </div>
          {/* Símbolo 1: se revela con su pantalla (delay 2.2s para no competir
              con la cascada de palabras) y se centra medido entre el final de
              las palabras y el título de la pantalla siguiente. */}
          <SymbolRow
            variant={1}
            id="nos-symbol-row-1"
            aboveId="nos-words-seq"
            belowId="nos-enfoque-title"
            minGap={95}
            maxGap={95}
            amount={0.4}
            delay={2.2}
          />
        </section>

        {/* Pantalla 2 — "Nuestro enfoque". Umbral 0.25 y REVERSIBLE: en
            /nosotros y /viajes las animaciones se deshacen al volver hacia
            arriba (`nosObserveToggle`). El titulo entra en 1s, la linea crece de
            0 a 64px en 1.2s y los parrafos van de a 14px con 0.15s de escalon.
            La frase itálica del cierre lleva 0.65s, que es el unico retardo que
            Julia escribe a mano. Padding mobile 35px como el mockup 2/9.

            El `id` es el destino del desplegable de "Nosotros" del navbar
            (04/09). Ojo: `#enfoque` ya estaba tomado por la pantalla de las
            cuatro palabras, que es a donde apunta el hint del hero — por eso
            esta seccion es `#nuestro-enfoque` y no se renombro la otra. */}
        <Reveal
          as="section"
          id="nuestro-enfoque"
          amount={0.25}
          once={false}
          stagger={0}
          className="relative flex w-full flex-col items-center justify-center bg-[#fff6eb] px-margin-mobile py-[35px] text-[#05125a] md:min-h-[100svh] md:px-margin-desktop md:py-[100px]"
        >
          <div className="mx-auto max-w-3xl">
            <RevealItem y={0} duration={1} id="nos-enfoque-title">
              <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
                Nuestro enfoque
              </h2>
            </RevealItem>
            <RevealLine className="mt-3 mb-6 h-0.5 w-16 bg-[#f9d78f]" />
            <div className="space-y-6 text-body-md leading-relaxed text-[#333] text-justify">
              <RevealItem y={14} duration={0.8} delay={0.15}>
              <p>
                Nuestro enfoque reúne conocimiento ancestral y galáctico,
                tecnologías cósmicas y prácticas de conciencia para sostener
                procesos de transformación, liberación y reconexión con el alma.
              </p>
              </RevealItem>
              <RevealItem y={14} duration={0.8} delay={0.3}>
              <p>
                El camino comienza liberando los patrones y estructuras que nos
                limitan, permitiendo que emerjan una memoria más profunda y un
                conocimiento interior. Desde ahí, reconectamos con la
                inteligencia del alma y aprendemos a llevar esa conciencia al
                cuerpo, a nuestras relaciones, a nuestro propósito y a la forma
                en que vivimos.
              </p>
              </RevealItem>
              <RevealItem y={14} duration={0.8} delay={0.45}>
              <p>
                Para los sanadores, esto puede abrir el acceso a nuevas formas de
                conocimiento y sanación. Para los líderes, puede expandir la
                percepción, la intuición y las capacidades humanas. Para los
                buscadores espirituales, puede traer mayor claridad sobre el
                propósito y el camino del alma. Y para quienes ya están inmersos
                en un trabajo evolutivo, puede abrir capas más profundas de
                conocimiento sobre la conciencia y la evolución humana.
              </p>
              </RevealItem>
            </div>
            <RevealItem y={14} duration={0.8} delay={0.65} id="nos-enfoque-close">
              <p className="mt-8 border-t border-[#05125a]/15 pt-6 font-display text-xl italic leading-relaxed text-[#05125a]">
                Nuestro rol no es definir lo que alguien debe experimentar o en
                qué debe convertirse, sino crear las condiciones para que su
                propio proceso se despliegue.
              </p>
            </RevealItem>
          </div>
          {/* Símbolo 2: vive al límite entre esta pantalla y la de propósito, por
              eso usa su propio observer (umbral 0.6) y no el de ninguna de las
              dos. */}
          <SymbolRow
            variant={2}
            id="nos-symbol-row-2"
            aboveId="nos-enfoque-close"
            belowId="nos-proposito-title"
            minGap={32}
            maxGap={121}
            amount={0.6}
            delay={0.3}
          />
        </Reveal>

        {/* Pantalla 3 — "Nuestro propósito", mismo estilo que la pantalla 2.
            En mobile min-height 81vh y padding 35px (mockup 2/9): el contenido
            es corto y ese recorte es lo que deja el hueco del símbolo parejo. */}
        <Reveal
          as="section"
          id="proposito"
          amount={0.25}
          once={false}
          stagger={0}
          className="relative flex w-full flex-col items-center justify-center bg-[#fff6eb] px-margin-mobile py-[35px] text-[#05125a] min-h-[81svh] md:min-h-[100svh] md:px-margin-desktop md:py-[100px]"
        >
          <div className="mx-auto max-w-3xl">
            <RevealItem y={0} duration={1} id="nos-proposito-title">
              <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
                Nuestro propósito
              </h2>
            </RevealItem>
            <RevealLine className="mt-3 mb-6 h-0.5 w-16 bg-[#f9d78f]" />
            <div className="space-y-6 text-body-md leading-relaxed text-[#333] text-justify [&_strong]:font-display [&_strong]:font-bold [&_strong]:text-[#05125a]">
              <RevealItem y={14} duration={0.8} delay={0.15}>
              <p>
                Creamos espacios donde las personas puedan{" "}
                <strong>trascender</strong> patrones limitantes,{" "}
                <strong>reconectar</strong> con su naturaleza más profunda y
                acceder a la luz, la sabiduría y el poder interior que ya habitan
                en ellas.
              </p>
              </RevealItem>
              <RevealItem y={14} duration={0.8} delay={0.3}>
              <p>
                <strong>
                  Nuestro trabajo acompaña a personas en distintas etapas de este
                  camino:
                </strong>{" "}
                desde quienes comienzan un proceso profundo de transformación,
                hasta sanadores, guías y practicantes experimentados que entran
                en nuevas etapas de evolución, desarrollo y servicio.
              </p>
              </RevealItem>
            </div>
          </div>
          <ScrollHintButton
            label="Ir más profundo"
            target="#video"
            tone="dark"
            className="bottom-3 md:bottom-6"
          />
        </Reveal>

        {/* Julia pidió video acá; va la imagen hasta que llegue. La key del slot
            es la del bloque "Evolución Consciente" que el rediseño elimina, para
            no perder la foto que la clienta ya subió. */}
        {/* Fade simple: umbral 0.4, 1.2s y SIN transform ni retardo — es el
            unico bloque del sitio que solo cambia de opacidad. Velo al 0.3 como
            en el mockup. */}
        <MediaStatement
          id="video"
          image={content("nosotros.proposito.image")}
          imageAlt="Círculo de ceremonia iluminado"
          text={content("nosotros.frase")}
          amount={0.4}
          once={false}
          y={0}
          duration={1.2}
          veil={0.3}
          overlay={isEnabled(content("nosotros.proposito.overlay"))}
          scrollHint={{ label: "Sobre nosotros", target: "#somos" }}
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
          scrollHint={{ label: "Continuar", target: "#vision" }}
        />

        <ClosingHero
          id="vision"
          image={content("nosotros.metodologia.image")}
          imageAlt="Textura cósmica"
          title={cierreTitle ? <CierreTitle text={cierreTitle} /> : null}
          actions={[
            { label: "Explorar experiencias", href: "/viajes" },
            {
              label: "Ir más profundo",
              href: "/contenidos",
              variant: "ghost",
            },
          ]}
          overlay={isEnabled(content("nosotros.metodologia.overlay"))}
        />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}

/** El quiebre del título de cierre en 2 líneas es diseño visual: cada salto de
    línea del campo CMS parte el título, en todos los anchos (a diferencia de
    `renderTitle`, que solo quiebra en desktop). */
function CierreTitle({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {i > 0 ? ` ${line}` : line}
        </span>
      ))}
    </>
  );
}
