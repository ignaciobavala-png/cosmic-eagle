import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TRIP_TYPES, isTripType } from "@/lib/trip-type";
import { TripForm } from "../TripForm";
import { createTrip } from "../actions";

/**
 * El tipo llega en la URL desde la seccion que abrio el form (Sesiones o
 * Viajes). Sin `?tipo=` valido se asume retiro, que es el default historico.
 */
export default async function NuevoViajePage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const meta = isTripType(tipo) ? TRIP_TYPES[tipo] : TRIP_TYPES.retiro;

  return (
    <div>
      <Link
        href={meta.adminPath}
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        {meta.plural}
      </Link>
      <h1 className="font-display text-3xl text-primary-fixed-dim mb-8">
        {meta.newTitle}
      </h1>
      <TripForm type={meta.value} action={createTrip} />
    </div>
  );
}
