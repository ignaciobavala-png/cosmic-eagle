import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { formatAmount, type FormatLocale } from "@/lib/format";
import { panel, panelDivider } from "@/components/forms/styles";

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
/** El paso siguiente, como clave de mensaje + los valores de la ICU. */
type PendingStep = {
  key: string;
  values?: Record<string, string>;
  href?: string;
};

function pendingStep(a: Application, locale: FormatLocale): PendingStep {
  if (a.status === "pending_review") return { key: "applications.waitingReview" };
  // El paso siguiente de este estado no esta en la web: contesta Estela por
  // privado (ver el correo [2A] en docs/COMUNICACIONES.md).
  if (a.status === "needs_conversation") return { key: "applications.willWrite" };
  if (a.status !== "approved") return { key: "applications.dash" };
  // Desde el 03/09 la tabla si lee el viaje (precio y seña), asi que el paso
  // siguiente puede decir cuanto: "USD 900" y "faltan USD 450" en vez de "falta
  // el pago" a secas. Es lo que promete "tu espacio personal" en seis de los
  // correos de docs/COMUNICACIONES.md.
  if (a.payment_status === "pending") {
    return a.trip?.deposit_amount
      ? {
          key: "applications.deposit",
          values: {
            deposit: formatAmount(a.trip.deposit_amount, locale),
            price: formatAmount(a.trip.price, locale),
          },
          href: `/viajes/${a.trip_id}/solicitar`,
        }
      : a.trip
        ? {
            key: "applications.payMissing",
            values: { price: formatAmount(a.trip.price, locale) },
            href: `/viajes/${a.trip_id}/solicitar`,
          }
        : { key: "applications.payMissingNoTrip", href: `/viajes/${a.trip_id}/solicitar` };
  }
  const faltaSalud = a.is_first_time && !a.health_form_submitted;
  if (a.payment_status === "deposit_paid" && !faltaSalud) {
    const saldo = a.trip ? Math.max(0, a.trip.price - a.amount_paid) : 0;
    return saldo > 0
      ? {
          key: "applications.balance",
          values: { amount: formatAmount(saldo, locale) },
          href: `/viajes/${a.trip_id}/solicitar`,
        }
      : { key: "applications.balanceNoTrip", href: `/viajes/${a.trip_id}/solicitar` };
  }
  if (faltaSalud) {
    return {
      key: "applications.health",
      href: `/viajes/${a.trip_id}/solicitar`,
    };
  }
  // El consentimiento es el ultimo paso del embudo, despues del de salud.
  if (!a.consent_submitted) {
    return {
      key: "applications.consent",
      href: `/viajes/${a.trip_id}/consentimiento`,
    };
  }
  return { key: "applications.done" };
}

function formatDate(iso: string, locale: FormatLocale) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(
    locale === "en" ? "en-US" : "es-CL",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  );
}

function formatDateTime(iso: string, locale: FormatLocale) {
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function MisSolicitudes({
  applications,
  locale,
}: {
  applications: Application[];
  locale: FormatLocale;
}) {
  const t = await getTranslations("Cuenta");
  const approved = applications.filter((a) => a.status === "approved");

  if (applications.length === 0) {
    return (
      <p className="max-w-md text-center text-white/70">
        {t.rich("applications.empty", {
          link: (chunks) => (
            <Link href="/viajes" className="text-primary-container underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
    );
  }

  return (
    <div className="w-full flex flex-col gap-8 mt-4">
      {approved.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-primary-container">
            {t("applications.approved")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {approved.map((a) => (
              <div key={a.id} className={`p-4 ${panel}`}>
                <p className="font-medium text-white">
                  {a.trip?.title ?? t("applications.tripFallback")}
                </p>
                {a.trip && (
                  <p className="mt-1 text-sm text-white/65">
                    {a.trip.location ? `${a.trip.location} · ` : ""}
                    {formatDate(a.trip.start_date, locale)}
                    {a.trip.end_date !== a.trip.start_date &&
                      ` — ${formatDate(a.trip.end_date, locale)}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-primary-container">
          {t("applications.mine")}
        </h2>
        <div className={`overflow-x-auto ${panel}`}>
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className={`border-b text-left text-white/55 ${panelDivider}`}>
                <th className="px-4 py-3 font-medium">{t("applications.trip")}</th>
                <th className="px-4 py-3 font-medium">{t("applications.step")}</th>
                <th className="px-4 py-3 font-medium">{t("applications.date")}</th>
                <th className="px-4 py-3 font-medium">{t("applications.status")}</th>
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
                      const step = pendingStep(a, locale);
                      const label = t(step.key, step.values);
                      return step.href ? (
                        <Link
                          href={step.href}
                          className="text-primary-container underline"
                        >
                          {label}
                        </Link>
                      ) : (
                        label
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {formatDateTime(a.created_at, locale)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border ${STATUS_CLASS[a.status] ?? ""}`}
                    >
                      {["pending_review", "needs_conversation", "approved", "rejected", "expired"].includes(
                        a.status
                      )
                        ? t(`applications.statusLabel.${a.status}`)
                        : a.status}
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
