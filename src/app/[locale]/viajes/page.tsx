import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/ui/PageHero";
import { MediaStatement } from "@/components/ui/MediaStatement";
import { CreamSection, GOLD } from "@/components/ui/CreamSection";
import { ExperienceFilter } from "@/components/ui/ExperienceFilter";
import { ExperienceGate } from "@/components/ui/ExperienceGate";
import { TestimonialsBand } from "@/components/ui/TestimonialsBand";
import { createClient } from "@/lib/supabase/server";
import { todayUTC } from "@/lib/trip-dates";
import type { TripCardData } from "@/components/ui/TripCard";
import { localizeRow } from "@/lib/localized";
import { getSiteContent, isEnabled } from "@/lib/site-content";
import { getTestimonials } from "@/lib/testimonials";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/viajes">): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Viajes");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

/**
 * /viajes según el rediseño de Julia (`EXPERIENCIAS.html`, ver
 * docs/REDISENO_JULIA_HTML.md §3) y el feedback de la organización del 23/09
 * (docs/entregas/2026-09-23-feedback-org/CEJ_Correcciones_Experiencias_Final.docx).
 *
 * **Sin "Salud y Seguridad" desde el 17/09.** La sección cerraba la página con
 * las contraindicaciones y el pedido de revisar la información de salud antes
 * de postular. Sofía la sacó: todavía no se registró nadie, así que esta página
 * es promoción —mostrar qué son las Sesiones y qué son los Retiros— y la
 * prevención entra recién en el embudo, donde ya vive (el formulario de salud
 * de la etapa 2 y el consentimiento). El texto es de ella y no se borra: está
 * guardado en `docs/COPY_HUERFANO.md` para cuando se decida dónde va.
 *
 * **Dejó de ser dos bloques narrativos con acordeón.** El documento §4 pide
 * todas las experiencias disponibles inmediatamente después de la intro, con
 * filtros simples TODAS · SESIONES · RETIROS y la cartelera siempre abierta. El
 * listado vive en `ExperienceFilter` (client, filtrado en memoria sobre los
 * `trips` que trae este Server Component); los dos `Collapsible` de "Ver fechas
 * disponibles" salieron de la página, pero el componente sigue en
 * `src/components/ui/` porque `ScrollStory` lo usa en la home.
 *
 * **Sin el banner de frase del medio.** El texto "El viaje cósmico es, en última
 * instancia, un viaje hacia adentro..." no está en la estructura final del
 * documento (§7) y se solapaba con la frase de cierre; se guardó en
 * `docs/COPY_HUERFANO.md`. El cierre con imagen + frase que sí pide el
 * documento ya había entrado en `9fecff7`.
 *
 * Sigue filtrando `draft` en la consulta: la policy `trips_select_public` deja
 * leer todos los trips a `anon`, incluidos los borradores.
 *
 * **`?tipo=`** preselecciona el filtro de `ExperienceFilter` (mismo criterio
 * que `?categoria=` en `/contenidos`): es lo que necesitan los hijos
 * "Sesiones"/"Viajes" del desplegable de `Header`, que hasta el rediseño del
 * 24/09 apuntaban a los anchors `#sesiones`/`#viajes` que esta página ya no
 * tiene (ahora es una sola cartelera con filtro de estado, no dos bloques).
 */
export default async function ViajesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/viajes">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Viajes");
  const { tipo } = await searchParams;
  const initialFilter = tipo === "ceremonia" || tipo === "retiro" ? tipo : "todas";
  const content = await getSiteContent(locale);

  const supabase = await createClient();
  // Ademas de los borradores se descarta lo que ya termino (`end_date` y no
  // `start_date`: un Viaje en curso sigue en el calendario). La pagina es
  // dinamica, asi que aca el "hoy" es el de la visita.
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

  // Después del listado va una sola banda de testimonios: el documento §5 pide
  // "solamente una selección breve". Desde el 29/09 es la de "Nuestros
  // Sanadores" (placement `sesiones`), con los relatos que mandó Sofía; el
  // juego de "viajes" repetía el de la home y quedó sin mostrarse.
  const testimonios = await getTestimonials("sesiones", locale);

  return (
    <>
      <Header />
      <main className="pt-[var(--navbar-h)]">
        <PageHero
          image={content("viajes.hero.image")}
          imageAlt={t("hero.imageAlt")}
          title={t("hero.title")}
          scrollHint={t("hero.scrollHint")}
          scrollTo="experiencias"
          height="full"
          overlay={isEnabled(content("viajes.hero.overlay"))}
        />

        {/* Julia pidió video de fondo; va la imagen hasta que llegue.
            Texto acortado a pedido de la organización (23/09): "reducir al
            mínimo los textos explicativos y dar protagonismo a las
            experiencias disponibles". Las tres párrafos largos quedan en
            docs/COPY_HUERFANO.md. */}
        <MediaStatement
          id="experiencias"
          image={content("viajes.about.image")}
          imageAlt={t("about.imageAlt")}
          width="prose"
          veil={0.68}
          amount={0.22}
          once={false}
          y={24}
          duration={0.9}
          overlay={isEnabled(content("viajes.about.overlay"))}
        >
          <p className="text-body-md leading-relaxed text-primary text-justify md:text-body-lg [&_strong]:font-semibold [&_strong]:text-primary-container">
            {t.rich("about.body", {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </MediaStatement>

        {/* La cartelera es la sección principal (documento §4): va pegada a la
            intro, siempre abierta y con las fechas al frente. El `reveal` de
            sección NO se usa acá a propósito: el listado lo decide la clienta
            —publica las experiencias que quiera— y una sección más alta que
            ~4,5 pantallas nunca alcanzaría el umbral de 0.22 del resto del
            sitio, así que quedaría invisible para siempre. La banda de
            testimonios trae su propio reveal, que mide bien porque tiene alto
            fijo.

            `flushBottom` se mantiene: el último hijo es la banda azul de
            testimonios, que va a sangre; sin el quedaría una franja dorada
            colgando debajo. */}
        <CreamSection
          id="cartelera"
          full={false}
          flushBottom
          background={GOLD}
        >
          <ExperienceGate>
            <ExperienceFilter trips={trips} initialFilter={initialFilter} />
          </ExperienceGate>

          <TestimonialsBand
            title={t("testimonials.title")}
            label={t("testimonials.label")}
            testimonials={testimonios}
          />
        </CreamSection>

        {/* Cierre pedido por la organización (23/09): "cerrar la página con
            una imagen limpia y potente... no agregar contenido después de
            esta imagen". */}
        <MediaStatement
          image={content("viajes.cierre.image")}
          imageAlt={t("cierre.imageAlt")}
          height={600}
          mobileFull
        >
          <p className="text-balance text-center font-display text-[20px] italic leading-snug text-primary-container md:text-[28px]">
            {t.rich("cierre.text", { br: () => <br /> })}
          </p>
        </MediaStatement>
      </main>
      <Footer />
    </>
  );
}
