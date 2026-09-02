import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReviewButtons } from "../ReviewButtons";
import { PaymentControls } from "../PaymentControls";
import { PaymentProofList } from "../PaymentProofList";
import { AnswerList } from "../../AnswerList";
import {
  SCREENING_FIELDS,
  HEALTH_FIELDS,
  answersFor,
} from "@/lib/health-history";

const STATUS_LABEL: Record<string, string> = {
  pending_review: "Pendiente",
  needs_conversation: "Conversemos",
  approved: "Aprobada",
  rejected: "Rechazada",
  expired: "Expirada",
};

const PAYMENT_LABEL: Record<string, string> = {
  pending: "Sin pagar",
  paid: "Pagado",
  waived: "Sin cargo",
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-outline-variant/40 last:border-0">
      <p className="text-xs text-on-surface-variant tracking-[0.02em] mb-1">{label}</p>
      <p className="text-on-surface">{value || "—"}</p>
    </div>
  );
}

export default async function SolicitudDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: application } = await supabase
    .from("applications")
    .select("*, trips(title, start_date, end_date), health_form_first_time(*)")
    .eq("id", id)
    .single();

  if (!application) notFound();

  const isOwnApplication = application.user_id === user?.id;
  // La relación es uno a uno, pero PostgREST la devuelve como array salvo que
  // el tipo generado diga lo contrario.
  const health = Array.isArray(application.health_form_first_time)
    ? application.health_form_first_time[0]
    : application.health_form_first_time;

  // Espejo de la regla de los triggers `private.notify_new_application`
  // (migración 20260819194408, las 3 preguntas de Sofía) y
  // `private.notify_health_form` (20260819180444). Si cambia una, cambia la
  // otra: es la misma regla escrita dos veces porque una corre en Postgres y la
  // otra en React. Marcar NO es rechazar: el encuadre del filtro es
  // informativo, Estela lee todas.
  const needsManualReview = health
    ? health.health_condition || health.substance_use || health.trauma
    : application.serious_illness ||
      application.mental_health_treatment ||
      application.current_medication;

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/solicitudes"
        className="text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors mb-6 inline-block"
      >
        ← Volver a solicitudes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <h1 className="font-display text-2xl sm:text-3xl text-primary-fixed-dim break-words">
          {application.full_name}
        </h1>
        <span className="shrink-0 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border bg-primary-container/10 text-primary-fixed-dim border-primary-fixed-dim/30">
          {STATUS_LABEL[application.status] ?? application.status}
        </span>
      </div>
      <p className="text-on-surface-variant mb-8">
        {application.trips?.title ?? "Viaje no encontrado"} ·{" "}
        {application.previous_ceremonies === 0
          ? "Primera vez"
          : `${application.previous_ceremonies} ceremonias previas`}{" "}
        · Pago: {PAYMENT_LABEL[application.payment_status] ?? application.payment_status}
      </p>

      {needsManualReview && (
        <div className="glass-card border-error/40 rounded-xl px-5 py-4 mb-6">
          <p className="text-error text-sm font-medium">
            {health
              ? "Requiere revisión manual obligatoria: el formulario de salud declara condición de salud, uso de sustancias o trauma."
              : "Requiere revisión manual obligatoria: el filtro declara una enfermedad grave, un tratamiento psiquiátrico o psicológico, o medicación en curso."}
          </p>
          {/* La salida prevista para este caso no es rechazar: es el correo [2A]
              de Sofía (docs/COMUNICACIONES.md). Hasta que existió "Conversemos"
              este aviso no ofrecía ningún camino intermedio. */}
          <p className="mt-2 text-sm text-on-surface-variant">
            Si hace falta hablarlo antes de decidir, «Conversemos» le avisa a la
            persona y deja la solicitud abierta.
          </p>
        </div>
      )}

      <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
        <h2 className="font-display text-xl text-primary-fixed-dim mb-2">Revisión</h2>
        {isOwnApplication ? (
          <p className="text-on-surface-variant text-sm">
            Esta es tu propia solicitud — no puedes aprobarla ni rechazarla.
            Pídele a otro admin que la revise.
          </p>
        ) : (
          <ReviewButtons id={id} currentStatus={application.status} />
        )}
      </div>

      <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
        <h2 className="font-display text-xl text-primary-fixed-dim mb-4">Pago</h2>
        {/* El comprobante primero: la decisión de marcar pagado se toma
            mirándolo, no al revés. */}
        <PaymentProofList applicationId={id} />
        <PaymentControls
          id={id}
          currentStatus={application.payment_status}
          currentReference={application.payment_reference}
        />
      </div>

      <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
        <h2 className="font-display text-xl text-primary-fixed-dim mb-2">
          Filtro inicial
        </h2>
        <AnswerList answers={answersFor(SCREENING_FIELDS, application, null)}>
          <Field
            label="Enviada"
            value={new Date(application.created_at).toLocaleString("es-CL")}
          />
          {application.reviewed_at && (
            <Field
              label="Revisada"
              value={new Date(application.reviewed_at).toLocaleString("es-CL")}
            />
          )}
        </AnswerList>
      </div>

      <div className="glass-card rounded-2xl p-6 md:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
          <h2 className="font-display text-xl text-primary-fixed-dim">
            Formulario de salud
          </h2>
          <Link
            href={`/admin/crm/${application.user_id}`}
            className="text-xs text-on-surface-variant hover:text-primary-fixed-dim transition-colors"
          >
            Ver el historial de esta persona →
          </Link>
        </div>

        {!health ? (
          <p className="text-on-surface-variant text-sm">
            Todavía no lo completó. Lo puede cargar después de que la solicitud
            esté aprobada y el pago registrado.
          </p>
        ) : (
          <>
            <AnswerList answers={answersFor(HEALTH_FIELDS, health, null)}>
              <Field
                label="Enviado"
                value={new Date(health.created_at).toLocaleString("es-CL")}
              />
            </AnswerList>
          </>
        )}
      </div>
    </div>
  );
}
