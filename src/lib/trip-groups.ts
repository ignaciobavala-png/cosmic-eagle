import type { TripCardData } from "@/components/ui/TripCard";

export type TripDate = {
  id: string;
  start_date: string;
  end_date: string;
};

export type TripGroup = {
  key: string;
  /**
   * La experiencia que representa al grupo: la de fecha mas cercana. De ella
   * salen la portada, el titulo y la descripcion.
   */
  trip: TripCardData;
  /** Todas las fechas del grupo, de la mas cercana a la mas lejana. */
  dates: TripDate[];
};

/**
 * Agrupa las experiencias que son la misma cosa en el mismo lugar y solo
 * cambian de fecha.
 *
 * El problema que resuelve (reportado el 08/09): en el calendario aparecian dos
 * tarjetas "Sesion en Santiago" pegadas, con la misma portada, el mismo texto y
 * el mismo lugar, distinguiendose solo por un "3 OCT" y un "4 OCT" al pie. Se
 * leian como un error de carga. Son dos sesiones distintas —dos flyers
 * distintos, ver docs/EXPERIENCIAS_2026.md— pero mostrarlas como dos tarjetas
 * no lo comunica.
 *
 * Es la peticion que Julia ya habia hecho (docs/CORRECCIONES_JULIA_0309.md §3),
 * resuelta **solo en la presentacion**: cada fecha sigue siendo su propio
 * `trip`, con su cupo, su pagina y su inscripcion. No hace falta migracion, y
 * por eso mismo esto NO responde la pregunta de fondo que sigue abierta con
 * Estela y Sofia (si una sesion deberia ser una fila con varias fechas).
 *
 * **Se agrupa por tipo + ciudad y pais, ignorando el barrio.** `location` es
 * una columna generada `[area, ]ciudad, pais`, asi que la ciudad y el pais son
 * los dos ultimos tramos. Ignorar el area es deliberado: las sesiones del 3 y
 * el 4 de octubre dicen "El Arrayan, Santiago, Chile" y la de diciembre solo
 * "Santiago, Chile" — con el area adentro de la clave quedarian separadas y
 * volveria la tarjeta repetida. El tipo SI entra en la clave: en Tulum hay una
 * Sesion y un Viaje, y son cosas distintas.
 *
 * El orden de entrada se respeta (las paginas ya piden `order by start_date`),
 * asi que el grupo aparece donde aparecia su fecha mas cercana.
 */
export function groupTripsByPlace(trips: TripCardData[]): TripGroup[] {
  const groups = new Map<string, TripGroup>();

  for (const trip of trips) {
    const key = `${trip.type ?? ""}|${cityAndCountry(trip.location)}`;
    const date: TripDate = {
      id: trip.id,
      start_date: trip.start_date,
      end_date: trip.end_date,
    };

    const existing = groups.get(key);
    if (existing) {
      existing.dates.push(date);
      // Si los miembros no comparten el lugar exacto, la tarjeta muestra lo que
      // si tienen en comun: mentir con el barrio de uno solo es peor que
      // nombrar la ciudad.
      if (existing.trip.location !== trip.location) {
        existing.trip = {
          ...existing.trip,
          location: cityAndCountry(existing.trip.location) || existing.trip.location,
        };
      }
      continue;
    }

    groups.set(key, { key, trip, dates: [date] });
  }

  for (const group of groups.values()) {
    group.dates.sort((a, b) => a.start_date.localeCompare(b.start_date));
  }

  return [...groups.values()];
}

/** "El Arrayan, Santiago, Chile" -> "Santiago, Chile". */
function cityAndCountry(location: string | null): string {
  if (!location) return "";
  const parts = location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.slice(-2).join(", ");
}
