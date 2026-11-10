/**
 * CRM — segmentacion de contactos. Ver docs/CRM.md.
 *
 * Todo lo de aca es derivado: no hay tabla de CRM. El universo son las personas
 * registradas (`profiles`) y las etiquetas salen de su historial de solicitudes.
 *
 * Pais y genero los carga la propia persona en su perfil (14/10). El pais, para
 * quien todavia no lo cargo, se completa con el de su ultima solicitud (el
 * filtro corto lo pide a todos) y, en ultimo lugar, con el del formulario de
 * salud. El cargo (healer, lider, influencer) sigue sin tener de donde salir.
 */

import type { Enums } from "@/lib/supabase/types";
import { canonicalCountry } from "@/lib/countries";
import { GENDERS } from "@/app/[locale]/cuenta/profile-fields";

export const GENDER_LABELS: Record<(typeof GENDERS)[number], string> = {
  mujer: "Mujer",
  hombre: "Hombre",
  no_binario: "No binario",
  prefiero_no_decir: "Prefiere no decirlo",
};

/**
 * Escala de experiencia de la reunion del 2026-08-03.
 *
 * OJO: solo los tres primeros umbrales son de la clienta (nuevo = 0,
 * principiante = 1, intermedio = 5). Los de avanzado y experto son **provisorios**,
 * puestos para poder renderizar la tabla — hay que confirmarlos (docs/CRM.md §6).
 */
export const EXPERIENCE_LEVELS = [
  { value: "nuevo", label: "Nuevo", min: 0 },
  { value: "principiante", label: "Principiante", min: 1 },
  { value: "intermedio", label: "Intermedio", min: 5 },
  { value: "avanzado", label: "Avanzado", min: 10 },
  { value: "experto", label: "Experto", min: 20 },
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]["value"];

export function experienceLevel(ceremonies: number): ExperienceLevel {
  // De mayor a menor: el primero cuyo piso alcanza.
  for (let i = EXPERIENCE_LEVELS.length - 1; i > 0; i--) {
    if (ceremonies >= EXPERIENCE_LEVELS[i].min) return EXPERIENCE_LEVELS[i].value;
  }
  return "nuevo";
}

/**
 * Estado de la relacion. "Potencial" es la lectura de "clientes potenciales" de
 * la reunion acotada al universo de gente registrada: se anoto pero nunca llego
 * a viajar (nunca aplico, o su solicitud fue rechazada/expirada).
 */
export const RELATIONSHIP_STATES = [
  { value: "viajero", label: "Viajero" },
  { value: "solicitante", label: "Solicitante" },
  { value: "potencial", label: "Potencial" },
] as const;

export type RelationshipState = (typeof RELATIONSHIP_STATES)[number]["value"];

export type ApplicationRow = {
  id: string;
  user_id: string;
  trip_id: string;
  residence_country: string;
  status: Enums<"application_status">;
  payment_status: Enums<"payment_status">;
  previous_ceremonies: number;
  created_at: string;
};

/**
 * Lo que la organización tiene que HACER con una persona. Es una señal aparte
 * del estado de la relación, a propósito: "viajero" ya quiere decir "tiene una
 * reserva aprobada" para el filtro de envíos y para el asistente de IA, y
 * redefinirlo los rompería.
 *
 * - `revisar`: hay una solicitud esperando la decisión.
 * - `comprobante`: aprobada, sin pago registrado y con un comprobante subido
 *   que nadie confirmó todavía.
 */
export type PendingAction = "revisar" | "comprobante";

export const PENDING_ACTION_LABELS: Record<PendingAction, string> = {
  revisar: "Revisar solicitud",
  comprobante: "Confirmar pago",
};

/** Cómo va el pago de lo aprobado, para leerlo sin abrir la solicitud. */
export const PAYMENT_SUMMARY_LABELS = {
  pending: "Pago pendiente",
  deposit_paid: "Seña pagada",
  paid: "Pagado",
  waived: "Sin cargo",
} as const satisfies Record<Enums<"payment_status">, string>;

/**
 * El pais vive en el formulario de salud extenso (etapa 2), no en la solicitud:
 * el filtro corto no lo pide. La pagina aplana el join para no tener que
 * conocer la forma que devuelve PostgREST aca adentro.
 */
export type HealthFormRow = {
  user_id: string;
  country: string;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  is_admin: boolean;
  created_at: string;
  country: string | null;
  gender: string | null;
};

export type Contact = {
  id: string;
  fullName: string | null;
  email: string | null;
  isAdmin: boolean;
  createdAt: string;
  country: string | null;
  gender: string | null;
  /** Los viajes a los que aplicó (cualquier estado): para segmentar por experiencia. */
  tripIds: string[];
  ceremonies: number;
  experience: ExperienceLevel;
  state: RelationshipState;
  applications: number;
  /** Qué hay que hacer con esta persona ahora, o `null` si nada. */
  action: PendingAction | null;
  /**
   * El pago de su solicitud aprobada más reciente, o `null` si no tiene ninguna
   * aprobada (sin reserva no hay nada que cobrar).
   */
  payment: Enums<"payment_status"> | null;
};

/**
 * Cuenta de ceremonias, a mejor esfuerzo.
 *
 * Dos fuentes que no coinciden: las solicitudes aprobadas *en la plataforma*, y
 * las que la persona **declara** en el formulario de recurrente
 * (`previous_ceremonies`). Se toma la mayor porque la plataforma es nueva: quien
 * viene ceremoniando por Google Forms desde hace años tiene historial cero acá y
 * quedaria clasificado como "nuevo" (ver docs/FORMULARIOS.md).
 */
function countCeremonies(approved: number, declared: number) {
  return Math.max(approved, declared);
}

export function buildContacts({
  profiles,
  applications,
  healthForms,
  proofApplicationIds = [],
}: {
  profiles: ProfileRow[];
  applications: ApplicationRow[];
  healthForms: HealthFormRow[];
  /** Solicitudes que tienen al menos un comprobante subido. */
  proofApplicationIds?: string[];
}): Contact[] {
  const withProof = new Set(proofApplicationIds);

  return profiles.map((profile) => {
    const all = applications.filter((a) => a.user_id === profile.id);

    const approved = all.filter((a) => a.status === "approved").length;
    const declared = all.reduce(
      (max, a) => Math.max(max, a.previous_ceremonies),
      0
    );

    const latest = <T extends { created_at: string }>(rows: T[]) =>
      [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

    const country = canonicalCountry(
      profile.country ??
        latest(all)?.residence_country ??
        latest(healthForms.filter((h) => h.user_id === profile.id))?.country
    );

    const state: RelationshipState = approved
      ? "viajero"
      : // Una conversacion abierta es una solicitud viva: sigue siendo
        // solicitante, no "potencial" (ver docs/COMUNICACIONES.md, correo [2A]).
        all.some(
            (a) =>
              a.status === "pending_review" || a.status === "needs_conversation"
          )
        ? "solicitante"
        : "potencial";

    const ceremonies = countCeremonies(approved, declared);

    // Una solicitud por revisar manda sobre el pago: es lo que bloquea a la
    // persona. El comprobante sólo cuenta si la plata todavía no se registró.
    const approvedApps = all.filter((a) => a.status === "approved");
    const action: PendingAction | null = all.some(
      (a) => a.status === "pending_review"
    )
      ? "revisar"
      : approvedApps.some(
            (a) => a.payment_status === "pending" && withProof.has(a.id)
          )
        ? "comprobante"
        : null;
    const payment = latest(approvedApps)?.payment_status ?? null;

    return {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      isAdmin: profile.is_admin,
      createdAt: profile.created_at,
      country,
      gender: profile.gender,
      tripIds: [...new Set(all.map((a) => a.trip_id))],
      ceremonies,
      experience: experienceLevel(ceremonies),
      state,
      applications: all.length,
      action,
      payment,
    };
  });
}

export type ContactFilters = {
  estado?: string;
  nivel?: string;
  pais?: string;
  genero?: string;
  viaje?: string;
  /** `1` deja sólo a quienes tienen algo pendiente (`Contact.action`). */
  accion?: string;
};

/**
 * Un filtro puede traer varios valores separados por coma (`estado=viajero,potencial`):
 * dentro de un eje alcanza con cumplir uno (O), entre ejes se cumplen todos (Y).
 */
export function filterValues(value: string | undefined): string[] {
  return (value ?? "").split(",").map((v) => v.trim()).filter(Boolean);
}

/** Un solo criterio para la tabla y para el envío: lo que se ve es lo que recibe. */
export function filterContacts(contacts: Contact[], f: ContactFilters): Contact[] {
  const estado = filterValues(f.estado);
  const nivel = filterValues(f.nivel);
  const pais = filterValues(f.pais);
  const genero = filterValues(f.genero);
  const viaje = filterValues(f.viaje);
  const soloPendientes = filterValues(f.accion).includes("1");
  return contacts.filter(
    (c) =>
      (!soloPendientes || c.action !== null) &&
      (estado.length === 0 || estado.includes(c.state)) &&
      (nivel.length === 0 || nivel.includes(c.experience)) &&
      (pais.length === 0 || (c.country !== null && pais.includes(c.country))) &&
      (genero.length === 0 || (c.gender !== null && genero.includes(c.gender))) &&
      (viaje.length === 0 || viaje.some((id) => c.tripIds.includes(id)))
  );
}

/** Tope de destinatarios por envío segmentado (ver actions.ts del CRM). */
export const MAX_RECIPIENTS = 80;
