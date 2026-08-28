import { notFound } from "next/navigation";
import Link from "next/link";
import { CircleUser } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AnswerList } from "../../AnswerList";
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

  const [{ data: profile }, { data: applications }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, is_admin, created_at")
      .eq("id", id)
      .single(),
    supabase
      .from("applications")
      .select("*, trips(title), health_form_first_time(*)")
      .eq("user_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!profile) notFound();

  const rows = (applications ?? []) as ApplicationWithHealth[];
  const timeline = buildTimeline(rows);
  const latest = latestAnswers(timeline);

  // Las mismas etiquetas de la tabla del CRM, calculadas sobre esta persona
  // sola para no repetir la regla de clasificación acá.
  const [contact] = buildContacts({
    profiles: [profile],
    applications: rows.map((a) => ({
      user_id: a.user_id,
      status: a.status,
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
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-14 w-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <CircleUser size={56} className="shrink-0 text-on-surface-variant/50" />
        )}
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
        <p className="text-on-surface-variant">
          Esta persona todavía no se postuló a ningún viaje, así que no hay
          respuestas de salud registradas.
        </p>
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
