import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero, renderTitle } from "@/components/ui/PageHero";
import { WordSequence } from "@/components/ui/WordSequence";
import { MediaStatement } from "@/components/ui/MediaStatement";
import { StickyStory } from "@/components/ui/StickyStory";
import { ClosingHero } from "@/components/ui/ClosingHero";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { TitleRule } from "@/components/ui/TitleRule";
import { getSiteContent, isEnabled } from "@/lib/site-content";
import { IMAGES } from "@/lib/constants";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/nosotros">): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Nosotros");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

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
export default async function NosotrosPage({
  params,
}: PageProps<"/[locale]/nosotros">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Nosotros");
  const content = await getSiteContent(locale);
  const cierreTitle = content("nosotros.cierre.title").trim();

  return (
    <>
      <Header />
      <main className="pt-[var(--navbar-h)]">
        <PageHero
          image={content("nosotros.hero.image")}
          imageAlt={t("hero.imageAlt")}
          title={renderTitle(content("nosotros.hero.title"))}
          subtitle={content("nosotros.hero.subtitle")}
          scrollHint={t("hero.scrollHint")}
          scrollTo="enfoque"
          height="full"
          overlay={isEnabled(content("nosotros.hero.overlay"))}
          hardEdge
        />

        {/* Pantalla 1 — las cuatro palabras, juntas y sin símbolos desde el
            03/10 (correcciones de la organización, §1.5): tienen que leerse
            como un recorrido completo, no como pantallas sueltas. Se fue el
            `SymbolRow` que las seguía y el aire fijo de 110px de mobile.

            **El fondo es la banda dorada y no el crema del sitio**, pedido de
            Sofia del 15/09 sobre la prueba de /contenidos. Es la unica pantalla
            de /nosotros con este fondo: las otras tres (proposito, enfoque,
            cierre) siguen en crema. La clase va suelta y no por `GOLD` porque
            esta seccion no es una `CreamSection`, pero es el mismo degrade. */}
        <section
          id="enfoque"
          // Pedido de la organización (23/09): el recuadro dorado "tiene
          // demasiado peso visual y ocupa demasiado espacio". Baja de una
          // pantalla completa (`100svh`) a un alto acotado por el contenido.
          className="relative flex w-full flex-col items-center justify-center bg-[linear-gradient(135deg,#f9d78f,#b3964b)] px-margin-mobile py-14 text-[#05125a] md:px-margin-desktop md:py-20"
        >
          <div id="nos-words-seq">
            <WordSequence words={t.raw("words") as string[]} />
          </div>
        </section>

        {/* Copy actualizado a pedido de la organización (23/09, "edición
            ligera para dar mayor fluidez y coherencia"): texto literal del
            documento de correcciones. */}
        <StickyStory
          id="somos"
          paragraphs={[
            t("somos.p1"),
            t("somos.p2"),
            t("somos.p3"),
            t.rich("somos.p4", {
              strong: (chunks) => (
                <span className="font-semibold text-primary-container">
                  {chunks}
                </span>
              ),
            }),
          ]}
        />

        {/* Pantalla 3 — "Nuestro propósito". En mobile min-height 81vh y
            padding 35px (mockup 2/9): el contenido es corto y ese recorte es lo
            que deja el hueco del símbolo parejo.

            Fondo dorado desde el 15/09, como la pantalla de las cuatro
            palabras. Arrastra lo mismo que alla: el filete y el cuerpo cambian
            de color porque sobre este fondo el oro claro y el gris no llegan, y
            el simbolo va con `onGold`. */}
        <Reveal
          as="section"
          id="proposito"
          amount={0.25}
          once={false}
          stagger={0}
          className="relative flex w-full flex-col items-center justify-center bg-[linear-gradient(135deg,#f9d78f,#b3964b)] px-margin-mobile py-14 text-[#05125a] md:min-h-[100svh] md:px-margin-desktop md:py-[100px]"
        >
          {/* `md:mb-[219px]`: el colchon que centra el CONJUNTO texto+simbolo y
              no solo el texto. El simbolo es `absolute`, asi que no pesa en el
              `justify-center`: sin este colchon el texto quedaba centrado solo y
              el simbolo se iba al piso (medido el 17/09 en 1440x900: 322px de
              aire arriba contra 112 abajo). Mide `desktopGap` (121) + el alto
              del simbolo 2 (98) — si cambia cualquiera de los dos, cambia aca. */}
          <div className="mx-auto max-w-3xl">
            {/* `w-fit`: el filete mide el ancho del titulo y no el de la
                columna. El `id` del `RevealItem` no se mueve: lo usan las
                mediciones de centrado de esta pagina. */}
            <div className="w-fit">
              <RevealItem y={0} duration={1} id="nos-proposito-title">
                <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
                  {t("purpose.title")}
                </h2>
              </RevealItem>
              {/* Oro oscuro: sobre el dorado el `#f9d78f` de los otros filetes
                  da 1,20:1, o sea que no se ve. */}
              <TitleRule tone="goldDeep" grow className="mt-3 mb-6" />
            </div>
            {/* **Los resaltados NO cambian de tipografía**, sólo de color y
                peso: llevaban `font-display` y con Sorts Mill Goudy —que tiene
                la altura de x mucho más baja que Montserrat— quedaban
                visiblemente más chicos que el renglón donde viven, como si
                estuvieran en minúscula (reporte de Ignacio del 09/09). Es la
                misma regla que la palabra clave del relato de la home. */}
            {/* Cuerpo azul, como en todo el sitio desde el 16/09. Aca ademas
                era obligatorio: sobre el dorado el gris `#333` que habia antes
                caia a 4,44:1, abajo del minimo. */}
            {/* Texto reemplazado a pedido de la organización (23/09): declara
                para qué existe Cosmic Eagle Journey, mismo copy que la home. */}
            <div className="space-y-6 text-body-md leading-relaxed text-[#05125a] text-left [&_strong]:font-semibold [&_strong]:text-[#05125a]">
              <RevealItem y={14} duration={0.8} delay={0.15}>
              <p>
                {t.rich("purpose.p1", {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
              </RevealItem>
              <RevealItem y={14} duration={0.8} delay={0.3} id="nos-proposito-close">
              <p>
                {t.rich("purpose.p2", {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
              </RevealItem>
            </div>
          </div>
          {/* Sin el símbolo de las dos lunas desde el 03/10 (§1.4: "se ve
              raro y se superpone con la caja de abajo"), y sin el colchón de
              219px que le reservaba lugar. Tampoco lleva botón de continuar. */}
        </Reveal>

        {/* Frase destacada nueva (pedido de la organización, 23/09):
            inmediatamente después de "Nuestro propósito" y antes de la
            imagen, con jerarquía Nivel 1 — la misma escala que los grandes
            hitos narrativos del sitio. Es la frase que hasta ahora cerraba
            "Nuestro enfoque". */}
        <Reveal
          as="section"
          amount={0.3}
          once={false}
          className="flex w-full items-center justify-center bg-[linear-gradient(135deg,#f9d78f,#b3964b)] px-margin-mobile py-16 text-center text-[#05125a] md:px-margin-desktop md:py-24"
        >
          <RevealItem y={20} duration={1}>
            <p className="mx-auto max-w-3xl font-display text-headline-md leading-snug md:text-headline-lg">
              {t("quote")}
            </p>
          </RevealItem>
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
          imageAlt={t("videoAlt")}
          text={content("nosotros.frase")}
          amount={0.4}
          once={false}
          y={0}
          duration={1.2}
          veil={0.3}
          overlay={isEnabled(content("nosotros.proposito.overlay"))}
          // En el telefono la caja es vertical y de esta foto —la figura
          // acostada, que ocupa el ancho entero— sobrevive apenas el 26% del
          // ancho: centrado, el recorte caia en la cadera y no se entendia que
          // era. Con el foco en el 68% entran la cabeza y el torso, que es lo
          // que cuenta la imagen, y las piernas quedan afuera a proposito
          // (pedido de Ignacio, 16/09). Medido sobre el asset real (1456x816)
          // comparando cuatro posiciones a 390x844.
          //
          // Desde el 01/10 mobile ni siquiera recorta esa foto: lleva otra
          // (pedido de Ignacio), un fijo de layout en public/img. Si la
          // clienta cambia el slot, en el telefono se sigue viendo esta. El
          // anillo de luz esta en el tercio derecho, de ahi el foco.
          // Misma estética que las frases sobre imagen de la home (regla
          // general de las correcciones del 03/10): `text-h2` en el oro
          // `primary-container`, recta.
          textClassName="text-h2"
          textColorClassName="text-primary-container"
          imageMobile={IMAGES.nosotrosVideoMobile}
          imagePositionMobile="object-[78%_center]"
        />

        {/* Pantalla 5 — "Nuestro enfoque", la última de contenido antes del
            cierre. Umbral 0.25 y REVERSIBLE: en
            /nosotros y /viajes las animaciones se deshacen al volver hacia
            arriba (`nosObserveToggle`). El titulo entra en 1s, la linea crece de
            0 a 64px en 1.2s y los parrafos van de a 14px con 0.15s de escalon.
            La frase itálica del cierre lleva 0.65s, que es el unico retardo que
            Julia escribe a mano. Padding mobile 35px como el mockup 2/9.

            **Fondo dorado desde el 16/09** (pedido de las clientas), el mismo
            degradé de "Nuestro propósito", de la franja de Tecnología Humana y
            de la biblioteca de /contenidos. Arrastra lo de siempre: el filete
            pasa al oro oscuro porque el claro sobre este fondo da 1,20:1. El
            cuerpo ya estaba en azul, que sobre el punto más oscuro del degradé
            mide 5,95:1.

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
          className="relative overflow-hidden flex w-full flex-col items-center justify-center bg-[linear-gradient(135deg,#f9d78f,#b3964b)] px-margin-mobile pt-[35px] pb-[88px] text-[#05125a] md:min-h-[100svh] md:px-margin-desktop md:pt-[100px] md:pb-[100px]"
        >
          {/* Marca de agua a los dos costados, el mismo recurso que la
              biblioteca de /contenidos: el simbolo del manual, tono sobre tono,
              cortado por el borde. Aca va simetrico —uno por lado— porque el
              simbolo lo es.

              **Solo desde `md`.** En mobile la columna ocupa el ancho completo
              y el cuerpo va DIRECTO sobre el dorado, sin tarjeta que lo separe:
              cualquier marca de agua queda atras del texto y le come
              legibilidad. En /contenidos si se quedan en mobile porque ahi lo
              que se apoya encima son tarjetas opacas.

              Los tamaños y las posiciones estan calculados para NO entrar en la
              columna: con `max-w-3xl` (768px) en una pantalla de 1440 quedan
              336px libres de cada lado, y el simbolo mide 300 arrancando fuera
              del borde. El envoltorio va en `z-0` y el contenido en `z-10`, no
              en z-index negativo. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 hidden md:block"
          >
            <img
              src={IMAGES.simboloCaliz}
              alt=""
              className="absolute -left-20 top-1/2 w-[300px] -translate-y-1/2 opacity-[0.12] lg:-left-10 lg:w-[340px]"
            />
            <img
              src={IMAGES.simboloCaliz}
              alt=""
              className="absolute -right-20 top-1/2 w-[300px] -translate-y-1/2 opacity-[0.12] lg:-right-10 lg:w-[340px]"
            />
          </div>
          <div className="relative z-10 mx-auto max-w-3xl">
            <div className="w-fit">
              <RevealItem y={0} duration={1} id="nos-enfoque-title">
                <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
                  {t("enfoque.title")}
                </h2>
              </RevealItem>
              {/* Oro oscuro, igual que en "Nuestro propósito": sobre este fondo
                  el `#f9d78f` de las franjas crema da 1,20:1 y no se ve. */}
              <TitleRule tone="goldDeep" grow className="mt-3 mb-6" />
            </div>
            {/* Simplificado a pedido de la organización (23/09): en vez de
                volver a explicar las metodologías, explica PARA QUIÉN es este
                trabajo. La frase itálica que cerraba esta pantalla se movió
                después de "Nuestro propósito" (item 5 del doc de
                correcciones), donde ahora vive sola con jerarquía Nivel 1. */}
            <div className="space-y-6 text-body-md leading-relaxed text-[#05125a] text-left">
              <RevealItem y={14} duration={0.8} delay={0.15}>
              <p>{t("enfoque.p1")}</p>
              </RevealItem>
              <RevealItem y={14} duration={0.8} delay={0.3}>
              <p>{t("enfoque.p2")}</p>
              </RevealItem>
            </div>
          </div>
          {/* **Sin indicador "Estela"** (pedido de Ignacio, 16/09): la frase
              en italica cierra la pantalla y no lleva nada abajo. `#estela`
              sigue siendo el destino del desplegable de "Nosotros" del navbar;
              lo que se saca es el atajo, no el ancla.

              El `pb-[88px]` de mobile se queda, pero **ya no es el hueco del
              indicador sino el del boton flotante "Volver arriba"**, que es
              `fixed` y cae justo sobre la esquina derecha del cierre en
              italica. Medido a 390x844 con la seccion apoyada en el pie de la
              pantalla: con los 35px del mockup el boton le tapa 47px a la
              ultima linea, con 88px quedan 6px de aire. El boton se saco del
              sitio el 01/10 (pedido de Ignacio); el padding se deja como
              estaba para no mover la pantalla. */}
        </Reveal>

        {/* Pantalla 6 — "Estela, founder", la ultima de contenido. Copy de la
            clienta (11/09), literal: no se reescribe ni se le inventan
            resaltados. Es la misma ESTRUCTURA que "Nuestro enfoque" y "Nuestro
            proposito" (titulo en la display, filete dorado, cuerpo en
            Montserrat justificado y cierre en italica sobre el filete), asi las
            tres pantallas de texto del recorrido se leen como una sola serie.

            **El fondo es el azul del manual de marca** (pedido de Ignacio,
            17/09): el `Fondos/1.png` del manual, que es un degrade diagonal de
            `#05125a` a `#0070ab`. Va como `linear-gradient` y no como imagen —
            es un degrade plano, el PNG son 60KB para lo que el CSS hace en cero
            y ademas asi comparte los colores exactos del navbar y el footer.

            Al invertirse el fondo se invierte toda la paleta del bloque.
            **Revisado el 20/09**: el titulo y el cuerpo arrancaron en `primary`
            (el blanco calido), pero quedaba inconsistente con el resto de las
            pantallas de fondo azul del sitio — "Nuestro proposito" de la home
            usa titulo en `primary-container` (el oro) y cuerpo en el tostado
            `#d0c5b4`, y esta pantalla es la unica que no seguia esa regla. Ahora
            usa el mismo par, y el cierre italico se queda en `primary-container`
            tambien, que es el oro que la regla del 28/08 reserva para texto
            sobre azul. El `TitleRule` se queda en su tono por defecto (`gold`,
            `#f9d78f`): es justo el que esta pensado para esto.

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
          className="relative flex w-full flex-col items-center justify-center bg-[linear-gradient(135deg,#05125a,#0079b3)] px-margin-mobile pt-[35px] pb-[76px] text-[#d0c5b4] md:min-h-[100svh] md:px-margin-desktop md:pt-[100px] md:pb-[100px]"
        >
          <div className="mx-auto max-w-3xl">
            <div className="w-fit">
              <RevealItem y={0} duration={1} id="nos-estela-title">
                {/* Dorado, no el blanco cálido por defecto — coherencia con el
                    resto de las secciones de fondo azul (pedido de Ignacio,
                    20/09): "Nuestro propósito" de la home usa este mismo
                    tratamiento, título en `primary-container` y cuerpo en el
                    tostado `#d0c5b4`. */}
                <h2 className="font-display text-headline-md font-bold text-primary-container md:text-headline-lg">
                  {t("estela.title")}
                </h2>
              </RevealItem>
              <TitleRule grow className="mt-3 mb-6" />
            </div>
            <div className="space-y-6 text-body-md leading-relaxed text-left">
              <RevealItem y={14} duration={0.8} delay={0.15}>
                <p>{t("estela.p1")}</p>
              </RevealItem>
              <RevealItem y={14} duration={0.8} delay={0.3}>
                <p>{t("estela.p2")}</p>
              </RevealItem>
              <RevealItem y={14} duration={0.8} delay={0.45}>
                <p>{t("estela.p3")}</p>
              </RevealItem>
              <RevealItem y={14} duration={0.8} delay={0.6}>
                <p>{t("estela.p4")}</p>
              </RevealItem>
            </div>
            {/* Frase final sacada a pedido de la organización (23/09, item 9
                del doc de correcciones): "no es necesario cerrar Founder con
                esta frase". Queda en docs/COPY_HUERFANO.md para evaluar su uso
                en otra sección. */}
          </div>
          {/* Sin boton de continuar: lo saco Ignacio el 15/09, igual que el
              de "Nuestro proposito". El paso al cierre queda solo por scroll.
              El padding de abajo de la seccion se deja como esta: era el hueco
              que le reservaba al boton, y sin ese aire el texto termina pegado
              al borde. */}
        </Reveal>

        <ClosingHero
          id="vision"
          image={content("nosotros.metodologia.image")}
          imageAlt={t("cierreAlt")}
          title={cierreTitle ? <CierreTitle text={cierreTitle} /> : null}
          actions={[
            { label: t("actions.explorar"), href: "/viajes" },
            { label: t("actions.profundizar"), href: "/contenidos" },
          ]}
          overlay={isEnabled(content("nosotros.metodologia.overlay"))}
        />
      </main>
      <Footer />
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
