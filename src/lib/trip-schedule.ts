import type { Json } from "@/lib/supabase/types";

/** Una fila del programa: hora ("11:00") + que pasa a esa hora. */
export type ScheduleItem = { time: string; activity: string };

/**
 * `trips.schedule` es jsonb, asi que del lado de TS llega como `Json`: puede ser
 * cualquier cosa. Esto lo normaliza a filas usables y descarta lo que no tenga
 * forma de item, en vez de romper el render de la pagina publica.
 */
export function parseSchedule(value: Json | null | undefined): ScheduleItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const { time, activity } = item as Record<string, unknown>;
    if (typeof time !== "string" || typeof activity !== "string") return [];
    if (!time.trim() || !activity.trim()) return [];
    return [{ time: time.trim(), activity: activity.trim() }];
  });
}

/** Ordena por hora. Las horas son "HH:MM", asi que alcanza el orden de string. */
export function sortSchedule(items: ScheduleItem[]): ScheduleItem[] {
  return [...items].sort((a, b) => a.time.localeCompare(b.time));
}
