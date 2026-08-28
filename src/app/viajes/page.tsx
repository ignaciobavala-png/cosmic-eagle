import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { PageHero } from "@/components/ui/PageHero";
import { MediaStatement } from "@/components/ui/MediaStatement";
import { CreamSection } from "@/components/ui/CreamSection";
import { Collapsible } from "@/components/ui/Collapsible";
import { TripCarousel } from "@/components/ui/TripCarousel";
import { TestimonialsBand } from "@/components/ui/TestimonialsBand";
import { RevealItem } from "@/components/ui/Reveal";
import { createClient } from "@/lib/supabase/server";
import type { TripCardData } from "@/components/ui/TripCard";
import { getSiteContent } from "@/lib/site-content";
import { getTestimonials } from "@/lib/testimonials";

export const metadata: Metadata = {
  title: "Experiencias | Cosmic Eagle",
  description:
    "Sesiones Cósmicas de un día y Viajes Cósmicos de una semana en portales sagrados. Calendario, testimonios e información de salud.",
};

/**
 * /viajes según el rediseño de Julia (`EXPERIENCIAS.html`, ver
 * docs/REDISENO_JULIA_HTML.md §3).
 *
 * Dejó de ser una grilla con filtros: ahora son **dos bloques narrativos**, uno
 * por tipo, cada uno con su calendario desplegable y sus testimonios. El
 * desplegable del navbar apunta a las anclas `#sesiones` y `#viajes`, que es lo
 * que reemplaza al viejo `?tipo=`.
 *
 * Los títulos usan el vocabulario de Sofía ("Sesión Cósmica" = ceremonia,
 * "Viaje Cósmico" = retiro) porque es el copy del mockup. **Los rótulos del
 * navbar y del panel siguen diciendo Ceremonias/Retiros** hasta que Julia
 * confirme si el cambio de nombre va en todo el sitio (pregunta 5 del 27/08).
 *
 * Sigue filtrando `draft` en la consulta: la policy `trips_select_public` deja
 * leer todos los trips a `anon`, incluidos los borradores.
 */
export default async function ViajesPage() {
  const content = await getSiteContent();

  const supabase = await createClient();
  const { data } = await supabase
    .from("trips")
    .select(
      "id, title, description, location, start_date, end_date, status, image_url, type"
    )
    .in("status", ["open", "closed"])
    .order("start_date", { ascending: true });

  const trips = (data ?? []) as TripCardData[];
  const ceremonias = trips.filter((t) => t.type === "ceremonia");
  const retiros = trips.filter((t) => t.type === "retiro");

  // Cada bloque tiene su propio juego de testimonios (Julia, 27/08).
  const [testimoniosSesiones, testimoniosViajes] = await Promise.all([
    getTestimonials("sesiones"),
    getTestimonials("viajes"),
  ]);

  return (
    <>
      <Header />
      <main className="pt-16 lg:pt-21">
        <PageHero
          image={content("viajes.hero.image")}
          imageAlt="Portal de luz sobre un cielo estrellado"
          title="Portales de Transformación"
          scrollHint="Explorar"
          scrollTo="experiencias"
          height="full"
        />

        {/* Julia pidió video de fondo; va la imagen hasta que llegue. */}
        <MediaStatement
          id="experiencias"
          image={content("viajes.about.image")}
          imageAlt="Círculo de ceremonia iluminado"
          width="prose"
          veil={0.68}
          amount={0.22}
          once={false}
          y={24}
          duration={0.9}
        >
          <div className="space-y-6 text-body-md leading-relaxed text-primary text-justify md:text-body-lg [&_strong]:font-display [&_strong]:font-bold [&_strong]:text-primary-container">
            <p>
              Nuestras experiencias cósmicas son{" "}
              <strong>viajes de exploración interior</strong> diseñados para
              revelar las estructuras profundas de tu ser y tu conexión con la{" "}
              <strong>realidad multidimensional</strong>.
            </p>
            <p>
              A través de la guía cuidadosa, la música canalizada y el trabajo
              con seres de luz, creamos espacios seguros donde puedes acceder a
              la memoria de tu alma personal, ancestral y cósmica, para{" "}
              <strong>transformar tu comprensión</strong> de quién eres y qué es
              posible.
            </p>
            <p>
              <strong>Cada experiencia es un acto de valentía</strong>: un
              compromiso contigo mismo de ir más allá de lo conocido, de disolver
              los límites que creíste fijos y de reconectar con el poder y la
              sabiduría que habita en ti. Ya sea en una sesión de un día o en un
              viaje de una semana, trabajamos con tu ritmo, tu proceso único y el
              colectivo que acompaña tu camino.
            </p>
          </div>
        </MediaStatement>

        <CreamSection
          id="sesiones"
          full={false}
          className="pb-0"
          reveal={{ amount: 0.22, once: false, stagger: 0 }}
        >
          {/* Estandar de Experiencias: umbral 0.22 sobre la SECCION (lo pone
              `reveal` arriba), reversible, cascada de 150ms y 0.9s por
              elemento. La linea dorada aca NO crece, a diferencia de la home y
              /nosotros: es una barra estatica, asi esta en el codigo aprobado. */}
          <div className="mx-auto max-w-3xl">
            <RevealItem>
              <p className="mb-4 text-label-sm font-bold uppercase text-on-primary-container">
                Portales de transformación
              </p>
            </RevealItem>
            <RevealItem delay={0.15}>
              <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
                Sesiones Cósmicas
              </h2>
              <div
                aria-hidden="true"
                className="mt-3 mb-7 h-0.5 w-16 bg-[#f9d78f]"
              />
            </RevealItem>
            <div className="mb-6 space-y-5 text-body-md leading-relaxed text-[#333] text-justify">
              <RevealItem delay={0.3}>
              <p>
                Nuestras sesiones de un día están diseñadas para sostener un
                trabajo interior profundo, la exploración multidimensional y la
                conexión con la dimensión del alma.
              </p>
              </RevealItem>
              <RevealItem delay={0.45}>
              <p>
                Cada experiencia se sostiene cuidadosamente con amor, presencia,
                atención personal y un profundo respeto por la privacidad de cada
                persona.
              </p>
              </RevealItem>
            </div>

            <RevealItem delay={0.6}>
              <Collapsible label="Explorar próximas sesiones">
                <TripCarousel
                  caption="Calendario de sesiones"
                  title="Próximas Sesiones"
                  trips={ceremonias}
                  emptyLabel="No hay sesiones publicadas por el momento. Volvé a visitarnos pronto."
                />
              </Collapsible>
            </RevealItem>
          </div>

          <TestimonialsBand
            title="Nuestros Sanadores"
            label="Lo que dicen quienes vivieron las sesiones"
            testimonials={testimoniosSesiones}
          />
        </CreamSection>

        <MediaStatement
          image={content("viajes.banner.image")}
          imageAlt="Siluetas de almas en partículas de luz"
          text="El viaje cósmico es, en última instancia, un viaje hacia adentro: un recuerdo de nuestra naturaleza más profunda, una activación de nuestra luz original y un movimiento hacia una experiencia humana más consciente, conectada y luminosa."
          veil={0.4}
          amount={0.22}
          once={false}
          y={24}
          duration={0.9}
        />

        <CreamSection
          id="viajes"
          full={false}
          className="pb-0"
          reveal={{ amount: 0.22, once: false, stagger: 0 }}
        >
          {/* Estandar de Experiencias: umbral 0.22 sobre la SECCION (lo pone
              `reveal` arriba), reversible, cascada de 150ms y 0.9s por
              elemento. La linea dorada aca NO crece, a diferencia de la home y
              /nosotros: es una barra estatica, asi esta en el codigo aprobado. */}
          <div className="mx-auto max-w-3xl">
            <RevealItem>
              <p className="mb-4 text-label-sm font-bold uppercase text-on-primary-container">
                Portales de transformación
              </p>
            </RevealItem>
            <RevealItem delay={0.15}>
              <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
                Viajes Cósmicos
              </h2>
              <div
                aria-hidden="true"
                className="mt-3 mb-7 h-0.5 w-16 bg-[#f9d78f]"
              />
            </RevealItem>
            <RevealItem delay={0.3}>
            <p className="mb-6 text-body-md leading-relaxed text-[#333] text-justify">
              Experiencias de una semana diseñadas para quienes se sienten listos
              para entrar en un proceso más profundo de exploración del alma,
              transformación y evolución. Realizadas en portales sagrados
              alrededor del mundo, cada locación es elegida intencionalmente por
              su energía única, su historia y su conexión con el propósito
              profundo del viaje.
            </p>
            </RevealItem>

            <RevealItem delay={0.45}>
              <Collapsible label="Explorar próximos viajes">
                <TripCarousel
                  caption="Calendario de viajes"
                  title="Próximos Viajes"
                  trips={retiros}
                  emptyLabel="No hay viajes publicados por el momento. Volvé a visitarnos pronto."
                />
              </Collapsible>
            </RevealItem>
          </div>

          <TestimonialsBand
            title="Nuestros Viajeros"
            label="Voces de quienes ya hicieron el camino"
            testimonials={testimoniosViajes}
          />
        </CreamSection>

        <CreamSection
          id="salud"
          full={false}
          reveal={{ amount: 0.22, once: false, stagger: 0 }}
        >
          {/* Estandar de Experiencias: umbral 0.22 sobre la SECCION (lo pone
              `reveal` arriba), reversible, cascada de 150ms y 0.9s por
              elemento. La linea dorada aca NO crece, a diferencia de la home y
              /nosotros: es una barra estatica, asi esta en el codigo aprobado. */}
          <div className="mx-auto max-w-3xl">
            <RevealItem>
              <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
                Salud y Seguridad
              </h2>
              <div
                aria-hidden="true"
                className="mt-3 mb-7 h-0.5 w-16 bg-[#f9d78f]"
              />
            </RevealItem>
            <div className="space-y-5 text-body-md leading-relaxed text-[#333] text-justify">
              <RevealItem delay={0.15}>
              <p>
                Si actualmente tomas medicamentos o estás bajo tratamiento
                médico, psiquiátrico o psicológico, por favor revisa nuestra
                información de salud antes de postular.
              </p>
              </RevealItem>
              <RevealItem delay={0.3}>
              <p>
                Esta experiencia no es adecuada para personas con ciertas
                condiciones psiquiátricas, adicciones activas a sustancias,
                trastornos de personalidad, condiciones cardiovasculares graves o
                epilepsia.
              </p>
              </RevealItem>
              <RevealItem delay={0.45}>
              <p>
                Para información sobre preparación, qué llevar, integración,
                dosis, miedo y ansiedad, y otros aspectos prácticos, por favor
                visita nuestras FAQs.
              </p>
              </RevealItem>
            </div>
          </div>
        </CreamSection>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
