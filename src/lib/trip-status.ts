import { todayUTC } from "@/lib/trip-dates";

/** Los estados que se ven: los de la base más "En curso", que NO se guarda. */
export type EffectiveTripStatus =
  | "draft"
  | "open"
  | "closed"
  | "in_progress"
  | "completed";

/**
 * El estado de una experiencia **según la fecha** (corrección 6.6, 17/11):
 *
 * - Retiro: «En curso» desde el día de inicio hasta el día antes del término, y
 *   «Finalizado» el día de término (`end_date`).
 * - Sesión (`ceremonia`): dura siempre un día, así que «Finalizado» el día de
 *   la sesión.
 *
 * **Se calcula al leer y no se guarda**: `in_progress` no existe en el enum
 * `trip_status`, y agregarlo costaría una migración (el `add value` no se puede
 * usar en la misma transacción) más un cron que además corre una vez al día,
 * así que el cambio llegaría horas tarde. Acá el cambio es el mismo día, sin
 * escribir nada. `/api/cron/cerrar-eventos` sigue persistiendo `completed`, y
 * de ahí la regla de `end_date`: las dos coinciden.
 *
 * Un `draft` no se toca (no es público) y lo que la clienta ya marcó como
 * `completed` a mano tampoco se "desfinaliza".
 *
 * El "hoy" es UTC, igual que el resto del sitio (ver `todayUTC`).
 */
export function effectiveTripStatus(
  trip: {
    status: string;
    type?: string | null;
    start_date: string;
    end_date: string;
  },
  today: string = todayUTC()
): EffectiveTripStatus | string {
  if (trip.status === "draft" || trip.status === "completed") return trip.status;

  const esSesion = trip.type === "ceremonia";
  // Una Sesión es de un día: su fecha de fin ES su fecha de inicio.
  const fin = esSesion ? trip.start_date : trip.end_date;
  if (today >= fin) return "completed";
  if (!esSesion && today >= trip.start_date) return "in_progress";
  return trip.status;
}
