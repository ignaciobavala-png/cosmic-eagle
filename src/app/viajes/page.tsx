import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { PageHero } from "@/components/ui/PageHero";
import { TripCard } from "@/components/ui/TripCard";
import { CallBand } from "@/components/ui/CallBand";
import { Reveal } from "@/components/ui/Reveal";
import { createClient } from "@/lib/supabase/server";
import { IMAGES, TRIP_TYPES, tripTypeFromSlug } from "@/lib/constants";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Retiros & Ceremonias | Cosmic Eagle",
  description:
    "Calendario de viajes y ceremonias ancestrales. Descubrí el viaje ideal para vos.",
};

/**
 * Composicion del mockup VIAJES de Julia: P1 hero -> grilla P4 -> P6 llamado.
 *
 * El listado usaba markup propio; ahora comparte TripCard con la home, asi que
 * una tarjeta de viaje se ve igual en los dos lugares.
 *
 * Filtra `draft` explicitamente (via el `in` de status): la policy
 * trips_select_public deja leer todos los trips a `anon`.
 *
 * `?tipo=retiros|ceremonias` filtra por trips.type — es a donde apuntan los dos
 * hijos del desplegable "Viajes" del navbar. Un tipo desconocido cae en el
 * listado completo en vez de 404: es un filtro, no una ruta.
 */
export default async function ViajesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const activeType = tripTypeFromSlug((await searchParams).tipo);

  const supabase = await createClient();
  let query = supabase
    .from("trips")
    .select(
      "id, title, description, location, start_date, end_date, status, image_url, type"
    )
    .in("status", ["open", "closed"]);

  if (activeType) query = query.eq("type", activeType.value);

  const { data: trips } = await query.order("start_date", { ascending: true });

  const filters = [
    { label: "Todos", href: "/viajes", active: !activeType },
    ...TRIP_TYPES.map((t) => ({
      label: t.label,
      href: `/viajes?tipo=${t.slug}`,
      active: activeType?.slug === t.slug,
    })),
  ];

  return (
    <>
      <Header />
      <main className="pt-16">
        <PageHero
          image={IMAGES.heroViajes}
          title="Retiros & Ceremonias"
          subtitle="Descubrí el viaje ideal para vos"
          actions={[
            { label: "Explorar destinos", href: "#proximos", variant: "solid" },
            {
              label: "Nuestra metodología",
              href: "/nosotros#metodologia",
              variant: "ghost",
            },
          ]}
          scrollHint="Explorar"
          scrollTo="proximos"
        />

        <Reveal className="py-20 md:py-24">
          <div
            id="proximos"
            className="mx-auto max-w-narrative px-margin-mobile md:px-margin-desktop scroll-mt-24"
          >
            <div className="mb-8 text-center">
              <span className="text-label-sm uppercase text-on-surface-variant">
                Calendario de viajes
              </span>
              <h2 className="mt-2 font-display text-headline-md sm:text-headline-lg text-on-surface">
                {activeType ? activeType.upcoming : "Próximos Viajes"}
              </h2>
            </div>

            <div className="mb-12 flex flex-wrap justify-center gap-2">
              {filters.map((filter) => (
                <Link
                  key={filter.href}
                  href={filter.href}
                  scroll={false}
                  aria-current={filter.active ? "page" : undefined}
                  className={`rounded-full border px-5 py-2 text-label-sm uppercase transition-colors ${
                    filter.active
                      ? "border-primary-fixed-dim bg-primary-container text-on-primary"
                      : "border-primary-fixed-dim/25 text-on-surface-variant hover:border-primary-fixed-dim/50 hover:text-on-surface"
                  }`}
                >
                  {filter.label}
                </Link>
              ))}
            </div>

            {!trips || trips.length === 0 ? (
              <p className="mx-auto max-w-md text-center text-body-md text-on-surface-variant">
                {activeType
                  ? `No hay ${activeType.label.toLowerCase()} publicadas por el momento. Probá con los otros viajes.`
                  : "No hay viajes publicados por el momento. Volvé a visitarnos pronto."}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {trips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            )}
          </div>
        </Reveal>

        {/* El CTA ancla al listado de arriba: aplicar es siempre a *un* viaje
            concreto (/viajes/[id]/solicitar), no hay un formulario general. */}
        <CallBand
          image={IMAGES.almas}
          title="¿Sentís el llamado?"
          action={{ label: "Aplicar para un viaje", href: "#proximos" }}
        />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
