import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TRIP_TYPES, type TripType } from "@/lib/trip-type";
import { DeleteTripButton } from "./DeleteTripButton";
import { formatAmount } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  open: "Abierto",
  closed: "Cerrado",
  completed: "Finalizado",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-outline-variant/30 text-on-surface-variant border-outline/40",
  open: "bg-secondary/20 text-secondary border-secondary/40",
  closed: "bg-error/20 text-error border-error/40",
  completed: "bg-primary-container/20 text-primary-fixed-dim border-primary-fixed-dim/40",
};

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Listado del admin acotado a un tipo. Lo comparten /admin/retiros y
 * /admin/ceremonias: son la misma tabla, pero cada una es una seccion propia.
 */
export async function TripsList({ type }: { type: TripType }) {
  const meta = TRIP_TYPES[type];
  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("id, title, location, start_date, end_date, capacity, price, status")
    .eq("type", type)
    .order("start_date", { ascending: true });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 className="font-display text-2xl sm:text-3xl text-primary-fixed-dim">
          {meta.plural}
        </h1>
        <Link
          href={`/admin/viajes/nuevo?tipo=${type}`}
          className="bg-primary-container text-on-primary font-medium tracking-[0.05em] rounded-lg px-4 py-2.5 text-sm whitespace-nowrap hover:bg-primary-fixed transition-colors"
        >
          {meta.newLabel}
        </Link>
      </div>

      {!trips || trips.length === 0 ? (
        <p className="text-on-surface-variant">{meta.emptyHint}</p>
      ) : (
        <div className="glass-card rounded-2xl overflow-x-auto">
          <table className="w-full min-w-[48rem] text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-left text-on-surface-variant">
                <th className="px-5 py-3 font-medium">Título</th>
                <th className="px-5 py-3 font-medium">Fechas</th>
                <th className="px-5 py-3 font-medium">Cupo</th>
                <th className="px-5 py-3 font-medium">Precio</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id} className="border-b border-outline-variant/40 last:border-0">
                  <td className="px-5 py-4">
                    <p className="text-on-surface font-medium">{trip.title}</p>
                    {trip.location && (
                      <p className="text-on-surface-variant text-xs">{trip.location}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant">
                    {trip.start_date === trip.end_date
                      ? formatDate(trip.start_date)
                      : `${formatDate(trip.start_date)} – ${formatDate(trip.end_date)}`}
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant">{trip.capacity}</td>
                  <td className="px-5 py-4 text-on-surface-variant">
                    {trip.price > 0 ? formatAmount(trip.price) : "Gratuito"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border ${STATUS_CLASS[trip.status] ?? ""}`}
                    >
                      {STATUS_LABEL[trip.status] ?? trip.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/viajes/${trip.id}/editar`}
                        className="text-secondary hover:underline"
                      >
                        Editar
                      </Link>
                      <DeleteTripButton id={trip.id} title={trip.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
