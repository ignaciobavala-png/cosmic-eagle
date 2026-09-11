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
 * Recorrido: hero → cuatro palabras sobre crema + símbolo 1 → Quiénes somos
 * (relato sticky) → Nuestro propósito + símbolo 2 → frase sobre imagen →
 * Nuestro enfoque → Estela, fundadora → cierre.
 *
 * **El orden es de Ignacio (09/09) y NO es el del mockup**, donde el enfoque
 * abre y "Quiénes somos" cierra: la página se presenta primero y deja el
 * enfoque para el final. Ojo, ya se revirtió una vez por error — el 08/09 el
 * desplegable del navbar tenía este orden y se lo "corrigió" para que siguiera
 * al de la página, tomándolo por un descuido. El menú y la página van juntos y
 * los manda este orden.
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
 * 3. **Los botones de scroll internos del mockup** se portan como anclas, con el
 *    mismo lenguaje visual que el hint del hero. Encadenan el recorrido de
 *    arriba, así que al mover un bloque hay que revisarlos: hoy van relato →
 *    propósito → video → enfoque → Estela → cierre.
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
      <main className="pt-[var(--navbar-h)]">
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
          className="relative flex w-full flex-col items-center justify-start bg-[#fcedcd] px-margin-mobile pt-[110px] text-[#05125a] md:min-h-[100svh] md:justify-center md:px-margin-desktop md:py-24"
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
            // **`belowId` es la SECCION siguiente, no un texto.** Con el orden
            // del 09/09 ya no hay dos pantallas crema seguidas: abajo empieza el
            // relato, que es azul. Anclarlo a un texto de ahi dejaria el simbolo
            // dorado a caballo del borde; contra el `top` de la seccion queda
            // centrado en el aire que sobra de SU pantalla, que es donde se ve.
            belowId="somos"
            minGap={95}
            maxGap={95}
            amount={0.4}
            delay={2.2}
          />
        </section>

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
          scrollHint={{ label: "Nuestro propósito", target: "#proposito" }}
        />

        {/* Pantalla 3 — "Nuestro propósito", mismo estilo que "Nuestro enfoque".
            En mobile min-height 81vh y padding 35px (mockup 2/9): el contenido
            es corto y ese recorte es lo que deja el hueco del símbolo parejo. */}
        <Reveal
          as="section"
          id="proposito"
          amount={0.25}
          once={false}
          stagger={0}
          className="relative flex w-full flex-col items-center justify-center bg-[#fcedcd] px-margin-mobile py-[35px] text-[#05125a] min-h-[81svh] md:min-h-[100svh] md:px-margin-desktop md:py-[100px]"
        >
          <div className="mx-auto max-w-3xl">
            <RevealItem y={0} duration={1} id="nos-proposito-title">
              <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
                Nuestro propósito
              </h2>
            </RevealItem>
            <RevealLine className="mt-3 mb-6 h-px w-16 bg-[#f9d78f]" />
            {/* **Los resaltados NO cambian de tipografía**, sólo de color y
                peso: llevaban `font-display` y con Sorts Mill Goudy —que tiene
                la altura de x mucho más baja que Montserrat— quedaban
                visiblemente más chicos que el renglón donde viven, como si
                estuvieran en minúscula (reporte de Ignacio del 09/09). Es la
                misma regla que la palabra clave del relato de la home. */}
            <div className="space-y-6 text-body-md leading-relaxed text-[#333] text-justify [&_strong]:font-semibold [&_strong]:text-[#05125a]">
              <RevealItem y={14} duration={0.8} delay={0.15}>
              <p>
                Creamos espacios donde las personas puedan{" "}
                <strong>trascender</strong> patrones limitantes,{" "}
                <strong>reconectar</strong> con su naturaleza más profunda y
                acceder a la luz, la sabiduría y el poder interior que ya habitan
                en ellas.
              </p>
              </RevealItem>
              <RevealItem y={14} duration={0.8} delay={0.3} id="nos-proposito-close">
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
          {/* Símbolo 2: cierra "Nuestro propósito", contra el borde del bloque de
              imagen que sigue. Usa su propio observer (umbral 0.6) y no el de la
              pantalla. Mismo criterio que el símbolo 1 con el `belowId`. */}
          <SymbolRow
            variant={2}
            id="nos-symbol-row-2"
            aboveId="nos-proposito-close"
            belowId="video"
            minGap={32}
            maxGap={121}
            amount={0.6}
            delay={0.3}
          />
          {/* Esta pantalla NO lleva boton de continuar, a diferencia del resto
              del recorrido: el `SymbolRow` de arriba se ancla al pie del bloque
              y el boton le caia encima. Pedido de la clienta, 10/09 — se saca
              el boton, no el simbolo. El paso a `#video` queda solo por scroll. */}
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
          scrollHint={{ label: "Nuestro enfoque", target: "#nuestro-enfoque" }}
        />

        {/* Pantalla 5 — "Nuestro enfoque", la última de contenido antes del
            cierre. Umbral 0.25 y REVERSIBLE: en
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
          className="relative flex w-full flex-col items-center justify-center bg-[#fcedcd] px-margin-mobile pt-[35px] pb-[76px] text-[#05125a] md:min-h-[100svh] md:px-margin-desktop md:pt-[100px] md:pb-[100px]"
        >
          <div className="mx-auto max-w-3xl">
            <RevealItem y={0} duration={1} id="nos-enfoque-title">
              <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
                Nuestro enfoque
              </h2>
            </RevealItem>
            <RevealLine className="mt-3 mb-6 h-px w-16 bg-[#f9d78f]" />
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
          {/* El indicador es `absolute`, asi que no ocupa lugar: el `pb-[76px]`
              de la seccion es el hueco que le reserva. En mobile esta seccion
              no tiene alto minimo —la llena el texto— y con el padding de 35px
              el indicador caia ENCIMA del cierre en italica (reporte de
              Ignacio del 11/09, medido a 390x844: se metia 23px adentro).
              76px = 12 del `bottom-3` + 46 que mide + 18 de aire. */}
          <ScrollHintButton
            label="Estela"
            target="#estela"
            tone="dark"
            bottomClassName="bottom-3 md:bottom-6"
          />
        </Reveal>

        {/* Pantalla 6 — "Estela, fundadora", la ultima de contenido. Copy de la
            clienta (11/09), literal: no se reescribe ni se le inventan
            resaltados. Es el mismo bloque que "Nuestro enfoque" y "Nuestro
            proposito" (crema profunda, titulo en la display, filete dorado,
            cuerpo en Montserrat justificado y cierre en italica sobre el
            filete), asi las tres pantallas de texto del recorrido se leen como
            una sola serie.

            La frase final va en el cierre italico y no como un parrafo mas: es
            la unica que sintetiza, igual que la de "Nuestro enfoque".

            NO lleva foto: no hay retrato entregado. Cuando llegue, va como slot
            de site_content (grupo "Nosotros") y el bloque pasa a dos columnas.

            `#estela` es tambien el destino del desplegable de "Nosotros" del
            navbar. */}
        <Reveal
          as="section"
          id="estela"
          amount={0.25}
          once={false}
          stagger={0}
          className="relative flex w-full flex-col items-center justify-center bg-[#fcedcd] px-margin-mobile pt-[35px] pb-[76px] text-[#05125a] md:min-h-[100svh] md:px-margin-desktop md:pt-[100px] md:pb-[100px]"
        >
          <div className="mx-auto max-w-3xl">
            <RevealItem y={0} duration={1} id="nos-estela-title">
              <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
                Estela, fundadora
              </h2>
            </RevealItem>
            <RevealLine className="mt-3 mb-6 h-px w-16 bg-[#f9d78f]" />
            <div className="space-y-6 text-body-md leading-relaxed text-[#333] text-justify">
              <RevealItem y={14} duration={0.8} delay={0.15}>
                <p>
                  Estela lleva más de 25 años explorando la conciencia, la mente,
                  el alma y el potencial humano. Su camino ha sido principalmente
                  experiencial: una búsqueda constante por comprender quiénes
                  somos, cómo funcionamos y hasta dónde podemos evolucionar.
                </p>
              </RevealItem>
              <RevealItem y={14} duration={0.8} delay={0.3}>
                <p>
                  A lo largo de estos años ha estudiado y experimentado con
                  distintas corrientes y herramientas, desde la psicología, la
                  metafísica y las filosofías espirituales hasta el yoga, la
                  meditación, la energía Kundalini, la nutrición consciente, las
                  prácticas energéticas, el chamanismo, las plantas de poder y los
                  estados expandidos de conciencia.
                </p>
              </RevealItem>
              <RevealItem y={14} duration={0.8} delay={0.45}>
                <p>
                  Con el tiempo, todo este recorrido fue convergiendo en una
                  práctica propia para acompañar procesos de transformación y
                  evolución. Su enfoque integra conocimiento ancestral,
                  herramientas contemporáneas, prácticas energéticas y lo que ella
                  llama conocimiento cósmico: información y tecnologías que ha ido
                  recibiendo y explorando a través de estados expandidos de
                  conciencia y de su conexión con otras dimensiones e
                  inteligencias superiores.
                </p>
              </RevealItem>
              <RevealItem y={14} duration={0.8} delay={0.6}>
                <p>
                  Hoy acompaña a personas de distintas partes del mundo en
                  procesos de liberación de patrones y memorias, reconexión con el
                  alma, expansión de conciencia, despertar espiritual y desarrollo
                  de capacidades intuitivas y energéticas. También enseña y
                  acompaña a hombres y mujeres medicina, terapeutas y guías a
                  profundizar en sus propias herramientas, expandir sus
                  capacidades y llevar su práctica a un nuevo nivel.
                </p>
              </RevealItem>
            </div>
            <RevealItem y={14} duration={0.8} delay={0.8} id="nos-estela-close">
              <p className="mt-8 border-t border-[#05125a]/15 pt-6 font-display text-xl italic leading-relaxed text-[#05125a]">
                En el centro de todo está la evolución: liberarnos de aquello que
                nos limita, recordar quiénes somos y abrir espacio para desarrollar
                el potencial que cada ser humano lleva dentro.
              </p>
            </RevealItem>
          </div>
          {/* Mismo hueco reservado que en "Nuestro enfoque" (ver alla). */}
          <ScrollHintButton
            label="Continuar"
            target="#vision"
            tone="dark"
            bottomClassName="bottom-3 md:bottom-6"
          />
        </Reveal>

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
