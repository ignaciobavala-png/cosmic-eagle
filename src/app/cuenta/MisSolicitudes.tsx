import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  pending_review: "En revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
  expired: "Expirada",
};

const STATUS_CLASS: Record<string, string> = {
  pending_review: "bg-secondary/20 text-secondary border-secondary/40",
  approved: "bg-primary-container/20 text-primary-fixed-dim border-primary-fixed-dim/40",
  rejected: "bg-error/20 text-error border-error/40",
  expired: "bg-outline-variant/30 text-on-surface-variant border-outline/40",
};

type Application = {
  id: string;
  trip_id: string;
  status: string;
  payment_status: string;
  is_first_time: boolean;
  health_form_submitted: boolean;
  created_at: string;
  trip: { title: string; location: string | null; start_date: string; end_date: string } | null;
};

/**
 * Qué le falta a esta solicitud. El flujo no termina en "aprobada": después
 * viene el pago, el formulario de salud extenso y el consentimiento (ver
 * docs/FLUJO_INSCRIPCION.md), así que la tabla dice el paso siguiente en vez
 * de repetir el estado.
 */
function pendingStep(a: Application): { label: string; href?: string } {
  if (a.status === "pending_review") return { label: "Esperando revisión" };
  if (a.status !== "approved") return { label: "—" };
  if (a.payment_status === "pending") return { label: "Falta la seña" };
  if (a.is_first_time && !a.health_form_submitted) {
    return {
      label: "Completar formulario de salud",
      href: `/viajes/${a.trip_id}/solicitar`,
    };
  }
  return { label: "Al día" };
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", {
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
        Todavía no tienes solicitudes. Elige un viaje en{" "}
        <Link href="/viajes" className="text-primary-fixed-dim underline">
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
          <h2 className="text-lg font-medium text-primary-fixed-dim mb-3">Viajes aprobados</h2>
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
        <h2 className="text-lg font-medium text-primary-fixed-dim mb-3">Mis solicitudes</h2>
        <div className="glass-card rounded-2xl overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-left text-on-surface-variant">
                <th className="px-4 py-3 font-medium">Viaje</th>
                <th className="px-4 py-3 font-medium">Paso siguiente</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-outline-variant/40 last:border-0"
                >
                  <td className="px-4 py-3 text-on-surface font-medium">
                    {a.trip?.title ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {(() => {
                      const step = pendingStep(a);
                      return step.href ? (
                        <Link
                          href={step.href}
                          className="text-primary-fixed-dim underline"
                        >
                          {step.label}
                        </Link>
                      ) : (
                        step.label
                      );
                    })()}
                  </td>
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
