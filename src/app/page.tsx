import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { ImmersiveHero } from "@/components/ui/ImmersiveHero";
import { ScrollStory } from "@/components/ui/ScrollStory";
import { MediaStatement } from "@/components/ui/MediaStatement";
import { CreamSection } from "@/components/ui/CreamSection";
import { TripCarousel } from "@/components/ui/TripCarousel";
import { Collapsible } from "@/components/ui/Collapsible";
import { CtaLink } from "@/components/ui/CtaLink";
import { BackgroundMedia } from "@/components/ui/BackgroundMedia";
import { Reveal, RevealItem, RevealLine } from "@/components/ui/Reveal";
import type { TripCardData } from "@/components/ui/TripCard";
import { createPublicClient } from "@/lib/supabase/public";
import { getSiteContent, isEnabled } from "@/lib/site-content";
import { getTestimonials } from "@/lib/testimonials";

/**
 * La home vuelve a consultar `trips` (la cartelera del rediseño), asi que ya no
 * puede ser prerender puro. Con ISR se sigue sirviendo desde el CDN y se
 * revalida sola una vez por hora: la clienta publica un viaje y aparece en la
 * home sin deploy, sin que cada visita pegue a Supabase.
 */
export const revalidate = 3600;

/**
 * Home según el rediseño de Julia (`HOMEPAGE.html`, ver
 * docs/REDISENO_JULIA_HTML.md §2).
 *
 * Recorrido: hero → frase manifiesto → relato que se destila con el scroll y
 * abre el calendario → frase sobre imagen → Nuestro propósito → panel doble
 * Sesiones/Viajes → Voces de Luz → Tecnología del Alma → cierre.
 *
 * Reemplaza a la home del 21/08. Lo que sale: la frase partida en dos con
 * máscara (QuoteBand), el bloque dorado "La humanidad" (HumanitySection), las
 * cuatro promesas (ImageStatements) y la banda dorada (GoldDivider) — el
 * degradé dorado ahora vive en el footer. El copy que queda sin lugar está
 * guardado en docs/COPY_HUERFANO.md.
 *
 * **Los viajes vuelven a la home**, al revés de la decisión del 20/08. Es lo que
 * pide el mockup y es el único camino al embudo de inscripción además del
 * navbar.
 *
 * Las keys de los slots se conservan aunque la sección cambie, para no perder lo
 * que la clienta ya subió: `home.frase.*` pasa a ser la frase manifiesto grande
 * y `home.promesas.image` el fondo de la frase atmosférica.
 */
export default async function Home() {
  const content = await getSiteContent();
  // Vacio = el panel dorado se queda con el degrade del manual de marca.
  const fondoViajes = content("home.viajes.image").trim();

  // Cliente sin cookies a proposito: los viajes publicados son publicos, y leer
  // `cookies()` volveria dinamica la pagina y anularia el ISR de arriba.
  const { data } = await createPublicClient()
    .from("trips")
    .select(
      "id, title, description, location, start_date, end_date, status, image_url, type"
    )
    .in("status", ["open", "closed"])
    .order("start_date", { ascending: true })
    .limit(8);

  const trips = (data ?? []) as TripCardData[];
  const testimonials = await getTestimonials("home");

  return (
    <>
      <Header />
      <main className="pt-[var(--navbar-h)]">
        <ImmersiveHero
          image={content("home.hero.image")}
          imageAlt="Figura de partículas mirando hacia el cosmos"
          scrollHint="Descubrir"
          scrollTo="manifiesto"
          height="full"
        />

        {/* Frase manifiesto: pantalla completa, tipografía grande, sin imagen.
            El degradé termina en el mismo tono con el que arranca el relato para
            que el pasaje entre las dos pantallas sea continuo. */}
        <Reveal
          as="section"
          id="manifiesto"
          amount={0.3}
          stagger={0.15}
          className="flex min-h-[100svh] w-full items-center bg-[linear-gradient(to_bottom,#0079b3_0%,#05125a_65%,#011360_100%)] px-[6vw] py-24"
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
            <h2 className="font-display text-[clamp(2.25rem,4.4vw,4rem)] leading-[1.12] text-primary md:leading-[1.2]">
              <RevealItem as="span" className="inline-block" y={40} duration={1.6}>
                {content("home.frase.left")}
              </RevealItem>
              <br />
              <RevealItem as="span" className="inline-block" y={40} duration={1.6}>
                <em className="italic text-primary-container">
                  {content("home.frase.right")}
                </em>
              </RevealItem>
            </h2>
          </div>
        </Reveal>

        {/* El texto y las cuatro frases son los de la entrega del 04/09, que es
            la version definitiva de esta pantalla. Las frases resaltadas son
            FRASES y no palabras sueltas ("potencial evolutivo", no
            "potencial"): cada una viaja entera al centro, y sueltas no
            significan nada en la lista final. */}
        <ScrollStory
          id="relato"
          paragraphs={[
            "Los seres humanos estamos en constante evolución. A medida que expandimos nuestra conciencia, comenzamos a descubrir que somos mucho más que nuestra historia personal, nuestra mente o la realidad que percibimos a través de los sentidos.",
            "Nuestro trabajo explora este potencial evolutivo y la naturaleza multidimensional de la experiencia humana: nuestra capacidad de transformarnos, de acceder a niveles más profundos de inteligencia y de reconectar con la dimensión del alma.",
            "Desde esta perspectiva, la evolución humana pasa a ser parte de un campo de conciencia mucho más amplio, abriendo un camino hacia un conocimiento más profundo, la sabiduría cósmica y una comprensión expandida de quiénes y qué somos.",
          ]}
          keywords={[
            { text: "conciencia", label: "Conciencia" },
            { text: "potencial evolutivo", label: "Potencial Evolutivo" },
            { text: "dimensión del alma", label: "Dimensión del Alma" },
            { text: "sabiduría cósmica", label: "Sabiduría Cósmica" },
          ]}
          cta={{ label: "Explorar experiencias", href: "#calendario" }}
        />

        {/* La cartelera en la home. Va sobre el mismo azul con el que termina el
            relato, para que no haya corte de color entre las dos.

            Es UNA sola vista general a todo el ancho, como pide Julia: un
            carrusel que integra sesiones y viajes (cada tarjeta con su tag).
            No son dos carruseles separados: a la sección específica de cada
            tipo se accede desde el panel o desde /viajes. El "Explorar
            experiencias" del relato ancla hasta acá. */}
        {/* La cartelera arranca CERRADA y la despliega el botón "Explorar
            experiencias" del relato (correción del 02/09 de Julia: "si el
            usuario no toca el botoncito, el calendario queda oculto"). El
            disparador está 400vh más arriba, dentro del sticky del relato, así
            que el panel no lleva botón propio: se abre por hash, que es lo que
            fija `StoryCta`.

            La sección no lleva padding vertical propio — cerrada tiene que
            medir cero, o queda una franja azul vacía en el medio de la home. El
            aire lo pone el panel cuando se abre. */}
        <section id="calendario" className="w-full bg-[#020c41]">
          <Collapsible openOnHash="calendario">
            <div className="w-full py-20">
              <TripCarousel
                caption="Calendario de viajes"
                title="Próximos Viajes"
                trips={trips}
                emptyLabel="No hay experiencias publicadas por el momento. Vuelve a visitarnos pronto."
              />
            </div>
          </Collapsible>
        </section>

        {/* Julia pidió imagen a pantalla completa con una frase encima. La key
            del slot es la de las cuatro promesas, que el rediseño elimina. */}
        <MediaStatement
          id="atmosferica"
          image={content("home.promesas.image")}
          imageAlt="Figura en meditación con un núcleo de luz dorada"
          text={content("home.atmos.text")}
          veil={0.35}
          overlay={isEnabled(content("home.promesas.overlay"))}
          height={900}
          textClassName="text-[22px] md:text-[28px]"
          // La frase va DORADA y no en el blanco cálido (pedido de Sofía,
          // 11/09). Es el token `primary-container`, el mismo oro que el resto
          // del sitio usa sobre fondo azul — no el `primary-fixed-dim` de
          // acento (regla del 28/08). El texto en sí lo carga ella desde
          // /admin/multimedia (slot `home.atmos.text`), acá sólo va el color.
          textColorClassName="text-primary-container"
          scrollIndicator={{
            label: "Nuestro propósito",
            target: "#proposito",
          }}
        />

        <Reveal
          as="section"
          id="proposito"
          amount={0.3}
          stagger={0}
          className="relative flex min-h-[100svh] w-full flex-col items-center justify-center bg-[linear-gradient(180deg,#0a1660_0%,#05125a_55%,#030b38_100%)] px-6 pb-[90px] pt-[100px] text-center md:pb-[120px] md:pt-[140px]"
        >
          {/* Umbral 0.3. El titulo y la linea van juntos en 1.6s; la linea
              crece de 0 a 70px en ese mismo tiempo (en la home SI crece, en
              /viajes es estatica). El cuerpo todavia entra como un bloque: el
              efecto real es palabra por palabra, agrupadas por renglon, y esta
              pendiente como paso aparte. */}
          <div className="mx-auto w-full max-w-3xl">
            <RevealItem y={30} duration={1.6}>
              <h2 className="font-display text-[34px] font-bold tracking-[0.5px] text-primary-container md:text-[56px]">
                Nuestro propósito
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
            <RevealItem y={30} duration={0.9} delay={0.45}>
            <p className="mx-auto mt-[30px] max-w-[640px] text-[16px] leading-[1.8] tracking-[0.3px] text-[#d0c5b4] md:mt-[50px] md:text-[20px] md:leading-[1.9]">
              Acompañamos procesos de transformación interior y expansión de
              conciencia.{" "}
              <span className="text-primary-container">
                Creamos espacios para que las personas reconecten con su luz
                interior
              </span>{" "}
              y trasciendan patrones limitantes, en cualquier etapa de su
              evolución.
            </p>
            </RevealItem>
            <RevealItem y={30} duration={0.9} delay={0.75}>
              <CtaLink
                href="/nosotros"
                className="mt-[50px] px-7 py-3.5 text-[14px] md:mt-20 md:px-10 md:py-4"
              >
                Ir más profundo
              </CtaLink>
            </RevealItem>
          </div>
        </Reveal>

        {/* Panel doble: Sesiones (azul) y Viajes (dorado), LADO A LADO en
            escritorio y apilados en mobile, con el contenido centrado. Pedido de
            Sofía (07/09): apilados en dos bandas horizontales y con el texto
            pegado a la izquierda le quedaba desbalanceado.

            **OJO, esto revierte una decisión de Julia**: su spec del 1/9
            (`.sesiones-viajes`) los apila a propósito, y el lado a lado ya se
            había probado y descartado. Si vuelve a pedir lo apilado, se saca el
            `md:grid-cols-2` del `Reveal` y se devuelve el texto a la izquierda.

            **Un solo observador para los dos paneles** (umbral 0.25), no uno por
            panel: en el mockup las dos cascadas arrancan juntas. Por eso el
            `Reveal` ES la seccion. La cascada no es pareja — titulo y linea
            entran los dos en 0ms — asi que va `stagger={0}` y el escalon lo pone
            cada item con su `delay`.

            **Los dos botones son el mismo tipo** (`.sv-btn` del mockup): pildora
            con borde 1.5px del color del texto, fondo translucido del color del
            panel y glow propio en hover. Solo cambia el tono de cada panel. */}
        <Reveal
          id="experiencias"
          amount={0.25}
          stagger={0}
          className="grid w-full md:grid-cols-2"
        >
          <div className="flex w-full items-center justify-center bg-[linear-gradient(135deg,#0079b3,#05125a)] px-6 py-[60px] text-center text-primary-container md:min-h-[60svh] md:px-12 md:py-20">
            <div className="max-w-[460px]">
              <RevealItem duration={0.8}>
                <h2 className="mb-3 font-display text-[34px] leading-tight">
                  Sesiones Cósmicas
                </h2>
              </RevealItem>
              {/* Mismo filete que "Nuestro propósito" (pedido de Sofía,
                  12/09): 1px que se desvanece en las puntas, en vez del oro
                  sólido corto. Más corta que la de esa sección porque el
                  bloque acá mide 460px de ancho, no 640. */}
              <RevealLine className="mx-auto mb-[18px] h-px w-[100px] bg-[linear-gradient(to_right,transparent_0%,var(--color-primary-container)_50%,transparent_100%)] md:w-[120px]" />
              <RevealItem duration={0.8} delay={0.15}>
                <p className="mb-[18px] text-[15px] opacity-85">
                  Un espacio para ir más profundo
                </p>
              </RevealItem>
              <RevealItem duration={0.8} delay={0.3}>
                <p className="mb-[22px] text-[14px] leading-[1.6] opacity-90">
                  Nuestras sesiones de un día están diseñadas para sostener un
                  trabajo interior profundo y la conexión con la dimensión del
                  alma.
                </p>
              </RevealItem>
              <RevealItem duration={0.8} delay={0.45}>
                <CtaLink
                  href="/viajes#sesiones"
                  className="px-7 py-[11px] text-[13px]"
                >
                  Explorar próximas sesiones
                </CtaLink>
              </RevealItem>
            </div>
          </div>

          {/* El "Fondo 4" del manual de marca, que es un degrade liso y no una
              textura: medido sobre el PNG, va de `#b3964b` (arriba a la
              izquierda) a `#f9d78f` (abajo a la derecha), o sea los dos
              extremos del oro de la paleta. Va en CSS y el archivo no se
              guarda — misma decision que el navbar, el footer y "La humanidad"
              (20/08): un degrade en PNG pesa, se pixela al escalar y banda en
              pantallas grandes.

              El degrade anterior remataba en `#6b551f` en las dos puntas, que
              le daba unas esquinas sucias que el fondo del manual no tiene.

              Encima puede ir una foto, si la clienta carga el slot. */}
          <div className="relative flex w-full items-center justify-center overflow-hidden bg-[linear-gradient(to_bottom_right,#b3964b_0%,#f9d78f_100%)] px-6 py-[60px] text-center text-[#05125a] md:min-h-[60svh] md:px-12 md:py-20">
            {fondoViajes && (
              /* z-0 y contenido en z-10, nunca un z negativo: el `body` pinta su
                 degrade despues de los descendientes de z negativo del contexto
                 raiz y taparia la imagen (trampa del 20/08). */
              <div className="absolute inset-0 z-0">
                <BackgroundMedia src={fondoViajes} />
              </div>
            )}
            <div className="relative z-10 max-w-[460px]">
              <RevealItem duration={0.8}>
                <h2 className="mb-3 font-display text-[34px] leading-tight">
                  Viajes Cósmicos
                </h2>
              </RevealItem>
              {/* El mismo filete que el panel de Sesiones, en el azul del
                  panel dorado. */}
              <RevealLine className="mx-auto mb-[18px] h-px w-[100px] bg-[linear-gradient(to_right,transparent_0%,#05125a_50%,transparent_100%)] md:w-[120px]" />
              <RevealItem duration={0.8} delay={0.15}>
                <p className="mb-[18px] text-[15px] opacity-85">
                  Un espacio para ir más profundo
                </p>
              </RevealItem>
              <RevealItem duration={0.8} delay={0.3}>
                <p className="mb-[22px] text-[14px] leading-[1.6] opacity-90">
                  Experiencias de una semana en portales sagrados alrededor del
                  mundo, para quienes están listos para un proceso más profundo.
                </p>
              </RevealItem>
              <RevealItem duration={0.8} delay={0.45}>
                <CtaLink
                  href="/viajes#viajes"
                  tone="dark"
                  className="px-7 py-[11px] text-[13px]"
                >
                  Ir más allá
                </CtaLink>
              </RevealItem>
            </div>
          </div>
        </Reveal>

        <TestimonialsSection
          id="voces"
          testimonials={testimonials}
          image={content("home.voces.image")}
        />

        {/* Tecnología del Alma: la puerta a /contenidos. */}
        {/* Tecnología del Alma: la puerta a /contenidos.

            Umbral 0.25 y un solo observador para texto e imagen: en el mockup
            entran juntos. Titulo, linea e imagen a 0ms; los tres parrafos a
            150/300/450 y el boton a 600. La imagen ademas escala desde 0.98. */}
        {/* En mobile la sección tiene que entrar en UNA pantalla, con el texto
            centrado en vertical (fix v3 de Julia, docs/entregas/2026-09-03-julia).
            En escritorio no cambia nada: sigue siendo el par texto/imagen. */}
        {/* El fondo de ESTA franja no es el crema del sitio: es la banda
            dorada, el mismo degrade `#f9d78f → #b3964b` de la pildora y del
            cierre de la home. Lo eligio Sofia el 11/09 sobre un comparador de
            ocho fondos ("el crema no, que vaya mas hacia el golden"). Va por la
            prop `background` y NO por `className`: dos utilidades de fondo de la
            misma especificidad las resuelve el orden de la hoja generada.

            **Es la unica franja clara del sitio con este fondo.** El resto
            (/nosotros, /viajes, el detalle, /contenidos, /faqs y las legales)
            sigue con el crema — cambiarlo aca fue un pedido puntual, no un
            cambio de sistema.

            Sobre el dorado hay dos piezas que dejan de verse y por eso cambian
            con el: el filete pasa al oro oscuro (el claro da 1,00:1 sobre este
            fondo, o sea invisible) y el boton pasa a la pildora azul, porque la
            dorada se funde. */}
        <CreamSection
          id="tecnologia"
          background="bg-[linear-gradient(135deg,#f9d78f,#b3964b)]"
          full={false}
          className="max-md:flex max-md:min-h-[100svh] max-md:items-center"
          reveal={{ amount: 0.25, stagger: 0 }}
        >
          <div className="mx-auto flex w-full max-w-narrative flex-col items-center gap-12 md:flex-row md:gap-16">
            <div className="w-full md:flex-1">
              <RevealItem duration={0.8}>
                {/* El quiebre en dos renglones es fijo, no un wrap por ancho:
                    es decisión de diseño de la v2 del fix. */}
                <h2 className="mb-3.5 font-display text-[clamp(24px,7vw,30px)] font-bold leading-tight text-[#05125a] md:mb-3 md:text-[40px]">
                  Tecnología Humana y<br />
                  Ciencia del Alma
                </h2>
              </RevealItem>
              {/* Oro oscuro y no el claro: sobre el fondo dorado el filete
                  claro da 1,00:1 y no se ve. */}
              <RevealLine className="mb-5 h-px w-20 bg-[#b3964b] md:mb-6 md:w-16" />
              {/* El cuerpo va AZUL, no negro. Hasta el 11/09 era negro puro en
                  mobile y gris #333 en escritorio, que era spec explícita de
                  Julia (fix v3 del 03/09); lo cambió Sofía, que lo veía negro.
                  Sobre la banda dorada el azul mide 5,95:1 en el punto más
                  oscuro del degradé contra los 4,44:1 del gris, que estaba
                  abajo del mínimo legible. **Es sólo acá**: el resto del sitio
                  sigue con el gris. Conviene avisarle a Julia. */}
              <div className="space-y-5 text-[clamp(13px,3.6vw,15px)] leading-[1.8] text-[#05125a] md:max-w-[480px] md:space-y-6 md:text-[16px]">
                <RevealItem duration={0.8} delay={0.15}>
                  <p>
                    A medida que expandimos nuestra conciencia, emergen nuevas
                    capacidades de percepción, intuición y sanación.
                  </p>
                </RevealItem>
                <RevealItem duration={0.8} delay={0.3}>
                  <p>
                    Esta exploración nos conecta con conocimiento ancestral y
                    cósmico, permitiéndonos integrar una comprensión más profunda
                    de quiénes somos en nuestra vida cotidiana: en nuestro cuerpo,
                    relaciones y propósito.
                  </p>
                </RevealItem>
                <RevealItem duration={0.8} delay={0.45}>
                  <p>
                    Aquí reunimos ideas, marcos y recursos para acompañar ese
                    proceso de expansión y evolución.
                  </p>
                </RevealItem>
              </div>
              <RevealItem duration={0.8} delay={0.6}>
                {/* El MISMO boton que el "Ir mas profundo" de "Nuestro
                    proposito" (pedido de Ignacio, 11/09: coherencia de pagina):
                    la variante `outline` que eligio Sofia el 09/09, con su
                    mismo padding y cuerpo. Lo unico que cambia es el color, que
                    en `outline` lo pone quien lo usa y arrastra el contorno
                    (`border-current`): alla va dorado sobre azul, aca azul
                    sobre el fondo dorado. Antes era la pildora dorada, que
                    sobre este fondo se fundia. */}
                <CtaLink
                  href="/contenidos"
                  tone="dark"
                  className="mt-10 px-7 py-3.5 text-[14px] md:px-10 md:py-4"
                >
                  Ir más profundo
                </CtaLink>
              </RevealItem>
            </div>

            {/* En mobile la imagen se oculta ENTERA y queda solo el texto
                (`.tec-image` es `display:none` abajo de 768px en el mockup).
                Antes se apilaba arriba del texto. */}
            <RevealItem className="hidden w-full flex-1 md:block" y={0} duration={1} scaleFrom={0.98}>
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl md:aspect-[4/4.4]">
                {/* `object-top` y no centrado, por lo mismo que el hero de la
                    home (20/08): la caja (4/4.4 = 0,909) es mas apaisada que la
                    figura (900x1195 = 0,753), asi que `cover` escala por el
                    ancho y le sobra alto. Centrado recorta 8,6% arriba y 8,6%
                    abajo, y la cabeza empieza al 9% de la imagen — se la comia
                    siempre. Anclada arriba, todo el recorte cae en el pie,
                    donde la figura ya se deshace en particulas. */}
                <Image
                  src={content("home.tecnologia.image")}
                  alt="Portal de luz"
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover object-top"
                />
              </div>
            </RevealItem>
          </div>
        </CreamSection>

        <MediaStatement
          image={content("home.cierre.image")}
          imageAlt="Amanecer sobre el horizonte"
          text="Un viaje hacia el Humano Luminoso"
          veil={0.3}
          overlay={isEnabled(content("home.cierre.overlay"))}
          height={600}
          textClassName="text-[22px] md:text-[32px]"
        />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
