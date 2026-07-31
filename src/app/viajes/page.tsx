import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { PageHero } from "@/components/ui/PageHero";
import { TripCard } from "@/components/ui/TripCard";
import { CallBand } from "@/components/ui/CallBand";
import { Reveal } from "@/components/ui/Reveal";
import { createClient } from "@/lib/supabase/server";
import { IMAGES } from "@/lib/constants";

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
 */
export default async function ViajesPage() {
  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select(
      "id, title, description, location, start_date, end_date, status, image_url"
    )
    .in("status", ["open", "closed"])
    .order("start_date", { ascending: true });

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
            <div className="mb-12 text-center">
              <span className="text-label-sm uppercase text-on-surface-variant">
                Calendario de viajes
              </span>
              <h2 className="mt-2 font-display text-headline-lg text-on-surface">
                Próximos Retiros
              </h2>
            </div>

            {!trips || trips.length === 0 ? (
              <p className="mx-auto max-w-md text-center text-body-md text-on-surface-variant">
                No hay viajes publicados por el momento. Volvé a visitarnos
                pronto.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
