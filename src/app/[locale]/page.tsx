import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ImmersiveHero } from "@/components/ui/ImmersiveHero";
import { ScrollStory } from "@/components/ui/ScrollStory";
import { MediaStatement } from "@/components/ui/MediaStatement";
import { CtaLink } from "@/components/ui/CtaLink";
import { Reveal, RevealItem, RevealLine } from "@/components/ui/Reveal";
import { TitleRule } from "@/components/ui/TitleRule";
import { FaqList } from "@/components/ui/FaqList";
import { getHomeFaqs } from "@/lib/home-faqs";
import { getSiteContent, isEnabled } from "@/lib/site-content";
import { getTranslations, setRequestLocale } from "next-intl/server";

/**
 * Home según el rediseño de Julia (`HOMEPAGE.html`, ver
 * docs/REDISENO_JULIA_HTML.md §2), simplificada por pedido de la
 * organización (23/09, `docs/entregas/2026-09-23-feedback-org/`): el home
 * público deja de mostrar la cartelera, el panel Sesiones/Viajes y los
 * testimonios — esa profundidad queda en /viajes. Ver
 * `docs/ARQUITECTURA_ACCESO_PUBLICO.md`.
 *
 * Recorrido: hero → frase manifiesto → relato que se destila con el scroll →
 * frase sobre imagen → Nuestro propósito → Contenidos → cierre.
 *
 * Las keys de los slots se conservan aunque la sección cambie, para no perder lo
 * que la clienta ya subió: `home.frase.*` pasa a ser la frase manifiesto grande
 * y `home.promesas.image` el fondo de la frase atmosférica.
 */
export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const content = await getSiteContent(locale);

  return (
    <>
      <Header />
      {/* `snap-bands` NO es una utilidad de Tailwind: es la marca que hace que
          en MOBILE cada hijo directo del `main` sea una banda con su punto de
          enganche del scroll, y que el scroll se enganche a ellas (la regla
          vive en globals.css, buscar "snap-bands"). Es el pedido de Sofia del
          16/09: en el telefono una pantalla tiene que mostrar UN fondo, no la
          cola del azul + el azul del panel + el arranque del dorado.

          Va sobre el `main` y no sobre `html` para que sea de ESTA pagina: el
          resto del sitio no cambia de comportamiento. */}
      <main className="snap-bands pt-[var(--navbar-h)]">
        {/* **Sin indicador de scroll** (pedido de Ignacio, 16/09): el hero se
            queda con la imagen sola, sin el "Descubrir" con la flechita. Es el
            mismo criterio con el que el 15/09 se le saco el indicador a la
            frase atmosferica. El `id="manifiesto"` de la seccion de abajo NO se
            borra: lo usa el recorrido de capturas. */}
        <ImmersiveHero
          image={content("home.hero.image")}
          imageAlt={t("heroAlt")}
          height="full"
          // Pedido de la organización, 23/09: "mucho más lento... la sensación
          // general debe ser lenta, profunda, elegante y contemplativa". A la
          // mitad de velocidad, sin recortar el clip.
          videoRate={0.5}
        />

        {/* Frase manifiesto: pantalla completa, tipografía grande, sin imagen.
            El degradé termina en el mismo tono con el que arranca el relato para
            que el pasaje entre las dos pantallas sea continuo. */}
        <Reveal
          as="section"
          id="manifiesto"
          amount={0.3}
          stagger={0.15}
          // Pedido de la organización, 23/09: "queda demasiado espacio azul
          // entre el título principal y el texto que viene debajo" — bajamos
          // el padding de 24 a 12, pero con `items-center` la frase sigue
          // centrada en su propia pantalla y la mitad de abajo queda vacía
          // igual. Ignacio insiste el 24/09 ("sigo viendo mucha distancia"):
          // `items-end` acerca la frase al borde de ABAJO en vez de sólo
          // recortar el padding, que es lo que realmente conecta con el
          // relato. El resto de la pantalla, arriba, se queda con el aire que
          // tenía — la frase entra igual de "pantalla completa", sólo que
          // apoyada contra el piso en vez de flotando en el medio.
          //
          // Ese `min-h-[100svh]` + `items-end` en un telefono alto deja el
          // hueco vacio ARRIBA en vez de abajo (reporte de Ignacio, 24/09,
          // captura mobile: "todo el espacio que sobra"). En mobile la
          // seccion no necesita ocupar la pantalla entera — eso era para que
          // la frase "entrara pantalla completa" en desktop — asi que ahi se
          // centra sobre su propio contenido con padding parejo.
          //
          // `pb-2` en mobile (antes `py-20` parejo, 80px abajo; despues `pb-8`,
          // 32px): dos capturas de la organizacion el 25/09 ("fix.png" y
          // "asd.jpeg", en docs/entregas/) — con `pb-8` el hueco entre la
          // frase y "Los seres humanos..." todavia se leia como "todo el
          // espacio que sobra". Achicar SOLO el padding de abajo achica el
          // salto sin tocar el aire de arriba, que es el que centra la frase.
          //
          // El `md:min-h-[100svh]` que forzaba pantalla completa en desktop se
          // saca el 27/09: tres rondas de retoque de padding (23, 24 y 25/09)
          // no alcanzaron porque el problema no era el padding, era el alto
          // forzado dejando aire arriba. Mismo criterio que ya se aplico en
          // mobile: la seccion se ajusta a su contenido.
          //
          // Sin el `min-h-[100svh]`, `md:pt-12` (el valor del 23/09, pensado
          // para una pantalla completa) se quedaba corto: la frase quedaba
          // pegada al borde de arriba. Sube a `md:pt-16`, sin volver al
          // `pt-24` original (27/09).
          className="flex w-full items-center bg-[linear-gradient(to_bottom,#0079b3_0%,#05125a_65%,#011360_100%)] px-[6vw] pt-32 pb-2 md:items-end md:pt-40 md:pb-6"
        >
          {/* Las dos lineas entran por separado, la segunda 0.15s despues:
              es el `transition-delay` que Julia le pone al `.line-reveal` que
              sigue. Van de 40px y en 1.6s, mas lento que el resto del sitio. */}
          {/* El ancho de la caja y el tope de la escala van juntos: la
              corrección del 03/09 pide que en escritorio la frase entre en DOS
              líneas (una por mitad), y con el `clamp` anterior (9vw, tope 5rem)
              cada mitad envolvía sola. La medida del texto crece con el
              viewport igual que la caja — por eso el tamaño es sobre todo `vw`
              y el tope está calculado contra los 80rem de la caja, no elegido a
              ojo: 4rem × ~34 caracteres queda debajo de 1280px. */}
          <div className="mx-auto w-full max-w-[80rem]">
            {/* Los colores van en este orden y no al reves: en el mockup
                (`.about-statement`) la PRIMERA linea es crema y la segunda
                dorada en italica. Estaban invertidos y es la correccion del
                02/09 de Julia. */}
            {/* El `1.04` del mockup esta calculado para un cuerpo de 80px; nosotros
                bajamos la escala a 64 para que cada mitad entre en UNA linea
                (correccion del 03/09), y el interlineado se encogio con ella:
                quedaban 2,5px de aire entre las dos frases, medidos. En
                escritorio cada mitad es una sola linea, asi que este valor no
                controla nada mas que el hueco entre las dos — de 2,5px a 13.
                Es una desviacion del mockup, avisada. */}
            {/* `text-h1` (token de globals.css, 24/09): es la frase que
                Sofia marcó como el h1 de la página al definir el sistema de
                escala. Mismo tamaño que tenía en duro, ahora nombrado. */}
            <h1 className="font-display text-h1 text-center text-primary">
              <RevealItem as="span" className="inline-block" y={40} duration={1.6}>
                {content("home.frase.left")}
              </RevealItem>
              <br />
              <RevealItem as="span" className="inline-block" y={40} duration={1.6}>
                <em className="italic text-primary-container">
                  {content("home.frase.right")}
                </em>
              </RevealItem>
            </h1>
          </div>
        </Reveal>

        {/* Tres momentos (Sofía, 06/10): los párrafos, sólo las frases clave
            en su lugar, y los párrafos de vuelta juntos con el botón. Las
            frases resaltadas son FRASES y no palabras sueltas ("potencial
            evolutivo", no "potencial"): en el segundo momento quedan solas en
            pantalla y sueltas no significarían nada. */}
        <ScrollStory
          id="relato"
          paragraphs={t.raw("relato.paragraphs") as string[]}
          // Pedido de la organizacion (25/09): las 5 palabras clave pasan a
          // ser Conciencia / Potencial evolutivo / Dimensión del alma /
          // Conocimiento profundo / Sabiduría cósmica. El `text` de cada una
          // tiene que aparecer LITERAL dentro del párrafo (ver `splitStory`
          // más abajo en `ScrollStory.tsx`), por eso el párrafo de arriba
          // perdió el "más" ("un conocimiento profundo", no "un conocimiento
          // más profundo"). En inglés se revisó el mismo literal.
          keywords={(t.raw("relato.keywords") as string[]).map((text) => ({
            text,
          }))}
          // El calendario y la cartelera de home se sacaron (pedido de la
          // organización, 23/09: "sacar del home público sesiones, viajes,
          // calendario y testimonios"). El CTA pasa a llevar directo a
          // Experiencias.
          cta={{ label: t("relato.cta"), href: "/viajes" }}
        />

        <Reveal
          as="section"
          id="proposito"
          amount={0.3}
          stagger={0}
          className="relative flex min-h-[100svh] w-full flex-col items-center justify-center bg-[linear-gradient(180deg,#0a1660_0%,#05125a_55%,#030b38_100%)] px-6 pb-[150px] pt-[48px] text-center md:pb-[120px] md:pt-[140px]"
        >
          {/* Mobile (Sofía, 06/10): el bloque sube —el `justify-center` lo
              centraba en la pantalla y quedaba bajo— cargando el padding abajo
              en vez de arriba, y el cuerpo crece a 18px para que llene mejor el
              ancho del teléfono. */}
          {/* Umbral 0.3. El titulo y la linea van juntos en 1.6s; la linea
              crece de 0 a 70px en ese mismo tiempo (en la home SI crece, en
              /viajes es estatica). El cuerpo todavia entra como un bloque: el
              efecto real es palabra por palabra, agrupadas por renglon, y esta
              pendiente como paso aparte. */}
          <div className="mx-auto w-full max-w-3xl">
            <RevealItem y={30} duration={1.6}>
              {/* `text-h2`: mismo tamaño que tenía en duro (34px/56px),
                  ahora nombrado en el token de globals.css. */}
              {/* "PROPÓSITO" a secas y en mayúscula (Sofía, 06/10): el
                  párrafo de abajo arranca con "Nuestro propósito es...", y el
                  título lo repetía. */}
              <h2 className="font-display text-h2 font-bold uppercase tracking-[0.5px] text-primary-container">
                {t("purpose.title")}
              </h2>
            </RevealItem>
            {/* Filete fino que se desvanece en las puntas (pedido de Sofia,
                12/09): el oro solido de 70px se leia como un subrayado corto.
                Va mas larga y con degrade a transparente en los dos extremos,
                asi que el 1px de alto se percibe todavia mas delgado. El oro
                pleno queda en el centro. `RevealLine` la sigue haciendo crecer
                desde la izquierda, como todas las lineas del sitio. */}
            <RevealLine
              duration={1.6}
              className="mx-auto mt-4 h-px w-[120px] bg-[linear-gradient(to_right,transparent_0%,var(--color-primary-container)_50%,transparent_100%)] md:mt-5 md:w-[160px]"
            />
            {/* Texto reemplazado a pedido de la organización (23/09): tiene
                que declarar PARA QUÉ existe Cosmic Eagle Journey, no describir
                solamente lo que hace. Mismo copy que /nosotros. */}
            <RevealItem y={30} duration={0.9} delay={0.45}>
            {/* Pedido de Sofia (24/09): resaltar SOLO estas 4 palabras
                sueltas — evolución, transformar, conciencia, alma — y nada
                más. Antes se resaltaba la frase entera "impulsar la
                evolución... expandir su conciencia", que era mucho más que
                lo que pidió. */}
            <p className="mx-auto mt-[30px] max-w-[640px] text-[18px] leading-[1.75] tracking-[0.3px] text-[#d0c5b4] md:mt-[50px] md:text-[20px] md:leading-[1.9]">
              {t.rich("purpose.body", {
                gold: (chunks) => (
                  <span className="text-primary-container">{chunks}</span>
                ),
              })}
            </p>
            </RevealItem>
            <RevealItem y={30} duration={0.9} delay={0.75}>
              <CtaLink
                href="/nosotros"
                className="mt-[50px] px-7 py-3.5 text-[14px] md:mt-20 md:px-10 md:py-4"
              >
                {t("purpose.cta")}
              </CtaLink>
            </RevealItem>
          </div>
        </Reveal>

        {/* El panel Sesiones/Viajes y los testimonios de "Voces de Luz" se
            sacaron del home público a pedido de la organización (23/09):
            siguen existiendo en /viajes, no en la puerta de entrada. Ver
            `docs/ARQUITECTURA_ACCESO_PUBLICO.md`. */}

        {/* Correcciones web del 17/11 (4.1): el home queda en apertura →
            "Explorar experiencias" → presentación con "Ir más profundo" →
            preguntas frecuentes. Se sacaron la frase atmosférica y la franja
            de Contenidos (Contenidos pide cuenta y pasa a /nosotros). Las keys
            de slots `home.promesas.*` y `home.tecnologia.image` se conservan. */}

        {/* Preguntas frecuentes de la home (entrega del 28/09, texto fijo en
            `src/lib/home-faqs.ts`). Van DESPUÉS de todo lo que presenta el
            trabajo y ANTES del cierre: son las dudas que quedan una vez que
            se leyó qué es y para qué existe, y la última pregunta ("¿Cómo
            puedo saber más?") desemboca en la frase "Cuando el alma está
            lista, el camino aparece". El cierre sigue siendo lo último de la
            página (pedido del 23/09: nada después de él).

            Fondo azul, el mismo degradé de "Nuestro propósito": viene de la
            banda dorada de Contenidos y va a la imagen del cierre, así que
            alterna igual que el resto de la página.

            Se revela SÓLO el encabezado (umbral sobre algo de alto fijo): la
            sección entera, con respuestas abiertas, puede pasar varias
            pantallas y un umbral sobre ella no dispararía nunca. */}
        <section
          id="preguntas"
          className="w-full bg-[linear-gradient(180deg,#0a1660_0%,#05125a_55%,#030b38_100%)] px-6 py-24 md:py-32"
        >
          <div className="mx-auto w-full max-w-3xl">
            <Reveal amount={0.3} stagger={0} className="text-center">
              <RevealItem y={30} duration={1.2}>
                <h2 className="font-display text-h2 font-bold text-primary-container">
                  {t("faqs.title")}
                </h2>
              </RevealItem>
              {/* El ancho va en el envoltorio: `TitleRule` ya trae `w-full` y
                  un `w-[160px]` por className perdería contra él. */}
              <div className="mx-auto mt-4 w-[120px] md:mt-5 md:w-[160px]">
                <TitleRule tone="gold" align="center" grow />
              </div>
              <RevealItem y={30} duration={0.9} delay={0.3}>
                <p className="mx-auto mt-6 max-w-[560px] text-[16px] leading-[1.8] text-primary-container md:mt-8 md:text-[18px]">
                  {t("faqs.intro")}
                </p>
              </RevealItem>
            </Reveal>

            <div className="mt-12 md:mt-16">
              <FaqList faqs={getHomeFaqs(locale)} tone="dark" />
            </div>
          </div>
        </section>

        <MediaStatement
          image={content("home.cierre.image")}
          imageAlt={t("cierreAlt")}
          // Sin anclar, el recorte de `object-cover` depende del aspect
          // ratio de la pantalla de quien mira: en algunas la cabeza del
          // personaje cae bajo el texto centrado y en otras no (reporte de
          // Ignacio, 24/09: se veía bien en su pantalla y mal en la de
          // Sofía). `object-top` fija el mismo encuadre en cualquier ancho.
          imagePosition="object-top"
          // Frase de cierre pedida por la organización, 23/09: "un cierre
          // limpio, simple y contemplativo, sin agregar más información
          // después".
          // `<br/>` a mano (pedido de Ignacio, 25/09): `text-balance` dejaba
          // "lista" sola en su propio renglón. El corte fijo separa la
          // condición de la consecuencia, que es como se lee la frase.
          // `width="wide"` porque con el `max-w-2xl` de por defecto la
          // primera mitad ("Cuando el alma está lista,") todavía no entraba
          // en un solo renglón a este tamaño de fuente.
          text={t.rich("cierre", { br: () => <br /> })}
          width="wide"
          veil={0.3}
          overlay={isEnabled(content("home.cierre.overlay"))}
          // Pedido de Sofia (24/09): agrandar la frase y que ocupe 1 pantalla
          // completa. Antes era 600px fijos (`mobileFull` para tapar el
          // hueco solo en mobile); sin `height` el componente cae en su
          // default `min-h-[100svh]`, pantalla completa en cualquier ancho.
          textClassName="text-h2"
          // Dorada, no el blanco cálido por defecto — Sofía la marcó el 20/09
          // como la frase que quedó afuera de la coherencia que ya tiene
          // "Atmosférica" (pedido del 11/09, misma regla: `primary-container`
          // y no `primary-fixed-dim`, ver ese comentario más arriba).
          textColorClassName="text-primary-container"
          // Pedido de Ignacio (24/09, con captura): centrada a secas la frase
          // caía justo sobre la cara del personaje. La baja un poco sin
          // perder el centrado horizontal.
          offsetClassName="mt-20 md:mt-28"
        />
      </main>
      <Footer />
    </>
  );
}
