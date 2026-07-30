import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  pending_review: "En revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
  expired: "Expirada",
};

const STATUS_CLASS: Record<string, string> = {
  pending_review: "bg-secondary/20 text-secondary border-secondary/40",
  approved: "bg-primary/20 text-primary border-primary/40",
  rejected: "bg-error/20 text-error border-error/40",
  expired: "bg-outline-variant/30 text-on-surface-variant border-outline/40",
};

type Application = {
  id: string;
  trip_id: string;
  status: string;
  created_at: string;
  type: "primerizo" | "recurrente";
  trip: { title: string; location: string | null; start_date: string; end_date: string } | null;
};

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function MisSolicitudes({ applications }: { applications: Application[] }) {
  const approved = applications.filter((a) => a.status === "approved");

  if (applications.length === 0) {
    return (
      <p className="text-on-surface-variant text-center max-w-md">
        Todavía no tenés solicitudes. Elegí un viaje en{" "}
        <Link href="/viajes" className="text-primary underline">
          Viajes
        </Link>{" "}
        para postularte.
      </p>
    );
  }

  return (
    <div className="w-full flex flex-col gap-8 mt-4">
      {approved.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-primary mb-3">Viajes aprobados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {approved.map((a) => (
              <div key={a.id} className="glass-card rounded-xl p-4">
                <p className="text-on-surface font-medium">{a.trip?.title ?? "Viaje"}</p>
                {a.trip && (
                  <p className="text-sm text-on-surface-variant mt-1">
                    {a.trip.location ? `${a.trip.location} · ` : ""}
                    {formatDate(a.trip.start_date)}
                    {a.trip.end_date !== a.trip.start_date && ` — ${formatDate(a.trip.end_date)}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-medium text-primary mb-3">Mis solicitudes</h2>
        <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-left text-on-surface-variant">
                <th className="px-4 py-3 font-medium">Viaje</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr
                  key={`${a.type}-${a.id}`}
                  className="border-b border-outline-variant/40 last:border-0"
                >
                  <td className="px-4 py-3 text-on-surface font-medium">
                    {a.trip?.title ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant capitalize">{a.type}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {formatDateTime(a.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border ${STATUS_CLASS[a.status] ?? ""}`}
                    >
                      {STATUS_LABEL[a.status] ?? a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
