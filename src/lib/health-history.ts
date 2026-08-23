/**
 * Historial de salud por persona — la ficha de `/admin/crm/[id]`.
 *
 * No hay tabla nueva: el historial ya está en la base, repartido entre las dos
 * etapas de la inscripción (ver docs/FLUJO_INSCRIPCION.md). Cada solicitud
 * aporta un filtro corto, y las que llegaron a la etapa 2 aportan además un
 * formulario extenso. Acá se ordenan por fecha, se marcan las respuestas que
 * cambiaron respecto de la entrega anterior del mismo tipo, y se resume el
 * último valor conocido de cada pregunta.
 *
 * Las listas de campos son la fuente única de los textos: las consume tanto
 * esta ficha como el detalle de solicitud (`/admin/solicitudes/[id]`). Antes
 * estaban escritas a mano en la página y se desincronizaban solas.
 */

import type { Tables } from "@/lib/supabase/types";

export type ApplicationRow = Tables<"applications">;
export type HealthFormRow = Tables<"health_form_first_time">;

/** Un campo de texto o número: se muestra tal cual. */
type PlainField<T> = {
  kind: "plain";
  key: keyof T & string;
  label: string;
};

/**
 * Un sí/no con detalle opcional. `flag` marca las respuestas que obligan a
 * revisión manual — es el mismo criterio de los triggers de aviso, ver
 * `needsManualReview` en el detalle de solicitud.
 */
type BoolField<T> = {
  kind: "bool";
  key: keyof T & string;
  detailKey: keyof T & string;
  label: string;
  flag: boolean;
};

export type FieldSpec<T> = PlainField<T> | BoolField<T>;

/** Etapa 1 — el filtro corto con el texto de Sofía. */
export const SCREENING_FIELDS: FieldSpec<ApplicationRow>[] = [
  { kind: "plain", key: "email", label: "Email" },
  { kind: "plain", key: "phone", label: "Teléfono" },
  {
    kind: "plain",
    key: "previous_ceremonies",
    label: "Ceremonias previas con Estela",
  },
  {
    kind: "bool",
    key: "serious_illness",
    detailKey: "serious_illness_detail",
    label: "Enfermedad grave (actual o pasada)",
    flag: true,
  },
  {
    kind: "bool",
    key: "mental_health_treatment",
    detailKey: "mental_health_treatment_detail",
    label: "Tratamiento psiquiátrico o psicológico",
    flag: true,
  },
  {
    kind: "bool",
    key: "current_medication",
    detailKey: "current_medication_detail",
    label: "Tratamiento médico / medicación en curso",
    flag: true,
  },
  { kind: "plain", key: "theme", label: "Tema a trabajar" },
  { kind: "plain", key: "comment", label: "Comentario" },
];

/** Etapa 2 — el formulario extenso, posterior al pago. */
export const HEALTH_FIELDS: FieldSpec<HealthFormRow>[] = [
  { kind: "plain", key: "age", label: "Edad" },
  { kind: "plain", key: "height", label: "Altura" },
  { kind: "plain", key: "weight", label: "Peso" },
  { kind: "plain", key: "country", label: "País" },
  { kind: "plain", key: "occupation", label: "Ocupación" },
  {
    kind: "bool",
    key: "health_condition",
    detailKey: "health_condition_detail",
    label: "Condición de salud",
    flag: true,
  },
  {
    kind: "bool",
    key: "stress_anxiety",
    detailKey: "stress_anxiety_detail",
    label: "Estrés / ansiedad",
    flag: false,
  },
  {
    kind: "bool",
    key: "trauma",
    detailKey: "trauma_detail",
    label: "Trauma",
    flag: true,
  },
  {
    kind: "bool",
    key: "substance_use",
    detailKey: "substance_use_detail",
    label: "Uso de sustancias",
    flag: true,
  },
  {
    kind: "bool",
    key: "allergies",
    detailKey: "allergies_detail",
    label: "Alergias",
    flag: false,
  },
  {
    kind: "bool",
    key: "spiritual_practice",
    detailKey: "spiritual_practice_detail",
    label: "Práctica espiritual",
    flag: false,
  },
  {
    kind: "bool",
    key: "first_time_plants",
    detailKey: "plants_detail",
    label: "Primera vez con plantas",
    flag: false,
  },
  {
    kind: "bool",
    key: "has_themes",
    detailKey: "themes_detail",
    label: "Temas a trabajar",
    flag: false,
  },
  {
    kind: "bool",
    key: "fears",
    detailKey: "fears_detail",
    label: "Miedos",
    flag: false,
  },
  { kind: "plain", key: "comment", label: "Comentario" },
];

/** Una respuesta ya resuelta contra su campo, lista para renderizar. */
export type Answer = {
  key: string;
  label: string;
  kind: "plain" | "bool";
  /** El sí/no; `null` en los campos de texto. */
  bool: boolean | null;
  /** El texto: el valor del campo plano, o el detalle del sí/no. */
  text: string | null;
  /** Requiere revisión manual (sí + `flag`). */
  flagged: boolean;
  /**
   * Qué decía la entrega anterior del mismo tipo. `null` cuando es la primera
   * o cuando la respuesta no cambió.
   */
  changedFrom: string | null;
};

function displayValue(
  spec: FieldSpec<Record<string, unknown>>,
  row: Record<string, unknown>
) {
  const raw = row[spec.key];
  if (spec.kind === "bool") {
    const detail = row[spec.detailKey];
    return `${raw ? "Sí" : "No"}${raw && detail ? ` — ${detail}` : ""}`;
  }
  return raw === null || raw === undefined || raw === "" ? "—" : String(raw);
}

/**
 * Resuelve una fila contra su lista de campos. `previous` es la entrega
 * anterior del mismo tipo, para marcar lo que cambió; pasar `null` cuando no
 * interesa el diff (el detalle de una solicitud suelta).
 */
export function answersFor<T extends Record<string, unknown>>(
  fields: FieldSpec<T>[],
  row: T,
  previous: T | null
): Answer[] {
  return fields.map((spec) => {
    const raw = row[spec.key];
    const isBool = spec.kind === "bool";
    const bool = isBool ? Boolean(raw) : null;
    const text = isBool
      ? ((row[spec.detailKey] as string | null) ?? null)
      : raw === null || raw === undefined || raw === ""
        ? null
        : String(raw);

    // Se compara el valor ya formateado: alcanza para decir "cambió" e incluye
    // el detalle, que es donde suele estar lo que importa.
    const before = previous
      ? displayValue(
          spec as FieldSpec<Record<string, unknown>>,
          previous as Record<string, unknown>
        )
      : null;
    const now = displayValue(
      spec as FieldSpec<Record<string, unknown>>,
      row as Record<string, unknown>
    );

    return {
      key: spec.key,
      label: spec.label,
      kind: spec.kind,
      bool,
      text,
      flagged: isBool && Boolean(raw) && spec.flag,
      changedFrom: before !== null && before !== now ? before : null,
    };
  });
}

/** Cada entrega del historial: un filtro corto o un formulario extenso. */
export type Submission = {
  id: string;
  stage: "screening" | "health";
  date: string;
  applicationId: string;
  tripTitle: string;
  answers: Answer[];
  /** Alguna respuesta marcada como de revisión manual. */
  hasFlags: boolean;
};

export type ApplicationWithHealth = ApplicationRow & {
  trips: { title: string } | null;
  health_form_first_time: HealthFormRow | HealthFormRow[] | null;
};

/**
 * Arma la línea de tiempo de una persona, de la entrega más reciente a la más
 * vieja. El diff se calcula **contra la entrega anterior del mismo tipo**:
 * comparar el filtro corto con el extenso sería comparar preguntas distintas.
 */
export function buildTimeline(
  applications: ApplicationWithHealth[]
): Submission[] {
  const chronological = [...applications].sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );

  const submissions: Submission[] = [];
  let previousScreening: ApplicationRow | null = null;
  let previousHealth: HealthFormRow | null = null;

  for (const application of chronological) {
    const tripTitle = application.trips?.title ?? "Viaje no encontrado";

    const screeningAnswers = answersFor(
      SCREENING_FIELDS,
      application,
      previousScreening
    );
    submissions.push({
      id: `${application.id}-screening`,
      stage: "screening",
      date: application.created_at,
      applicationId: application.id,
      tripTitle,
      answers: screeningAnswers,
      hasFlags: screeningAnswers.some((a) => a.flagged),
    });
    previousScreening = application;

    // La relación es uno a uno, pero PostgREST la devuelve como array salvo que
    // el tipo generado diga lo contrario.
    const health = Array.isArray(application.health_form_first_time)
      ? application.health_form_first_time[0]
      : application.health_form_first_time;

    if (health) {
      const healthAnswers = answersFor(HEALTH_FIELDS, health, previousHealth);
      submissions.push({
        id: health.id,
        stage: "health",
        date: health.created_at,
        applicationId: application.id,
        tripTitle,
        answers: healthAnswers,
        hasFlags: healthAnswers.some((a) => a.flagged),
      });
      previousHealth = health;
    }
  }

  return submissions.reverse();
}

/**
 * El último valor declarado de cada pregunta, con la fecha en que se declaró.
 * Es la lectura de un vistazo: qué sabemos hoy de la salud de esta persona,
 * sin tener que abrir entrega por entrega.
 */
export type LatestAnswer = Answer & { date: string; stage: Submission["stage"] };

export function latestAnswers(timeline: Submission[]): LatestAnswer[] {
  const seen = new Map<string, LatestAnswer>();
  // `timeline` viene de la más nueva a la más vieja: la primera que aparece gana.
  for (const submission of timeline) {
    for (const answer of submission.answers) {
      const key = `${submission.stage}:${answer.key}`;
      if (!seen.has(key)) {
        seen.set(key, { ...answer, date: submission.date, stage: submission.stage });
      }
    }
  }
  return [...seen.values()];
}
