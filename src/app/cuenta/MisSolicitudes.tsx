import Link from "next/link";
import { formatAmount } from "@/lib/format";
import { panel, panelDivider } from "@/components/forms/styles";

const STATUS_LABEL: Record<string, string> = {
  pending_review: "En revisión",
  needs_conversation: "Conversemos",
  approved: "Aprobada",
  rejected: "Rechazada",
  expired: "Expirada",
};

// Sobre el azul del embudo los tokens de superficie no se ven: las píldoras de
// estado van con los colores literales de la paleta de Julia, igual que el
// resto de la pantalla (ver `@/components/forms/styles`).
const STATUS_CLASS: Record<string, string> = {
  pending_review: "border-white/25 bg-white/10 text-white/80",
  needs_conversation: "border-[#f9d78f]/40 bg-[#f9d78f]/15 text-[#f9d78f]",
  approved: "border-[#f9d78f]/60 bg-[#f9d78f]/20 text-[#f9d78f]",
  rejected: "border-[#ffb4a8]/40 bg-[#ffb4a8]/10 text-[#ffb4a8]",
  expired: "border-white/15 bg-white/5 text-white/50",
};

type Application = {
  id: string;
  trip_id: string;
  status: string;
  payment_status: string;
  /** Acumulado que registro Estela, no lo del ultimo pago. */
  amount_paid: number;
  is_first_time: boolean;
  health_form_submitted: boolean;
  consent_submitted: boolean;
  created_at: string;
  trip: {
    title: string;
    location: string | null;
    start_date: string;
    end_date: string;
    price: number;
    deposit_amount: number | null;
  } | null;
};

/**
 * Qué le falta a esta solicitud. El flujo no termina en "aprobada": después
 * viene el pago, el formulario de salud extenso y el consentimiento (ver
 * docs/FLUJO_INSCRIPCION.md), así que la tabla dice el paso siguiente en vez
 * de repetir el estado.
 */
function pendingStep(a: Application): { label: string; href?: string } {
  if (a.status === "pending_review") return { label: "Esperando revisión" };
  // El paso siguiente de este estado no esta en la web: contesta Estela por
  // privado (ver el correo [2A] en docs/COMUNICACIONES.md).
  if (a.status === "needs_conversation") return { label: "Te vamos a escribir" };
  if (a.status !== "approved") return { label: "—" };
  // Desde el 03/09 la tabla si lee el viaje (precio y seña), asi que el paso
  // siguiente puede decir cuanto: "USD 900" y "faltan USD 450" en vez de "falta
  // el pago" a secas. Es lo que promete "tu espacio personal" en seis de los
  // correos de docs/COMUNICACIONES.md.
  if (a.payment_status === "pending") {
    return {
      label: a.trip?.deposit_amount
        ? `Reservá con ${formatAmount(a.trip.deposit_amount)} o pagá ${formatAmount(a.trip.price)}`
        : a.trip
          ? `Falta el pago de ${formatAmount(a.trip.price)}`
          : "Falta el pago",
      href: `/viajes/${a.trip_id}/solicitar`,
    };
  }
  const faltaSalud = a.is_first_time && !a.health_form_submitted;
  if (a.payment_status === "deposit_paid" && !faltaSalud) {
    const saldo = a.trip ? Math.max(0, a.trip.price - a.amount_paid) : 0;
    return {
      label: saldo > 0 ? `Falta el saldo de ${formatAmount(saldo)}` : "Falta el saldo",
      href: `/viajes/${a.trip_id}/solicitar`,
    };
  }
  if (faltaSalud) {
    return {
      label: "Completar formulario de salud",
      href: `/viajes/${a.trip_id}/solicitar`,
    };
  }
  // El consentimiento es el ultimo paso del embudo, despues del de salud.
  if (!a.consent_submitted) {
    return {
      label: "Firmar el consentimiento",
      href: `/viajes/${a.trip_id}/consentimiento`,
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
      <p className="max-w-md text-center text-white/70">
        Todavía no tienes solicitudes. Elige un viaje en{" "}
        <Link href="/viajes" className="text-primary-container underline">
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
          <h2 className="mb-3 font-display text-lg font-bold text-primary-container">
            Viajes aprobados
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {approved.map((a) => (
              <div key={a.id} className={`p-4 ${panel}`}>
                <p className="font-medium text-white">{a.trip?.title ?? "Viaje"}</p>
                {a.trip && (
                  <p className="mt-1 text-sm text-white/65">
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
        <h2 className="mb-3 font-display text-lg font-bold text-primary-container">
          Mis solicitudes
        </h2>
        <div className={`overflow-x-auto ${panel}`}>
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className={`border-b text-left text-white/55 ${panelDivider}`}>
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
                  className={`border-b last:border-0 ${panelDivider}`}
                >
                  <td className="px-4 py-3 font-medium text-white">
                    {a.trip?.title ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {(() => {
                      const step = pendingStep(a);
                      return step.href ? (
                        <Link
                          href={step.href}
                          className="text-primary-container underline"
                        >
                          {step.label}
                        </Link>
                      ) : (
                        step.label
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-white/70">
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
