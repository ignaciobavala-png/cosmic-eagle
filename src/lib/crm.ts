/**
 * CRM — segmentacion de contactos. Ver docs/CRM.md.
 *
 * Todo lo de aca es derivado: no hay tabla de CRM. El universo son las personas
 * registradas (`profiles`) y las etiquetas salen de su historial de solicitudes.
 * Los ejes que la clienta pidio y NO se pueden calcular (genero, cargo, y pais
 * para quien nunca lleno el formulario largo) todavia no tienen de donde salir
 * — falta definir si los carga el admin o se los pedimos a la persona.
 */

import type { Enums } from "@/lib/supabase/types";

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

type ApplicationRow = {
  user_id: string;
  status: Enums<"application_status">;
  created_at: string;
};

export type FirstTimeRow = ApplicationRow & { country: string };
export type ReturningRow = ApplicationRow & { previous_ceremonies: number };

export type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
};

export type Contact = {
  id: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
  country: string | null;
  ceremonies: number;
  experience: ExperienceLevel;
  state: RelationshipState;
  applications: number;
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
  firstTime,
  returning,
}: {
  profiles: ProfileRow[];
  firstTime: FirstTimeRow[];
  returning: ReturningRow[];
}): Contact[] {
  return profiles.map((profile) => {
    const own = {
      firstTime: firstTime.filter((a) => a.user_id === profile.id),
      returning: returning.filter((a) => a.user_id === profile.id),
    };
    const all = [...own.firstTime, ...own.returning];

    const approved = all.filter((a) => a.status === "approved").length;
    const declared = own.returning.reduce(
      (max, a) => Math.max(max, a.previous_ceremonies),
      0
    );

    // El pais solo existe en el formulario largo; el corto no lo pide.
    const country =
      [...own.firstTime].sort((a, b) =>
        b.created_at.localeCompare(a.created_at)
      )[0]?.country ?? null;

    const state: RelationshipState = approved
      ? "viajero"
      : all.some((a) => a.status === "pending_review")
        ? "solicitante"
        : "potencial";

    const ceremonies = countCeremonies(approved, declared);

    return {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      avatarUrl: profile.avatar_url,
      isAdmin: profile.is_admin,
      createdAt: profile.created_at,
      country,
      ceremonies,
      experience: experienceLevel(ceremonies),
      state,
      applications: all.length,
    };
  });
}
