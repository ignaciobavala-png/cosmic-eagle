import type { Json } from "@/lib/supabase/types";

/**
 * Una fila del programa.
 *
 * `day` es el numero de jornada (1 = el dia de inicio del viaje) y solo se usa
 * en los retiros, que duran varios dias: el documento de contenidos los describe
 * como una grilla Dia / Fecha / Actividad. En una ceremonia, que es de un solo
 * dia, queda en `null` y el programa es la lista de horas de siempre.
 *
 * La fecha de cada jornada **no se guarda**: se deriva de `trips.start_date` al
 * mostrarla (ver `formatScheduleDay`). Guardarla dejaria el programa desfasado
 * en cuanto se corre la fecha del viaje.
 *
 * `time` puede venir vacio cuando hay `day`: en un retiro hay jornadas que son
 * "Integracion" a secas, sin horario. Lo que nunca puede faltar es `activity`.
 */
export type ScheduleItem = { day: number | null; time: string; activity: string };

/** Tope de jornadas. Corta valores absurdos sin limitar ningun viaje real. */
const MAX_DAY = 60;

function parseDay(value: unknown): number | null {
  const day = typeof value === "string" ? Number(value) : value;
  if (typeof day !== "number" || !Number.isInteger(day)) return null;
  return day >= 1 && day <= MAX_DAY ? day : null;
}

/**
 * `trips.schedule` es jsonb, asi que del lado de TS llega como `Json`: puede ser
 * cualquier cosa. Esto lo normaliza a filas usables y descarta lo que no tenga
 * forma de item, en vez de romper el render de la pagina publica.
 *
 * Tolera los items viejos `{time, activity}` sin `day` — son las ceremonias ya
 * cargadas, que quedan como jornada nula. Por eso agregar `day` no necesito
 * migrar ningun dato.
 */
export function parseSchedule(value: Json | null | undefined): ScheduleItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const { day, time, activity } = item as Record<string, unknown>;

    if (typeof activity !== "string" || !activity.trim()) return [];

    const parsedDay = parseDay(day);
    const parsedTime = typeof time === "string" ? time.trim() : "";

    // Una fila sin jornada ni hora no se puede ubicar en ningun lado.
    if (parsedDay === null && !parsedTime) return [];

    return [{ day: parsedDay, time: parsedTime, activity: activity.trim() }];
  });
}

/**
 * Ordena por jornada y despues por hora. Las horas son "HH:MM", asi que alcanza
 * el orden de string. Las filas sin jornada van primero (son el caso ceremonia,
 * donde no hay ninguna con jornada) y las sin hora van al final de su jornada.
 */
export function sortSchedule(items: ScheduleItem[]): ScheduleItem[] {
  return [...items].sort((a, b) => {
    if (a.day !== b.day) return (a.day ?? 0) - (b.day ?? 0);
    if (!a.time || !b.time) return (a.time ? 0 : 1) - (b.time ? 0 : 1);
    return a.time.localeCompare(b.time);
  });
}

/** Un bloque del programa: la jornada y lo que pasa dentro. */
export type ScheduleDay = { day: number | null; items: ScheduleItem[] };

/**
 * Agrupa el programa por jornada, conservando el orden de `sortSchedule`.
 * Una ceremonia devuelve un unico bloque con `day: null`, que la pagina publica
 * renderiza sin encabezado — es la lista plana de siempre.
 */
export function groupScheduleByDay(items: ScheduleItem[]): ScheduleDay[] {
  const groups: ScheduleDay[] = [];

  for (const item of sortSchedule(items)) {
    const last = groups.at(-1);
    if (last && last.day === item.day) last.items.push(item);
    else groups.push({ day: item.day, items: [item] });
  }

  return groups;
}
