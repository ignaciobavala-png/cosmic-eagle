import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReviewButtons } from "../ReviewButtons";
import { PaymentControls } from "../PaymentControls";

const STATUS_LABEL: Record<string, string> = {
  pending_review: "Pendiente",
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

function BoolField({
  label,
  value,
  detail,
  flagIfTrue = true,
}: {
  label: string;
  value: boolean;
  detail?: string | null;
  flagIfTrue?: boolean;
}) {
  const flagged = flagIfTrue && value;
  return (
    <div className="py-3 border-b border-outline-variant/40 last:border-0">
      <p className="text-xs text-on-surface-variant tracking-[0.02em] mb-1">{label}</p>
      <p className={flagged ? "text-error font-medium" : "text-on-surface"}>
        {value ? "Sí" : "No"}
        {value && detail ? ` — ${detail}` : ""}
      </p>
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

  // Espejo de la regla del trigger `private.notify_health_form` (migración
  // 20260819180444). Si cambia una, cambia la otra: es la misma regla escrita
  // dos veces porque una corre en Postgres y la otra en React.
  const needsManualReview = health
    ? health.health_condition || health.substance_use || health.trauma
    : application.new_treatment;

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
              : "Requiere revisión manual obligatoria: declara un tratamiento médico o psiquiátrico en curso."}
          </p>
        </div>
      )}

      <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
        <h2 className="font-display text-xl text-primary-fixed-dim mb-2">Revisión</h2>
        {isOwnApplication ? (
          <p className="text-on-surface-variant text-sm">
            Esta es tu propia solicitud — no podés aprobarla ni rechazarla. Pedile
            a otro admin que la revise.
          </p>
        ) : (
          <ReviewButtons id={id} currentStatus={application.status} />
        )}
      </div>

      <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
        <h2 className="font-display text-xl text-primary-fixed-dim mb-4">Pago</h2>
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
        <Field label="Email" value={application.email} />
        <Field label="Teléfono" value={application.phone} />
        <Field
          label="Ceremonias previas con Estela"
          value={application.previous_ceremonies}
        />
        <BoolField
          label="Tratamiento médico o psiquiátrico"
          value={application.new_treatment}
          detail={application.new_treatment_detail}
        />
        <BoolField
          label="Estrés / ansiedad"
          value={application.stress_anxiety}
          detail={application.stress_anxiety_detail}
          flagIfTrue={false}
        />
        <Field label="Tema a trabajar" value={application.theme} />
        <Field label="Comentario" value={application.comment} />
        <Field
          label="Enviada"
          value={new Date(application.created_at).toLocaleString("es-AR")}
        />
        {application.reviewed_at && (
          <Field
            label="Revisada"
            value={new Date(application.reviewed_at).toLocaleString("es-AR")}
          />
        )}
      </div>

      <div className="glass-card rounded-2xl p-6 md:p-8">
        <h2 className="font-display text-xl text-primary-fixed-dim mb-2">
          Formulario de salud
        </h2>

        {!health ? (
          <p className="text-on-surface-variant text-sm">
            Todavía no lo completó. Lo puede cargar después de que la solicitud
            esté aprobada y el pago registrado.
          </p>
        ) : (
          <>
            <Field label="Edad" value={health.age} />
            <Field label="Altura" value={health.height} />
            <Field label="Peso" value={health.weight} />
            <Field label="País" value={health.country} />
            <Field label="Ocupación" value={health.occupation} />
            <BoolField
              label="Condición de salud"
              value={health.health_condition}
              detail={health.health_condition_detail}
            />
            <BoolField
              label="Estrés / ansiedad"
              value={health.stress_anxiety}
              detail={health.stress_anxiety_detail}
              flagIfTrue={false}
            />
            <BoolField
              label="Trauma"
              value={health.trauma}
              detail={health.trauma_detail}
            />
            <BoolField
              label="Uso de sustancias"
              value={health.substance_use}
              detail={health.substance_use_detail}
            />
            <BoolField
              label="Alergias"
              value={health.allergies}
              detail={health.allergies_detail}
              flagIfTrue={false}
            />
            <BoolField
              label="Práctica espiritual"
              value={health.spiritual_practice}
              detail={health.spiritual_practice_detail}
              flagIfTrue={false}
            />
            <BoolField
              label="Primera vez con plantas"
              value={health.first_time_plants}
              detail={health.plants_detail}
              flagIfTrue={false}
            />
            <BoolField
              label="Temas a trabajar"
              value={health.has_themes}
              detail={health.themes_detail}
              flagIfTrue={false}
            />
            <BoolField
              label="Miedos"
              value={health.fears}
              detail={health.fears_detail}
              flagIfTrue={false}
            />
            <Field label="Comentario" value={health.comment} />
            <Field
              label="Enviado"
              value={new Date(health.created_at).toLocaleString("es-AR")}
            />
          </>
        )}
      </div>
    </div>
  );
}
