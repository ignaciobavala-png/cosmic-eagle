import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AnswerList } from "../../AnswerList";
import { ReviewButtons } from "../../solicitudes/ReviewButtons";
import { PaymentControls } from "../../solicitudes/PaymentControls";
import { PaymentProofList } from "../../solicitudes/PaymentProofList";
import { finalPrice } from "@/lib/discounts";
import {
  buildTimeline,
  latestAnswers,
  type ApplicationWithHealth,
} from "@/lib/health-history";
import {
  EXPERIENCE_LEVELS,
  RELATIONSHIP_STATES,
  buildContacts,
} from "@/lib/crm";

/**
 * Ficha de salud por persona — pedido de la reunión del 2026-08-23.
 *
 * No hay tabla nueva: el historial se acumula solo, porque cada inscripción
 * deja un filtro corto y, si llegó a la etapa 2, un formulario extenso. Acá se
 * juntan todas las entregas de una misma persona en orden, con las respuestas
 * que cambiaron marcadas. Ver `src/lib/health-history.ts`.
 */

const STATUS_LABEL: Record<string, string> = {
  pending_review: "Pendiente de revisión",
  needs_conversation: "Conversemos",
  approved: "Aprobada",
  rejected: "Rechazada",
  expired: "Expirada",
};

const STAGE_LABEL = {
  screening: "Filtro inicial",
  health: "Formulario de salud",
} as const;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function FichaSaludPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: profile },
    { data: applications },
    {
      data: { user: viewer },
    },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, is_admin, created_at, country, gender")
      .eq("id", id)
      .single(),
    supabase
      .from("applications")
      .select(
        "*, trips(title, price, currency, deposit_amount), health_form_first_time(*)"
      )
      .eq("user_id", id)
      .order("created_at", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  if (!profile) notFound();

  // La ficha pide más del viaje (precio y moneda para el cobro) que el
  // historial de salud, que sólo usa el título.
  const rows = (applications ?? []) as unknown as (ApplicationWithHealth & {
    trips: {
      title: string;
      price: number;
      currency: string;
      deposit_amount: number | null;
    } | null;
  })[];
  const timeline = buildTimeline(rows);
  const latest = latestAnswers(timeline);

  // Las mismas etiquetas de la tabla del CRM, calculadas sobre esta persona
  // sola para no repetir la regla de clasificación acá.
  const [contact] = buildContacts({
    profiles: [profile],
    applications: rows.map((a) => ({
      id: a.id,
      user_id: a.user_id,
      trip_id: a.trip_id,
      residence_country: a.residence_country,
      status: a.status,
      payment_status: a.payment_status,
      previous_ceremonies: a.previous_ceremonies,
      created_at: a.created_at,
    })),
    healthForms: rows.flatMap((a) => {
      const health = Array.isArray(a.health_form_first_time)
        ? a.health_form_first_time[0]
        : a.health_form_first_time;
      return health
        ? [{ user_id: a.user_id, country: health.country, created_at: health.created_at }]
        : [];
    }),
  });

  const flagged = latest.filter((a) => a.flagged);
  const healthSummary = latest.filter((a) => a.stage === "health");

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/crm"
        className="text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors mb-6 inline-block"
      >
        ← Volver al CRM
      </Link>

      <div className="flex items-center gap-4 mb-2">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-outline/40 font-display text-2xl text-on-surface-variant"
        >
          {(profile.full_name?.trim()?.[0] ?? profile.email?.[0] ?? "?").toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl text-primary-fixed-dim break-words">
            {profile.full_name ?? "Sin nombre"}
          </h1>
          <p className="text-on-surface-variant text-sm break-words">
            {profile.email ?? "—"}
          </p>
        </div>
      </div>

      <p className="mb-8 text-sm text-on-surface-variant">
        {EXPERIENCE_LEVELS.find((l) => l.value === contact?.experience)?.label ??
          "—"}{" "}
        · {contact?.ceremonies ?? 0} ceremonias ·{" "}
        {RELATIONSHIP_STATES.find((s) => s.value === contact?.state)?.label ?? "—"}
        {contact?.country ? ` · ${contact.country}` : ""}
      </p>

      {/* Todo lo que se decide sobre esta persona, en un solo lugar. Reusa los
          mismos componentes (y las mismas server actions) que
          /admin/solicitudes/[id]: la regla de aprobación y de pago no se
          duplica, y un admin sigue sin poder revisar su propia solicitud. */}
      <section className="mb-8">
        <h2 className="font-display text-xl text-primary-fixed-dim mb-3">
          Solicitudes y pagos
        </h2>
        {rows.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            Esta persona creó su cuenta pero todavía no se postuló a ningún
            viaje. No hay nada que revisar ni cobrar.
          </p>
        ) : (
          <div className="space-y-4">
            {[...rows].reverse().map((app) => {
              const esPropia = app.user_id === viewer?.id;
              const trip = app.trips;
              return (
                <div
                  key={app.id}
                  className="glass-card rounded-2xl p-6 md:p-8"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <h3 className="font-display text-lg text-primary-fixed-dim">
                      {trip?.title ?? "Viaje no encontrado"}
                    </h3>
                    <span className="shrink-0 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border bg-primary-container/10 text-primary-fixed-dim border-primary-fixed-dim/30">
                      {STATUS_LABEL[app.status] ?? app.status}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-5">
                    Postuló el {formatDateTime(app.created_at)}
                    {app.reviewed_at
                      ? ` · revisada el ${formatDateTime(app.reviewed_at)}`
                      : ""}
                  </p>

                  {esPropia ? (
                    <p className="text-sm text-on-surface-variant">
                      Esta es tu propia solicitud: no puedes aprobarla ni
                      rechazarla. Pídele a otra cuenta admin que la revise.
                    </p>
                  ) : (
                    <ReviewButtons
                      id={app.id}
                      currentStatus={app.status}
                      fullName={app.full_name}
                    />
                  )}

                  {/* El pago sólo tiene sentido con la solicitud aprobada. */}
                  {app.status === "approved" && (
                    <div className="mt-6 border-t border-outline-variant/40 pt-5">
                      <h4 className="font-display text-base text-primary-fixed-dim mb-3">
                        Pago
                      </h4>
                      <PaymentProofList applicationId={app.id} />
                      <PaymentControls
                        id={app.id}
                        currentStatus={app.payment_status}
                        currentReference={app.payment_reference}
                        amountPaid={app.amount_paid}
                        price={finalPrice(trip?.price ?? 0, app.discount_amount)}
                        discount={app.discount_amount}
                        currency={trip?.currency ?? "USD"}
                        depositAmount={trip?.deposit_amount ?? null}
                      />
                    </div>
                  )}

                  <Link
                    href={`/admin/solicitudes/${app.id}`}
                    className="mt-5 inline-block text-xs text-on-surface-variant hover:text-primary-fixed-dim transition-colors"
                  >
                    Ver el detalle completo de la solicitud →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {flagged.length > 0 && (
        <div className="glass-card border-error/40 rounded-xl px-5 py-4 mb-6">
          <p className="text-error text-sm font-medium mb-2">
            Requiere atención — lo último declarado incluye:
          </p>
          <ul className="text-error/90 text-sm list-disc pl-5 space-y-1">
            {flagged.map((answer) => (
              <li key={`${answer.stage}:${answer.key}`}>
                {answer.label}
                {answer.text ? ` — ${answer.text}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {timeline.length === 0 ? (
        // Sólo se muestra si hay solicitudes: sin ninguna, el bloque de arriba
        // ya dice que no se postuló y repetirlo acá sería ruido.
        rows.length > 0 ? (
          <p className="text-on-surface-variant">
            Todavía no hay respuestas de salud registradas.
          </p>
        ) : null
      ) : (
        <>
          {healthSummary.length > 0 && (
            <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
              <h2 className="font-display text-xl text-primary-fixed-dim mb-2">
                Estado actual
              </h2>
              <p className="text-xs text-on-surface-variant mb-4">
                El último valor declarado de cada pregunta del formulario
                extenso. Las respuestas viejas siguen abajo, en el historial.
              </p>
              <AnswerList answers={healthSummary} />
            </div>
          )}

          <h2 className="font-display text-xl text-primary-fixed-dim mb-1">
            Historial
          </h2>
          <p className="text-xs text-on-surface-variant mb-4">
            {timeline.length} entrega{timeline.length === 1 ? "" : "s"}, de la
            más reciente a la más antigua.
          </p>

          <div className="space-y-6">
            {timeline.map((submission) => (
              <div key={submission.id} className="glass-card rounded-2xl p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                  <h3 className="font-display text-lg text-primary-fixed-dim">
                    {STAGE_LABEL[submission.stage]}
                  </h3>
                  <Link
                    href={`/admin/solicitudes/${submission.applicationId}`}
                    className="shrink-0 text-xs text-on-surface-variant hover:text-primary-fixed-dim transition-colors"
                  >
                    Ver la solicitud →
                  </Link>
                </div>
                <p className="text-xs text-on-surface-variant mb-4">
                  {submission.tripTitle} · {formatDateTime(submission.date)}
                </p>
                <AnswerList answers={submission.answers} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
