import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReviewButtons } from "../../ReviewButtons";
import type { ApplicationTable } from "../../actions";

const STATUS_LABEL: Record<string, string> = {
  pending_review: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  expired: "Expirada",
};

const TYPE_TO_TABLE: Record<string, ApplicationTable> = {
  primerizo: "applications_first_time",
  recurrente: "applications_returning",
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
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  const table = TYPE_TO_TABLE[type];
  if (!table) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: application } = await supabase
    .from(table)
    .select("*, trips(title, start_date, end_date)")
    .eq("id", id)
    .single();

  if (!application) notFound();

  const isOwnApplication = application.user_id === user?.id;

  const needsManualReview =
    table === "applications_first_time" &&
    "health_condition" in application &&
    (application.health_condition || application.substance_use || application.trauma);

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/solicitudes"
        className="text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors mb-6 inline-block"
      >
        ← Volver a solicitudes
      </Link>

      <div className="flex items-start justify-between mb-2">
        <h1 className="font-display text-3xl text-primary-fixed-dim">{application.full_name}</h1>
        <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border bg-primary-container/10 text-primary-fixed-dim border-primary-fixed-dim/30">
          {STATUS_LABEL[application.status] ?? application.status}
        </span>
      </div>
      <p className="text-on-surface-variant mb-8">
        {application.trips?.title ?? "Viaje no encontrado"} · Solicitud{" "}
        {type === "primerizo" ? "primerizo" : "recurrente"}
      </p>

      {needsManualReview && (
        <div className="glass-card border-error/40 rounded-xl px-5 py-4 mb-6">
          <p className="text-error text-sm font-medium">
            Requiere revisión manual obligatoria: la solicitud declara condición
            de salud, uso de sustancias o trauma.
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
          <ReviewButtons table={table} id={id} currentStatus={application.status} />
        )}
      </div>

      <div className="glass-card rounded-2xl p-6 md:p-8">
        <h2 className="font-display text-xl text-primary-fixed-dim mb-2">Datos</h2>

        {table === "applications_first_time" && "age" in application ? (
          <>
            <Field label="Email" value={application.email} />
            <Field label="Teléfono" value={application.phone} />
            <Field label="País" value={application.country} />
            <Field label="Edad" value={application.age} />
            <Field label="Altura" value={application.height} />
            <Field label="Peso" value={application.weight} />
            <Field label="Ocupación" value={application.occupation} />
            <BoolField
              label="Condición de salud"
              value={application.health_condition}
              detail={application.health_condition_detail}
            />
            <BoolField
              label="Estrés / ansiedad"
              value={application.stress_anxiety}
              detail={application.stress_anxiety_detail}
              flagIfTrue={false}
            />
            <BoolField
              label="Trauma"
              value={application.trauma}
              detail={application.trauma_detail}
            />
            <BoolField
              label="Uso de sustancias"
              value={application.substance_use}
              detail={application.substance_use_detail}
            />
            <BoolField
              label="Alergias"
              value={application.allergies}
              detail={application.allergies_detail}
              flagIfTrue={false}
            />
            <BoolField
              label="Práctica espiritual"
              value={application.spiritual_practice}
              detail={application.spiritual_practice_detail}
              flagIfTrue={false}
            />
            <BoolField
              label="Primera vez con plantas"
              value={application.first_time_plants}
              detail={application.plants_detail}
              flagIfTrue={false}
            />
            <BoolField
              label="Temas a trabajar"
              value={application.has_themes}
              detail={application.themes_detail}
              flagIfTrue={false}
            />
            <BoolField
              label="Miedos"
              value={application.fears}
              detail={application.fears_detail}
              flagIfTrue={false}
            />
            <Field label="Comentario" value={application.comment} />
          </>
        ) : "theme" in application ? (
          <>
            <Field label="Email" value={application.email} />
            <Field label="Fecha ceremonia previa" value={application.ceremony_date} />
            <Field
              label="Ceremonias anteriores"
              value={application.previous_ceremonies}
            />
            <BoolField
              label="Nuevo tratamiento médico"
              value={application.new_treatment}
              detail={application.new_treatment_detail}
            />
            <BoolField
              label="Estrés / ansiedad"
              value={application.stress_anxiety}
              detail={application.stress_anxiety_detail}
              flagIfTrue={false}
            />
            <Field label="Tema" value={application.theme} />
            <Field label="Propósito" value={application.purpose} />
          </>
        ) : null}

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
    </div>
  );
}
