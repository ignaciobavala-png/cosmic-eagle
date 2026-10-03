"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatDateRangeCompact } from "@/lib/format";
import { CtaLink, CTA_TONES } from "./CtaLink";
import type { TripCardData } from "./TripCard";
import { TripCover } from "./TripCover";

/**
 * Cartelera de Experiencias con filtros TODAS · SESIONES · RETIROS.
 *
 * Reemplaza los dos bloques narrativos con `Collapsible` que tenía /viajes
 * (feedback de la organización del 23/09,
 * `docs/entregas/2026-09-23-feedback-org/CEJ_Correcciones_Experiencias_Final.docx`
 * §4: "Inmediatamente después de la introducción deben aparecer todas las
 * experiencias disponibles... Incorporar filtros simples: TODAS · SESIONES ·
 * RETIROS"). La cartelera queda siempre abierta y con protagonismo en las
 * fechas, sin acordeón.
 *
 * **El filtrado es en el cliente sobre los `trips` que ya trajo el servidor.**
 * No hay refetch ni ruta nueva: el listado se filtra sobre el arreglo en
 * memoria, así que cambiar de filtro es instantáneo y la página conserva la
 * consulta y el estado que ya tenía.
 *
 * **Fecha y etiquetas en Montserrat** (correcciones del 03/10, §2.5 y §2.7):
 * en Sorts Mill Goudy los números son de estilo antiguo y "3 OCT 2026" se leía
 * con el número y el año más chicos que el mes; y la ubicación, más ancha en la
 * serif, se partía en dos renglones dentro de la píldora. Lo mismo en
 * `TripCard tone="light"`, que es la misma ficha en las carteleras.
 *
 * **Las etiquetas salen de la base, no del render.** El enum sigue siendo
 * `ceremonia` / `retiro`; lo que cambia es el nombre de cara a la gente. Acá se
 * usa el vocabulario del documento de la organización —"Sesión" y "Retiro"—,
 * el mismo que `src/lib/trip-type.ts` desde el 03/10.
 */
// `ceremonia`/`retiro` son el valor del enum, no la etiqueta: el badge sale de
// `Viajes.filter.badgeCeremonia` / `badgeRetiro`.
const TYPE_BADGE_KEY: Record<string, string> = {
  ceremonia: "badgeCeremonia",
  retiro: "badgeRetiro",
};

// Mismo vocabulario que el resto del sitio (`TripTypes.status`).
const STATUS_KEY: Record<string, string> = {
  closed: "closed",
  completed: "completed",
};

type FilterValue = "todas" | "ceremonia" | "retiro";

const FILTERS: FilterValue[] = ["todas", "ceremonia", "retiro"];

// El filtro guarda el valor del enum (es lo que va a `?tipo=`), pero las claves
// de `Viajes.filter` y `Viajes.empty` están por su nombre de cara a la gente.
// Sin este mapa la página mostraba la clave cruda, "VIAJES.FILTER.CEREMONIA"
// (correcciones del 03/10, §2.3).
const FILTER_KEY: Record<FilterValue, "todas" | "sesiones" | "retiros"> = {
  todas: "todas",
  ceremonia: "sesiones",
  retiro: "retiros",
};

const CHIP =
  "inline-flex items-center rounded-full border-[1.5px] px-5 py-2 text-label-sm uppercase transition-[color,background-color,border-color,box-shadow,transform] duration-[250ms]";

export function ExperienceFilter({
  trips,
  initialFilter = "todas",
}: {
  trips: TripCardData[];
  /** Viene de `?tipo=` para que los hijos del desplegable caigan filtrados. */
  initialFilter?: FilterValue;
}) {
  const t = useTranslations("Viajes");
  const [filter, setFilter] = useState<FilterValue>(initialFilter);

  const visible = useMemo(
    () => (filter === "todas" ? trips : trips.filter((t) => t.type === filter)),
    [trips, filter]
  );

  function choose(value: FilterValue) {
    setFilter(value);
    // El filtro queda en la URL sin navegar, mismo criterio que `?categoria=`
    // en `ContentLibrary`: compartir o refrescar el link cae en el mismo
    // filtro.
    const url = new URL(window.location.href);
    if (value === "todas") url.searchParams.delete("tipo");
    else url.searchParams.set("tipo", value);
    window.history.replaceState(null, "", url.toString());
  }

  const emptyLabel = t(`empty.${FILTER_KEY[filter]}`);

  return (
    <div className="mx-auto max-w-6xl">
      <div
        role="group"
        aria-label={t("filter.groupLabel")}
        className="mb-10 flex flex-wrap justify-center gap-2"
      >
        {FILTERS.map((option) => {
          const active = filter === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(option)}
              aria-pressed={active}
              className={`${CHIP} ${
                active
                  ? "border-[#05125a] bg-[#05125a] text-[#fff6eb]"
                  : `hover:scale-[1.04] ${CTA_TONES.dark}`
              }`}
            >
              {t(`filter.${FILTER_KEY[option]}`)}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="mx-auto max-w-md text-center text-body-md text-[#05125a]">
          {emptyLabel}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((trip) => (
            <ExperienceCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * La tarjeta de la cartelera. Reusa la piel clara de `TripCard tone="light"`
 * (fondo crema, portada en franja, tags dorado/azul) para no introducir una
 * ficha nueva, pero le agrega el botón directo a la experiencia que pide el
 * documento §4 —lo que obliga a que la tarjeta NO sea un `<a>` completo: un
 * enlace no puede contener otro enlace.
 */
function ExperienceCard({ trip }: { trip: TripCardData }) {
  const t = useTranslations("Viajes");
  const tTrip = useTranslations("TripTypes");
  const locale = useLocale() === "en" ? "en" : "es";
  const tipoKey = trip.type ? TYPE_BADGE_KEY[trip.type] : undefined;
  const tipo = tipoKey ? t(`filter.${tipoKey}`) : undefined;
  const status =
    trip.status && STATUS_KEY[trip.status]
      ? tTrip(`status.${STATUS_KEY[trip.status]}`)
      : undefined;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[16px] bg-[#fff6eb] shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-[transform,box-shadow] duration-300 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
      <TripCover tripId={trip.id} imageUrl={trip.image_url} variant="strip">
        {status && (
          <span className="absolute right-3 top-3 rounded-full bg-[#05125a]/80 px-3 py-1 text-label-sm uppercase text-white backdrop-blur-md">
            {status}
          </span>
        )}
      </TripCover>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex flex-wrap gap-2.5">
          {tipo && (
            <span className="rounded-full bg-[linear-gradient(135deg,#f9d78f,#b3964b)] whitespace-nowrap px-3.5 py-1.5 font-body text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white">
              {tipo}
            </span>
          )}
          {trip.location && (
            <span className="rounded-full border border-[#0079b3]/40 bg-[linear-gradient(135deg,rgba(0,121,179,0.2),rgba(5,18,90,0.2))] whitespace-nowrap px-3.5 py-1.5 font-body text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#05125a]">
              {trip.location}
            </span>
          )}
        </div>

        <h3 className="font-display text-headline-md text-[#05125a]">
          {trip.title}
        </h3>

        <div className="mt-4 border-t border-[#e0e0e0] pt-4">
          <span className="block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-primary-container">
            {t("card.date")}
          </span>
          <span className="mt-1.5 block font-body text-[19px] font-semibold uppercase leading-tight tracking-[0.02em] text-[#05125a]">
            {formatDateRangeCompact(trip.start_date, trip.end_date, locale)}
          </span>
        </div>

        <div className="mt-auto pt-6">
          {/* TODO: copy pendiente — el documento pide "un botón directo para
              ver la experiencia y/o inscribirse" sin dar el texto exacto.
              "Ver experiencia" es un placeholder hasta que la organización lo
              confirme. */}
          <CtaLink href={`/viajes/${trip.id}`} tone="goldSolid">
            {t("card.view")}
          </CtaLink>
        </div>
      </div>
    </article>
  );
}
