import { CtaLink } from "@/components/ui/CtaLink";
import { Reveal } from "@/components/ui/Reveal";
import { TripCard } from "@/components/ui/TripCard";
import { createClient } from "@/lib/supabase/server";
import { TRIP_TYPES } from "@/lib/constants";
import type { Enums } from "@/lib/supabase/types";

/**
 * Bloque de viajes de la home, acotado a un tipo: la home muestra dos, retiros
 * y ceremonias, cada uno con su grilla P4 y su link al listado ya filtrado.
 * Antes era una sola seccion ("Proximos Retiros") que mezclaba los dos.
 *
 * Filtra `draft` explicitamente: la policy `trips_select_public` deja leer
 * todos los trips a `anon`, asi que el filtro de borradores va siempre en la
 * consulta, nunca se asume desde RLS.
 */
export async function TripsSection({
  type,
  subtitle,
}: {
  type: Enums<"trip_type">;
  subtitle: string;
}) {
  const tripType = TRIP_TYPES.find((t) => t.value === type)!;

  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select(
      "id, title, description, location, start_date, end_date, image_url, type"
    )
    .eq("type", type)
    .in("status", ["open", "closed"])
    .order("start_date", { ascending: true })
    .limit(3);

  // Sin viajes publicados de este tipo la seccion no aporta nada: se omite.
  if (!trips || trips.length === 0) return null;

  return (
    <Reveal className="py-20 md:py-24">
      <div className="mx-auto max-w-narrative px-margin-mobile md:px-margin-desktop">
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="font-display text-headline-md sm:text-headline-lg text-on-surface">
              {tripType.upcoming}
            </h2>
            <p className="mt-2 text-body-md text-on-surface-variant">
              {subtitle}
            </p>
          </div>
          <CtaLink
            href={`/viajes?tipo=${tripType.slug}`}
            variant="ghost"
            className="px-6 py-2"
          >
            Ver {tripType.label.toLowerCase()}
          </CtaLink>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </div>
    </Reveal>
  );
}
