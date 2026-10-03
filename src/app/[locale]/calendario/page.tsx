import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TripCarousel } from "@/components/ui/TripCarousel";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import type { TripCardData } from "@/components/ui/TripCard";
import { localizeRow } from "@/lib/localized";
import { createPublicClient } from "@/lib/supabase/public";
import { todayUTC } from "@/lib/trip-dates";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/calendario">): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Calendario");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

/**
 * Las dos carteleras ya viven en /viajes, pero ahí están **cerradas** detrás de
 * un "Ver fechas disponibles" y con un bloque narrativo por delante: la página
 * está escrita para quien viene a entender qué es una Sesión y qué es un Viaje.
 * Esto es el atajo para el otro visitante, el que ya sabe y entra a ver cuál es
 * la próxima fecha (pedido de Ignacio, 17/09).
 *
 * De ahí las tres decisiones que la separan de /viajes:
 *
 * - **No tiene hero** (desde el 03/10; antes era uno `compact`): la página
 *   arranca directo con la primera cartelera.
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

export default async function CalendarioPage({
  params,
}: PageProps<"/[locale]/calendario">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Calendario");

  const supabase = createPublicClient();
  // Mismo filtro que /viajes: la policy `trips_select_public` deja leer TODOS
  // los trips a `anon`, borradores incluidos, así que los estados se filtran
  // acá. Cualquier ruta pública nueva que lea `trips` tiene que hacer lo mismo.
  //
  // Y lo mismo con las fechas: fuera lo que ya terminó, que en una página que
  // es sólo calendario es donde más se notaba. Como es ISR, el "hoy" queda
  // congelado hasta que la página se revalida (la hora de arriba, o el
  // `revalidateTripPaths` del panel), así que una fecha recién pasada puede
  // seguir listada un rato.
  const { data } = await supabase
    .from("trips")
    .select(
      "id, title, title_en, description, description_en, location, start_date, end_date, status, image_url, type"
    )
    .in("status", ["open", "closed"])
    .gte("end_date", todayUTC())
    .order("start_date", { ascending: true });

  const trips: TripCardData[] = (data ?? []).map((trip) =>
    localizeRow(trip, locale, ["title", "description"])
  );
  const ceremonias = trips.filter((t) => t.type === "ceremonia");
  const retiros = trips.filter((t) => t.type === "retiro");

  return (
    <>
      <Header />
      <main className="pt-[var(--navbar-h)]">
        {/* Sin hero desde el 03/10 (correcciones de la organización, §3.1):
            la esfera ocupaba media pantalla antes de cualquier contenido y la
            página tiene que arrancar directo con las sesiones y los retiros.
            Los slots `calendario.hero.*` quedan registrados, sin uso. */}
        {/* El fondo va como clase y no interpolando `NIGHT`: Tailwind escanea
            literales en el código fuente, así que `bg-[${...}]` no generaría
            regla. El literal de `fadeTo` sí puede ser la constante porque va
            por `style`. */}
        <section id="fechas" className="w-full bg-[#020c41]">
          <Reveal
            className="flex flex-col gap-16 pb-16 pt-0 md:gap-20 md:py-16"
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
                caption={t("caption")}
                title={t("sesiones")}
                trips={ceremonias}
                emptyLabel={t("emptySesiones")}
              />
            </RevealItem>

            <RevealItem>
              <TripCarousel
                caption={t("caption")}
                title={t("viajes")}
                trips={retiros}
                emptyLabel={t("emptyViajes")}
              />
            </RevealItem>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
