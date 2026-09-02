import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatDateRangeCompact } from "@/lib/format";
import { isTripType, tripTypeLabel } from "@/lib/trip-type";
import { TripCover } from "./TripCover";

export type TripCardData = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  image_url: string | null;
  /** Opcional: solo el listado de /viajes avisa cuando el cupo ya no esta abierto. */
  status?: string | null;
  /** Opcional: retiro o ceremonia. Solo lo pide el listado, no la home. */
  type?: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  closed: "Cupo completo",
  completed: "Finalizado",
};

/**
 * P4 — Tarjeta de viaje con portada. Badge de ubicacion superpuesto, titulo
 * serif, descripcion y pie con label FECHA + accion circular.
 * Se repite en la home y en /viajes (el listado todavia usa su propio markup).
 *
 * La portada la resuelve `TripCover`, que es quien decide el recorte (ver
 * docs/PORTADAS.md).
 */
export function TripCard({
  trip,
  tone = "dark",
}: {
  trip: TripCardData;
  /**
   * `dark` es la tarjeta de vidrio de siempre, sobre el fondo azul del sitio.
   * `light` es la del rediseño: fondo blanco, para la cartelera dorada de
   * /viajes, donde el vidrio oscuro directamente se pierde. Cambia solo la
   * piel; la estructura, el recorte de la portada y el link son los mismos.
   */
  tone?: "dark" | "light";
}) {
  const light = tone === "light";

  return (
    <Link
      href={`/viajes/${trip.id}`}
      className={
        light
          ? "group flex h-full flex-col overflow-hidden rounded-xl bg-white transition-shadow duration-300 hover:shadow-[0_10px_30px_rgba(5,18,90,0.25)]"
          : "group flex flex-col overflow-hidden rounded-2xl glass-card transition-colors duration-300 hover:border-primary-fixed-dim/35"
      }
    >
      {light ? (
        /* La tarjeta de la cartelera, segun `calendariodeviajes_design.png`
           (correccion del 02/09): la portada es una franja apaisada y limpia, y
           los DOS tags van debajo de ella, no superpuestos. El de tipo es la
           pildora dorada y el de lugar el azul translucido con borde. */
        <>
          <TripCover tripId={trip.id} imageUrl={trip.image_url} variant="strip">
            {trip.status && STATUS_LABEL[trip.status] && (
              <span className="absolute right-3 top-3 rounded-full bg-[#05125a]/80 px-3 py-1 text-label-sm uppercase text-white backdrop-blur-md">
                {STATUS_LABEL[trip.status]}
              </span>
            )}
          </TripCover>

          <div className="flex flex-1 flex-col p-5">
            <div className="mb-4 flex flex-wrap gap-2.5">
              {isTripType(trip.type) && (
                <span className="rounded-full bg-[linear-gradient(135deg,#f9d78f,#b3964b)] px-3.5 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.11em] text-white">
                  {tripTypeLabel(trip.type)}
                </span>
              )}
              {trip.location && (
                <span className="rounded-full border border-[#0079b3]/40 bg-[linear-gradient(135deg,rgba(0,121,179,0.2),rgba(5,18,90,0.2))] px-3.5 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.11em] text-[#05125a]">
                  {trip.location}
                </span>
              )}
            </div>

            <h3 className="font-display text-headline-md text-[#05125a]">
              {trip.title}
            </h3>
            {trip.description && (
              <p className="mt-2 line-clamp-4 flex-1 text-[13px] leading-relaxed text-[#05125a]/85">
                {trip.description}
              </p>
            )}

            <div className="mt-4 flex items-end justify-between gap-4 border-t border-[#e0e0e0] pt-4">
              <div>
                {/* El label va en `on-primary-container` y no en el `#b3964b`
                    del mockup: ese oro sobre blanco da 3,4:1 en un texto de
                    10px (ver la sesion del 28/08). Mismo rol de la paleta, un
                    tono mas oscuro. */}
                <span className="block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-primary-container">
                  Fecha
                </span>
                <span className="mt-1 block font-display text-[13px] font-bold uppercase tracking-[0.04em] text-[#05125a]">
                  {formatDateRangeCompact(trip.start_date, trip.end_date)}
                </span>
              </div>
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#05125a]/25 text-[#05125a] transition-colors group-hover:bg-[#05125a] group-hover:text-white"
              >
                <ArrowUpRight size={16} />
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
        <TripCover tripId={trip.id} imageUrl={trip.image_url} variant="card">
          <div className="absolute inset-0 bg-[#05102a]/20" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {isTripType(trip.type) && (
              <span className="rounded-full bg-primary-container/90 px-3 py-1 text-label-sm uppercase text-on-primary backdrop-blur-md">
                {tripTypeLabel(trip.type)}
              </span>
            )}
            {trip.location && (
              <span className="rounded-full border border-primary-fixed-dim/40 bg-[#05060a]/70 px-3 py-1 text-label-sm uppercase text-primary-fixed-dim backdrop-blur-md">
                {trip.location}
              </span>
            )}
          </div>
          {trip.status && STATUS_LABEL[trip.status] && (
            <span className="absolute right-4 top-4 rounded-full border border-outline/40 bg-[#05060a]/70 px-3 py-1 text-label-sm uppercase text-on-surface-variant backdrop-blur-md">
              {STATUS_LABEL[trip.status]}
            </span>
          )}
        </TripCover>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h3 className="font-display text-headline-md text-on-surface">
            {trip.title}
          </h3>
          {trip.description && (
            <p className="mt-3 line-clamp-4 text-body-md text-on-surface-variant">
              {trip.description}
            </p>
          )}

          <div className="mt-6 flex items-end justify-between gap-4 border-t border-primary-fixed-dim/12 pt-4">
            <div>
              <span className="block text-label-sm uppercase text-on-surface-variant/60">
                Fecha
              </span>
              <span className="mt-1 block text-body-md text-on-surface">
                {formatDateRangeCompact(trip.start_date, trip.end_date)}
              </span>
            </div>
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary-fixed-dim/35 text-primary-fixed-dim transition-colors group-hover:bg-primary-container group-hover:text-on-primary"
            >
              <ArrowUpRight size={18} />
            </span>
          </div>
        </div>
        </>
      )}
    </Link>
  );
}
