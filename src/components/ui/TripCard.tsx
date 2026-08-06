import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { tripPlaceholderImage } from "@/lib/constants";
import { formatDateRangeCompact } from "@/lib/format";
import { isTripType, tripTypeLabel } from "@/lib/trip-type";

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
 * La portada sale de `image_url` (subida por el admin). Si el viaje no tiene,
 * cae en tripPlaceholderImage, estable por hash del id para que coincida con
 * el detalle del viaje.
 */
export function TripCard({ trip }: { trip: TripCardData }) {
  return (
    <Link
      href={`/viajes/${trip.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl glass-card transition-colors duration-300 hover:border-primary-fixed-dim/35"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={trip.image_url ?? tripPlaceholderImage(trip.id)}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-1000 group-hover:scale-105"
        />
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
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-headline-md text-on-surface">
          {trip.title}
        </h3>
        {trip.description && (
          <p className="mt-3 text-body-md text-on-surface-variant line-clamp-4">
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
    </Link>
  );
}
