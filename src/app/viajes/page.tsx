import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { PageHero } from "@/components/ui/PageHero";
import { MediaStatement } from "@/components/ui/MediaStatement";
import { CreamSection, GOLD } from "@/components/ui/CreamSection";
import { Collapsible } from "@/components/ui/Collapsible";
import { TripCarousel } from "@/components/ui/TripCarousel";
import { TestimonialsBand } from "@/components/ui/TestimonialsBand";
import { RevealItem } from "@/components/ui/Reveal";
import { TitleRule } from "@/components/ui/TitleRule";
import { createClient } from "@/lib/supabase/server";
import { todayUTC } from "@/lib/trip-dates";
import type { TripCardData } from "@/components/ui/TripCard";
import { getSiteContent, isEnabled } from "@/lib/site-content";
import { getTestimonials } from "@/lib/testimonials";

export const metadata: Metadata = {
  title: "Experiencias | Cosmic Eagle",
  description:
    "Sesiones Cósmicas de un día y Viajes Cósmicos de una semana en portales sagrados. Calendario y testimonios.",
};

/**
 * /viajes según el rediseño de Julia (`EXPERIENCIAS.html`, ver
 * docs/REDISENO_JULIA_HTML.md §3).
 *
 * **Sin "Salud y Seguridad" desde el 17/09.** La sección cerraba la página con
 * las contraindicaciones y el pedido de revisar la información de salud antes
 * de postular. Sofía la sacó: todavía no se registró nadie, así que esta página
 * es promoción —mostrar qué son las Sesiones y qué son los Viajes— y la
 * prevención entra recién en el embudo, donde ya vive (el formulario de salud
 * de la etapa 2 y el consentimiento). El texto es de ella y no se borra: está
 * guardado en `docs/COPY_HUERFANO.md` para cuando se decida dónde va.
 *
 * Dejó de ser una grilla con filtros: ahora son **dos bloques narrativos**, uno
 * por tipo, cada uno con su calendario desplegable y sus testimonios. El
 * desplegable del navbar apunta a las anclas `#sesiones` y `#viajes`, que es lo
 * que reemplaza al viejo `?tipo=`.
 *
 * Los títulos usan el vocabulario de Sofía ("Sesión Cósmica" = ceremonia,
 * "Viaje Cósmico" = retiro) porque es el copy del mockup. Desde la entrega de
 * Julia del 02/09 ese vocabulario vale **en todo el sitio**, navbar y panel
 * incluidos: "Ceremonias" es "Sesiones" y "Retiros" es "Viajes". Lo único que
 * sigue diciendo `retiro`/`ceremonia` es el enum de la base.
 *
 * Sigue filtrando `draft` en la consulta: la policy `trips_select_public` deja
 * leer todos los trips a `anon`, incluidos los borradores.
 */
export default async function ViajesPage() {
  const content = await getSiteContent();

  const supabase = await createClient();
  // Ademas de los borradores se descarta lo que ya termino (`end_date` y no
  // `start_date`: un Viaje en curso sigue en el calendario). La pagina es
  // dinamica, asi que aca el "hoy" es el de la visita.
  const { data } = await supabase
    .from("trips")
    .select(
      "id, title, description, location, start_date, end_date, status, image_url, type"
    )
    .in("status", ["open", "closed"])
    .gte("end_date", todayUTC())
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
      <main className="pt-[var(--navbar-h)]">
        <PageHero
          image={content("viajes.hero.image")}
          imageAlt="Portal de luz sobre un cielo estrellado"
          title="Portales de Transformación"
          scrollHint="Explorar"
          scrollTo="experiencias"
          height="full"
          overlay={isEnabled(content("viajes.hero.overlay"))}
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
          overlay={isEnabled(content("viajes.about.overlay"))}
        >
          {/* **Los resaltados NO cambian de tipografía**, sólo de color y
              peso: llevaban `font-display` y con Sorts Mill Goudy —que tiene
              la altura de x mucho más baja que Montserrat— quedaban
              visiblemente más chicos que el renglón donde viven, como si
              estuvieran en minúscula (reporte de Ignacio del 09/09). Es la
              misma regla que la palabra clave del relato de la home. */}
          <div className="space-y-6 text-body-md leading-relaxed text-primary text-justify md:text-body-lg [&_strong]:font-semibold [&_strong]:text-primary-container">
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
          flushBottom
          background={GOLD}
          reveal={{ amount: 0.22, once: false, stagger: 0 }}
        >
          {/* Estandar de Experiencias: umbral 0.22 sobre la SECCION (lo pone
              `reveal` arriba), reversible, cascada de 150ms y 0.9s por
              elemento. La linea dorada aca NO crece, a diferencia de la home y
              /nosotros: es una barra estatica, asi esta en el codigo aprobado. */}
          <div className="mx-auto max-w-3xl">
            <RevealItem delay={0.15}>
              {/* `w-fit` no es cosmetico: es lo que hace que el filete de
                  abajo mida el ancho del TITULO y no el de la columna. */}
              <div className="w-fit">
                <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
                  Sesiones Cósmicas
                </h2>
                <TitleRule tone="goldDeep" className="mt-3 mb-7" />
              </div>
            </RevealItem>
            <div className="mb-6 space-y-5 text-body-md leading-relaxed text-[#05125a] text-justify">
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
          </div>

          {/* La cartelera va FUERA de la columna de texto, como banda propia a
              todo el ancho de la pantalla. Los margenes negativos cancelan el
              padding de la CreamSection (`-mx-margin-*`) para que el panel
              dorado quede full-bleed, y así el `overflow-hidden` del panel
              desplegable del Collapsible no recorta el carrusel a la columna. */}
          <RevealItem
            delay={0.6}
            className="-mx-margin-mobile text-center md:-mx-margin-desktop"
          >
            <Collapsible label="Ver fechas disponibles">
              <TripCarousel
                caption="Calendario"
                title="Próximas Sesiones"
                trips={ceremonias}
                emptyLabel="No hay sesiones publicadas por el momento. Vuelve a visitarnos pronto."
              />
            </Collapsible>
          </RevealItem>

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
          overlay={isEnabled(content("viajes.banner.overlay"))}
        />

        {/* **`flushBottom` se queda aunque ahora sea la ultima seccion.** Al
            sacar "Salud y Seguridad" la primera idea fue devolverle el padding
            —la pagina termina aca— y se ve peor: el ultimo hijo es la banda de
            testimonios, que es azul y a todo el ancho, asi que el padding
            dejaba una franja crema de 96px entre esa banda y el footer, que
            tambien es azul. Sin el, el azul de los testimonios entra directo al
            del footer. Medido el 17/09. */}
        <CreamSection
          id="viajes"
          full={false}
          flushBottom
          background={GOLD}
          reveal={{ amount: 0.22, once: false, stagger: 0 }}
        >
          {/* Estandar de Experiencias: umbral 0.22 sobre la SECCION (lo pone
              `reveal` arriba), reversible, cascada de 150ms y 0.9s por
              elemento. La linea dorada aca NO crece, a diferencia de la home y
              /nosotros: es una barra estatica, asi esta en el codigo aprobado. */}
          <div className="mx-auto max-w-3xl">
            <RevealItem delay={0.15}>
              {/* `w-fit` no es cosmetico: es lo que hace que el filete de
                  abajo mida el ancho del TITULO y no el de la columna. */}
              <div className="w-fit">
                <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
                  Viajes Cósmicos
                </h2>
                <TitleRule tone="goldDeep" className="mt-3 mb-7" />
              </div>
            </RevealItem>
            <RevealItem delay={0.3}>
            <p className="mb-6 text-body-md leading-relaxed text-[#05125a] text-justify">
              Experiencias de una semana diseñadas para quienes se sienten listos
              para entrar en un proceso más profundo de exploración del alma,
              transformación y evolución. Realizadas en portales sagrados
              alrededor del mundo, cada locación es elegida intencionalmente por
              su energía única, su historia y su conexión con el propósito
              profundo del viaje.
            </p>
            </RevealItem>
          </div>

          {/* Banda full-bleed, igual que en Sesiones: fuera de la columna de
              texto, con margenes negativos que cancelan el padding de la
              CreamSection. */}
          <RevealItem
            delay={0.45}
            className="-mx-margin-mobile text-center md:-mx-margin-desktop"
          >
            <Collapsible label="Ver fechas disponibles">
              <TripCarousel
                caption="Calendario"
                title="Próximos Viajes"
                trips={retiros}
                emptyLabel="No hay viajes publicados por el momento. Vuelve a visitarnos pronto."
              />
            </Collapsible>
          </RevealItem>

          <TestimonialsBand
            title="Nuestros Viajeros"
            label="Voces de quienes ya hicieron el camino"
            testimonials={testimoniosViajes}
          />
        </CreamSection>

      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
