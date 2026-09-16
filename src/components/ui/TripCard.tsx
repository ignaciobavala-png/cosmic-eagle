import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatDateRangeCompact } from "@/lib/format";
import { isTripType, tripTypeLabel } from "@/lib/trip-type";
import type { TripDate } from "@/lib/trip-groups";
import { TripCover } from "./TripCover";

export type TripCardData = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  image_url: string | null;
  /** Opcional: solo el listado de /viajes avisa cuando el cupo ya no esta abierto. */
  status?: string | null;
  /** Opcional: retiro o ceremonia. Solo lo pide el listado, no la home. */
  type?: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  closed: "Cupo completo",
  completed: "Finalizado",
};

/**
 * P4 — Tarjeta de viaje con portada. Badge de ubicacion superpuesto, titulo
 * serif, descripcion y pie con label FECHA + accion circular.
 * Se repite en la home y en /viajes (el listado todavia usa su propio markup).
 *
 * La portada la resuelve `TripCover`, que es quien decide el recorte (ver
 * docs/PORTADAS.md).
 */
export function TripCard({
  trip,
  tone = "dark",
  dates,
}: {
  trip: TripCardData;
  /**
   * Las fechas de la experiencia cuando hay mas de una en el mismo lugar (ver
   * `groupTripsByPlace`). Con una sola, o sin la prop, la tarjeta es la de
   * siempre. Con varias, el pie pasa a ser una fila de fechas y **la tarjeta
   * deja de ser un link**: cada fecha lleva a su propia experiencia, y un
   * `<a>` no puede contener otros `<a>`.
   */
  dates?: TripDate[];
  /**
   * `dark` es la tarjeta de vidrio de siempre, sobre el fondo azul del sitio.
   * `light` es la del rediseño: fondo blanco, para la cartelera dorada de
   * /viajes, donde el vidrio oscuro directamente se pierde. Cambia solo la
   * piel; la estructura, el recorte de la portada y el link son los mismos.
   */
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
  const many = (dates?.length ?? 0) > 1;

  const className = light
    ? "group flex h-full flex-col overflow-hidden rounded-[16px] bg-[#fff6eb] shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-[transform,box-shadow] duration-300 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
    : "group flex flex-col overflow-hidden rounded-2xl glass-card transition-colors duration-300 hover:border-primary-fixed-dim/35";

  const content = (
    <>
      {light ? (
        /* La tarjeta de la cartelera, segun `calendariodeviajes_design.png`
           (correccion del 02/09): la portada es una franja apaisada y limpia, y
           los DOS tags van debajo de ella, no superpuestos. El de tipo es la
           pildora dorada y el de lugar el azul translucido con borde. */
        <>
          <TripCover tripId={trip.id} imageUrl={trip.image_url} variant="strip">
            {trip.status && STATUS_LABEL[trip.status] && (
              <span className="absolute right-3 top-3 rounded-full bg-[#05125a]/80 px-3 py-1 text-label-sm uppercase text-white backdrop-blur-md">
                {STATUS_LABEL[trip.status]}
              </span>
            )}
          </TripCover>

          <div className="flex flex-1 flex-col p-5">
            <div className="mb-4 flex flex-wrap gap-2.5">
              {isTripType(trip.type) && (
                <span className="rounded-full bg-[linear-gradient(135deg,#f9d78f,#b3964b)] px-3.5 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.11em] text-white">
                  {tripTypeLabel(trip.type)}
                </span>
              )}
              {trip.location && (
                <span className="rounded-full border border-[#0079b3]/40 bg-[linear-gradient(135deg,rgba(0,121,179,0.2),rgba(5,18,90,0.2))] px-3.5 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.11em] text-[#05125a]">
                  {trip.location}
                </span>
              )}
            </div>

            <h3 className="font-display text-headline-md text-[#05125a]">
              {trip.title}
            </h3>
            {/* Tres lineas y puntos suspensivos: correccion del 03/09 de
                Julia. La descripcion de la tarjeta es un adelanto, el texto
                completo esta en la pagina del viaje. */}
            {trip.description && (
              <p className="mt-2 line-clamp-3 flex-1 text-[13px] leading-relaxed text-[#05125a]/85">
                {trip.description}
              </p>
            )}

            <div className="mt-4 border-t border-[#e0e0e0] pt-4">
              {/* El label va en `on-primary-container` y no en el `#b3964b`
                  del mockup: ese oro sobre blanco da 3,4:1 en un texto de
                  10px (ver la sesion del 28/08). Mismo rol de la paleta, un
                  tono mas oscuro. */}
              <span className="block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-primary-container">
                {many ? "Fechas" : "Fecha"}
              </span>

              {many ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {dates!.map((date) => (
                    <Link
                      key={date.id}
                      href={`/viajes/${date.id}`}
                      aria-label={`${trip.title}, ${formatDateRangeCompact(date.start_date, date.end_date)}`}
                      className="rounded-full border-2 border-[#05125a] px-3.5 py-1.5 font-display text-[15px] font-bold uppercase tracking-[0.04em] text-[#05125a] transition-colors duration-300 hover:bg-[#05125a] hover:text-white"
                    >
                      {formatDateRangeCompact(date.start_date, date.end_date)}
                    </Link>
                  ))}
                </div>
              ) : (
                <div>
                  {/* La fecha es el dato por el que se mira la tarjeta y a
                      13px quedaba por debajo de la descripcion, que es un
                      adelanto. Sube de 13px a 21px: queda por encima del
                      cuerpo y del resto de la ficha, pero todavia por debajo
                      del titulo, que es `headline-md` (24px) — la jerarquia no
                      se invierte. Sigue en `uppercase` porque el mes lo da
                      `toLocaleDateString` con `month: "short"`, o sea "oct" en
                      minuscula. Pedido de Ignacio del 15/09
                      (`docs/entregas/2026-09-15-ignacio-ajustes`). */}
                  {/* **Sin el cuadradito de la flecha** (pedido de Ignacio,
                      16/09): la ficha clara de las carteleras —Sesiones y
                      Viajes— se queda solo con la fecha. Con el se fue el
                      `flex items-end justify-between`, que existia para
                      repartir fecha y flecha a los extremos. La tarjeta entera
                      sigue siendo el link, asi que no se pierde ninguna
                      navegacion: lo que se va es un adorno. La version oscura
                      (`tone="dark"`, mas abajo) conserva la suya porque hoy
                      solo la usa `TripsSection`, que no esta en ninguna ruta. */}
                  <span className="mt-1.5 block font-display text-[21px] font-bold uppercase leading-tight tracking-[0.03em] text-[#05125a]">
                    {formatDateRangeCompact(trip.start_date, trip.end_date)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
        <TripCover tripId={trip.id} imageUrl={trip.image_url} variant="card">
          <div className="absolute inset-0 bg-[#05102a]/20" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {isTripType(trip.type) && (
              <span className="rounded-full bg-primary-container/90 px-3 py-1 text-label-sm uppercase text-on-primary backdrop-blur-md">
                {tripTypeLabel(trip.type)}
              </span>
            )}
            {trip.location && (
              <span className="rounded-full border border-primary-fixed-dim/40 bg-[#05060a]/70 px-3 py-1 text-label-sm uppercase text-primary-fixed-dim backdrop-blur-md">
                {trip.location}
              </span>
            )}
          </div>
          {trip.status && STATUS_LABEL[trip.status] && (
            <span className="absolute right-4 top-4 rounded-full border border-outline/40 bg-[#05060a]/70 px-3 py-1 text-label-sm uppercase text-on-surface-variant backdrop-blur-md">
              {STATUS_LABEL[trip.status]}
            </span>
          )}
        </TripCover>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h3 className="font-display text-headline-md text-on-surface">
            {trip.title}
          </h3>
          {trip.description && (
            <p className="mt-3 line-clamp-4 text-body-md text-on-surface-variant">
              {trip.description}
            </p>
          )}

          <div className="mt-6 border-t border-primary-fixed-dim/12 pt-4">
            <span className="block text-label-sm uppercase text-on-surface-variant/60">
              {many ? "Fechas" : "Fecha"}
            </span>

            {many ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {dates!.map((date) => (
                  <Link
                    key={date.id}
                    href={`/viajes/${date.id}`}
                    aria-label={`${trip.title}, ${formatDateRangeCompact(date.start_date, date.end_date)}`}
                    className="rounded-full border border-primary-container/55 px-3.5 py-1.5 text-label-sm uppercase text-primary-container transition-colors duration-300 hover:bg-primary-container hover:text-on-primary"
                  >
                    {formatDateRangeCompact(date.start_date, date.end_date)}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-end justify-between gap-4">
                <span className="mt-1 block text-body-md text-on-surface">
                  {formatDateRangeCompact(trip.start_date, trip.end_date)}
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary-fixed-dim/35 text-primary-fixed-dim transition-colors group-hover:bg-primary-container group-hover:text-on-primary"
                >
                  <ArrowUpRight size={18} />
                </span>
              </div>
            )}
          </div>
        </div>
        </>
      )}
    </>
  );

  // Con varias fechas la tarjeta no puede ser un link: los links son las
  // fechas, y un `<a>` no puede contener otros `<a>`.
  return many ? (
    <div className={className}>{content}</div>
  ) : (
    <Link href={`/viajes/${trip.id}`} className={className}>
      {content}
    </Link>
  );
}
