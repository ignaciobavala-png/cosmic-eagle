import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteTripButton } from "./DeleteTripButton";

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
  completed: "bg-primary/20 text-primary border-primary/40",
};

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function AdminViajesPage() {
  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("id, title, location, start_date, end_date, capacity, price, status")
    .order("start_date", { ascending: true });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-primary">Viajes</h1>
        <Link
          href="/admin/viajes/nuevo"
          className="bg-primary text-on-primary font-medium tracking-[0.05em] rounded-lg px-4 py-2.5 text-sm hover:bg-primary-container transition-colors"
        >
          Nuevo viaje
        </Link>
      </div>

      {!trips || trips.length === 0 ? (
        <p className="text-on-surface-variant">No hay viajes creados todavía.</p>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
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
                    <p className="text-on-surface-variant text-xs">{trip.location}</p>
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant">
                    {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant">{trip.capacity}</td>
                  <td className="px-5 py-4 text-on-surface-variant">
                    {trip.price > 0 ? `USD ${trip.price}` : "Gratuito"}
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
