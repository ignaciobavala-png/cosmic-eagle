import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { PageHero, renderTitle } from "@/components/ui/PageHero";
import { TripCarousel } from "@/components/ui/TripCarousel";
import { CtaLink } from "@/components/ui/CtaLink";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import type { TripCardData } from "@/components/ui/TripCard";
import { createPublicClient } from "@/lib/supabase/public";
import { getSiteContent, isEnabled } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Calendario | Cosmic Eagle",
  description:
    "Todas las fechas abiertas de Sesiones Cósmicas y Viajes Cósmicos, en una sola página.",
};

/**
 * Las dos carteleras ya viven en /viajes, pero ahí están **cerradas** detrás de
 * un "Ver fechas disponibles" y con un bloque narrativo por delante: la página
 * está escrita para quien viene a entender qué es una Sesión y qué es un Viaje.
 * Esto es el atajo para el otro visitante, el que ya sabe y entra a ver cuál es
 * la próxima fecha (pedido de Ignacio, 17/09).
 *
 * De ahí las tres decisiones que la separan de /viajes:
 *
 * - **El hero es `compact`**, poco menos de media pantalla. Con el banner
 *   normal (82svh) la primera tarjeta queda debajo del pliegue y la página no
 *   cumpliría lo único que vino a hacer.
 * - **Los carruseles van abiertos**, sin `Collapsible`.
 * - **Sin testimonios, sin salud, sin relato**: eso está en /viajes, y el
 *   cierre de acá es justamente un link hacia allá para quien quiera leerlo.
 *
 * Es ISR como la home y por el mismo motivo: consulta `trips`, así que no puede
 * ser prerender puro, pero tampoco tiene por qué pegarle a Supabase en cada
 * visita. Se lee con `createPublicClient` —sin cookies— para que la página
 * siga siendo estática; con el cliente de `server.ts` se volvería dinámica.
 * `revalidateTripPaths` (admin/experiencias/actions.ts) la revalida a mano
 * cuando la clienta publica o edita una experiencia.
 */
export const revalidate = 3600;

/**
 * El azul con el que la home sostiene su cartelera. Es un literal y no un token
 * porque así nació allá: el panel dorado del carrusel necesita un fondo más
 * oscuro que el `surface` de la paleta para no lavarse. Si algún día entra a
 * `@theme`, se cambian los dos juntos.
 */
const NIGHT = "#020c41";

export default async function CalendarioPage() {
  const content = await getSiteContent();

  const supabase = createPublicClient();
  // Mismo filtro que /viajes: la policy `trips_select_public` deja leer TODOS
  // los trips a `anon`, borradores incluidos, así que los estados se filtran
  // acá. Cualquier ruta pública nueva que lea `trips` tiene que hacer lo mismo.
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

  return (
    <>
      <Header />
      <main className="pt-[var(--navbar-h)]">
        <PageHero
          image={content("calendario.hero.image")}
          imageAlt="Cielo estrellado sobre un portal de luz"
          title={renderTitle(content("calendario.hero.title"))}
          subtitle={content("calendario.hero.subtitle")}
          height="compact"
          overlay={isEnabled(content("calendario.hero.overlay"))}
          // Abajo arranca una banda opaca, así que el pie del banner se funde a
          // ESE azul y no a transparente: la máscara del `banner` deja ver el
          // degradé del `body`, que acá no se ve nunca. Es el mismo criterio de
          // /faqs con el crema.
          fadeTo={NIGHT}
        />

        {/* El fondo va como clase y no interpolando `NIGHT`: Tailwind escanea
            literales en el código fuente, así que `bg-[${...}]` no generaría
            regla. El literal de `fadeTo` sí puede ser la constante porque va
            por `style`. */}
        <section id="fechas" className="w-full bg-[#020c41]">
          <Reveal
            className="flex flex-col gap-16 py-20 md:gap-20"
            amount={0.12}
            once={false}
            stagger={0.15}
          >
            {/* Umbral 0.12 y no el 0.22 del resto del sitio: lo observado son
                las dos carteleras juntas, que en mobile pasan largo de una
                pantalla, y el ratio máximo alcanzable es alto de pantalla /
                alto de lo observado. Con 0.22 podría no dispararse nunca. */}
            <RevealItem>
              <TripCarousel
                caption="Calendario"
                title="Próximas Sesiones"
                trips={ceremonias}
                emptyLabel="No hay sesiones publicadas por el momento. Vuelve a visitarnos pronto."
              />
            </RevealItem>

            <RevealItem>
              <TripCarousel
                caption="Calendario"
                title="Próximos Viajes"
                trips={retiros}
                emptyLabel="No hay viajes publicados por el momento. Vuelve a visitarnos pronto."
              />
            </RevealItem>

            {/* El cierre no es un llamado a inscribirse —eso lo decide cada
                experiencia, desde su propia página— sino la puerta a lo que
                esta página deliberadamente no cuenta. */}
            <RevealItem className="px-margin-mobile text-center md:px-margin-desktop">
              <p className="mx-auto mb-7 max-w-xl text-body-md leading-relaxed text-primary/85">
                ¿Todavía no sabes cuál es para ti? En Experiencias contamos en
                qué se diferencia una Sesión Cósmica de un Viaje Cósmico, y qué
                tener en cuenta antes de postular.
              </p>
              {/* `tone="gold"` es el default y es el que va: el botón cae
                  sobre el azul de la sección, no sobre el panel dorado. */}
              <CtaLink href="/viajes">
                Conocer las experiencias
              </CtaLink>
            </RevealItem>
          </Reveal>
        </section>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
