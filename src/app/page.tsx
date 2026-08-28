import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { ImmersiveHero } from "@/components/ui/ImmersiveHero";
import { ScrollStory } from "@/components/ui/ScrollStory";
import { MediaStatement } from "@/components/ui/MediaStatement";
import { CreamSection } from "@/components/ui/CreamSection";
import { Collapsible } from "@/components/ui/Collapsible";
import { TripCarousel } from "@/components/ui/TripCarousel";
import { CtaLink } from "@/components/ui/CtaLink";
import { Reveal, RevealItem, RevealLine } from "@/components/ui/Reveal";
import type { TripCardData } from "@/components/ui/TripCard";
import { createPublicClient } from "@/lib/supabase/public";
import { getSiteContent } from "@/lib/site-content";
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
      <main className="pt-16 lg:pt-21">
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
          <div className="mx-auto w-full max-w-[75rem]">
            <h2 className="font-display text-[clamp(3rem,9vw,7rem)] leading-[1.04] text-primary-container">
              <RevealItem as="span" className="inline-block" y={40} duration={1.6}>
                {content("home.frase.left")}
              </RevealItem>
              <br />
              <RevealItem as="span" className="inline-block" y={40} duration={1.6}>
                <em className="not-italic text-primary">
                  {content("home.frase.right")}
                </em>
              </RevealItem>
            </h2>
          </div>
        </Reveal>

        <ScrollStory
          id="relato"
          paragraphs={[
            "A medida que expandimos nuestra conciencia, comenzamos a descubrir que somos mucho más que nuestra historia personal, nuestra mente o la realidad que percibimos a través de los sentidos.",
            "Nuestro trabajo explora este potencial evolutivo y la naturaleza multidimensional de la experiencia humana: nuestra capacidad de transformarnos, de acceder a niveles más profundos de inteligencia y de reconectar con la dimensión del alma.",
            "Desde esta perspectiva, la evolución humana pasa a ser parte de un campo de conciencia mucho más amplio, abriendo un camino hacia un conocimiento más profundo, la sabiduría cósmica y una comprensión expandida de quiénes y qué somos.",
          ]}
          keywords={["conciencia", "potencial", "dimensión", "evolución"]}
          cta={{ label: "Explorar experiencias", href: "/viajes" }}
        />

        {/* El calendario en la home. Va sobre el mismo azul con el que termina
            el relato, para que no haya corte de color entre las dos. */}
        <section className="w-full bg-[#020c41] px-margin-mobile py-20 md:px-margin-desktop">
          <div className="mx-auto max-w-narrative text-center">
            <Collapsible label="Ver próximas fechas" defaultOpen tone="dark">
              <TripCarousel
                caption="Calendario de experiencias"
                title="Próximos Viajes"
                trips={trips}
                emptyLabel="No hay experiencias publicadas por el momento. Volvé a visitarnos pronto."
              />
            </Collapsible>
          </div>
        </section>

        {/* Julia pidió imagen a pantalla completa con una frase encima. La key
            del slot es la de las cuatro promesas, que el rediseño elimina. */}
        <MediaStatement
          image={content("home.promesas.image")}
          imageAlt="Figura en meditación con un núcleo de luz dorada"
          text={content("home.atmos.text")}
          veil={0.35}
        />

        <Reveal
          as="section"
          id="proposito"
          amount={0.3}
          stagger={0}
          className="flex min-h-[100svh] w-full flex-col items-center justify-center bg-[linear-gradient(180deg,#0a1660_0%,#05125a_55%,#030b38_100%)] px-margin-mobile py-24 text-center md:px-margin-desktop"
        >
          {/* Umbral 0.3. El titulo y la linea van juntos en 1.6s; la linea
              crece de 0 a 70px en ese mismo tiempo (en la home SI crece, en
              /viajes es estatica). El cuerpo todavia entra como un bloque: el
              efecto real es palabra por palabra, agrupadas por renglon, y esta
              pendiente como paso aparte. */}
          <div className="mx-auto max-w-2xl">
            <RevealItem y={30} duration={1.6}>
              <h2 className="font-display text-headline-lg font-bold text-primary-container md:text-display-lg">
                Nuestro propósito
              </h2>
            </RevealItem>
            <RevealLine
              duration={1.6}
              className="mx-auto mt-5 h-0.5 w-[70px] bg-primary-container"
            />
            <RevealItem y={30} duration={0.9} delay={0.45}>
            <p className="mt-12 text-body-lg leading-loose text-[#d0c5b4]">
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
              <CtaLink href="/nosotros" className="mt-14 rounded-full">
                Ir más profundo
              </CtaLink>
            </RevealItem>
          </div>
        </Reveal>

        {/* Panel doble: una mitad azul (Sesiones) y otra dorada (Viajes). En
            mobile se apilan, que es lo que hace el mockup.

            **Un solo observador para las dos mitades** (umbral 0.25), no uno
            por mitad: en el mockup las dos cascadas arrancan juntas. Por eso el
            `Reveal` ES la seccion. La cascada no es pareja — titulo y linea
            entran los dos en 0ms — asi que va `stagger={0}` y el escalon lo
            pone cada item con su `delay`. */}
        <Reveal
          id="experiencias"
          amount={0.25}
          stagger={0}
          className="grid w-full md:grid-cols-2"
        >
          <div className="flex min-h-[28rem] items-center bg-[linear-gradient(135deg,#0079b3,#05125a)] px-margin-mobile py-16 text-primary-container md:px-14">
            <div className="max-w-md">
              <RevealItem duration={0.8}>
                <h2 className="font-display text-headline-md">
                  Sesiones Cósmicas
                </h2>
              </RevealItem>
              <RevealLine className="mt-3 mb-5 h-0.5 w-14 bg-primary-container" />
              <RevealItem duration={0.8} delay={0.15}>
                <p className="mb-4 text-body-md opacity-85">
                  Un espacio para ir más profundo
                </p>
              </RevealItem>
              <RevealItem duration={0.8} delay={0.3}>
                <p className="mb-6 text-body-md leading-relaxed opacity-90">
                  Nuestras sesiones de un día están diseñadas para sostener un
                  trabajo interior profundo y la conexión con la dimensión del
                  alma.
                </p>
              </RevealItem>
              <RevealItem duration={0.8} delay={0.45}>
                <CtaLink
                  href="/viajes#sesiones"
                  variant="ghost"
                  className="rounded-full"
                >
                  Explorar próximas sesiones
                </CtaLink>
              </RevealItem>
            </div>
          </div>

          <div className="flex min-h-[28rem] items-center bg-[linear-gradient(to_bottom_right,#6b551f_0%,#b3964b_22%,#f9d78f_50%,#b3964b_78%,#6b551f_100%)] px-margin-mobile py-16 text-[#05125a] md:px-14">
            <div className="max-w-md">
              <RevealItem duration={0.8}>
                <h2 className="font-display text-headline-md">
                  Viajes Cósmicos
                </h2>
              </RevealItem>
              <RevealLine className="mt-3 mb-5 h-0.5 w-14 bg-[#05125a]" />
              <RevealItem duration={0.8} delay={0.15}>
                <p className="mb-4 text-body-md opacity-85">
                  Un espacio para ir más profundo
                </p>
              </RevealItem>
              <RevealItem duration={0.8} delay={0.3}>
                <p className="mb-6 text-body-md leading-relaxed opacity-90">
                  Experiencias de una semana en portales sagrados alrededor del
                  mundo, para quienes están listos para un proceso más profundo.
                </p>
              </RevealItem>
              <RevealItem duration={0.8} delay={0.45}>
                <Link
                  href="/viajes#viajes"
                  className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#05125a]/60 bg-white/25 px-7 py-3 text-label-sm uppercase text-[#05125a] transition-[filter] duration-300 hover:brightness-110"
                >
                  Ir más allá
                </Link>
              </RevealItem>
            </div>
          </div>
        </Reveal>

        <TestimonialsSection id="voces" testimonials={testimonials} />

        {/* Tecnología del Alma: la puerta a /contenidos. */}
        {/* Tecnología del Alma: la puerta a /contenidos.

            Umbral 0.25 y un solo observador para texto e imagen: en el mockup
            entran juntos. Titulo, linea e imagen a 0ms; los tres parrafos a
            150/300/450 y el boton a 600. La imagen ademas escala desde 0.98. */}
        <CreamSection
          id="tecnologia"
          full={false}
          reveal={{ amount: 0.25, stagger: 0 }}
        >
          <div className="mx-auto flex max-w-narrative flex-col items-center gap-12 md:flex-row md:gap-16">
            <div className="flex-1">
              <RevealItem duration={0.8}>
                <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
                  Tecnología del Alma
                </h2>
              </RevealItem>
              <RevealLine className="mt-3 mb-6 h-0.5 w-16 bg-[#f9d78f]" />
              <div className="space-y-6 text-body-md leading-relaxed text-[#333]">
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
                <CtaLink href="/contenidos" className="mt-8 rounded-full">
                  Ir más profundo
                </CtaLink>
              </RevealItem>
            </div>

            <RevealItem className="w-full flex-1" y={0} duration={1} scaleFrom={0.98}>
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl md:aspect-[4/4.4]">
                <Image
                  src={content("home.tecnologia.image")}
                  alt="Portal de luz"
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
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
        />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
