import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import { SITE_GROUPS, SITE_SLOTS, getSiteOverrides } from "@/lib/site-content";
import { createClient } from "@/lib/supabase/server";
import { formatDateRangeCompact } from "@/lib/format";
import { tripTypeLabel } from "@/lib/trip-type";
import { SlotEditor } from "./SlotEditor";
import { CoverEditor } from "./CoverEditor";

export const metadata = { title: "Multimedia | Admin" };

/**
 * Imagenes y textos del sitio, editables sin tocar el codigo.
 *
 * Los slots salen del registro (src/lib/site-content.ts), no de la base: una
 * seccion nueva aparece aca sola con solo agregarla al registro. La base solo
 * guarda los overrides, por eso cada slot muestra si esta editado y puede
 * volver al original.
 *
 * **Las portadas de viaje son la excepcion**: viven en `trips.image_url`, no en
 * `site_content`. Estan aca igual porque para la clienta son "una imagen del
 * sitio" y no tiene por que saber que se guardan en otro lado.
 *
 * Cada grupo es un `<details>` y no un acordeon con estado: sin JS, accesible
 * por teclado, y el navegador se encarga. Con 16 slots mas los viajes, abiertos
 * todos a la vez la pagina era una tira de scroll.
 */

function Accordion({
  title,
  summary,
  href,
  open,
  children,
}: {
  title: string;
  /** Renglon chico bajo el titulo: cuantas cosas hay y cuantas editadas. */
  summary: string;
  /** Ruta publica donde se ve el grupo. Opcional: las portadas no tienen una. */
  href?: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={open} className="group glass-card rounded-2xl">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 md:px-6 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <h2 className="font-display text-xl text-primary-fixed-dim">{title}</h2>
          <p className="mt-0.5 text-xs text-on-surface-variant">{summary}</p>
        </div>
        <ChevronDown
          size={18}
          className="shrink-0 text-on-surface-variant transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-outline-variant/40">
        {href && (
          <div className="flex justify-end px-5 pt-3 md:px-6">
            <Link
              href={href}
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-on-surface-variant transition-colors hover:text-primary-fixed-dim"
            >
              Ver en el sitio
              <ExternalLink size={13} />
            </Link>
          </div>
        )}
        {children}
      </div>
    </details>
  );
}

export default async function AdminMultimediaPage() {
  const supabase = await createClient();

  const [overrides, { data: trips }] = await Promise.all([
    getSiteOverrides(),
    supabase
      .from("trips")
      .select("id, title, type, location, start_date, end_date, image_url")
      .order("start_date"),
  ]);

  const editedCount = SITE_SLOTS.filter((slot) => overrides[slot.key]).length;
  const withCover = trips?.filter((trip) => trip.image_url).length ?? 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-primary-fixed-dim">
          Multimedia
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
          Las imágenes y los textos de las páginas públicas. Lo que cambies acá
          se ve en el sitio enseguida.{" "}
          {editedCount > 0
            ? `${editedCount} ${editedCount === 1 ? "elemento está editado" : "elementos están editados"}.`
            : "Todavía está todo con el contenido original."}
        </p>
      </div>

      <div className="space-y-4">
        {SITE_GROUPS.map((group, i) => {
          const edited = group.slots.filter((s) => overrides[s.key]).length;

          return (
            <Accordion
              key={group.id}
              title={group.title}
              href={group.href}
              open={i === 0}
              summary={`${group.slots.length} ${group.slots.length === 1 ? "elemento" : "elementos"}${
                edited > 0 ? ` · ${edited} editado${edited === 1 ? "" : "s"}` : ""
              }`}
            >
              {group.slots.map((slot) => (
                <SlotEditor
                  key={slot.key}
                  slot={slot}
                  value={overrides[slot.key] ?? slot.fallback}
                  edited={Boolean(overrides[slot.key])}
                />
              ))}
            </Accordion>
          );
        })}

        <Accordion
          title="Portadas de viajes"
          href="/viajes"
          summary={
            trips?.length
              ? `${trips.length} ${trips.length === 1 ? "viaje" : "viajes"} · ${withCover} con portada`
              : "Todavía no hay viajes cargados"
          }
        >
          {trips?.length ? (
            trips.map((trip) => (
              <CoverEditor
                key={trip.id}
                tripId={trip.id}
                title={trip.title}
                meta={[
                  tripTypeLabel(trip.type),
                  formatDateRangeCompact(trip.start_date, trip.end_date),
                  trip.location,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                imageUrl={trip.image_url}
              />
            ))
          ) : (
            <p className="px-5 py-5 text-sm text-on-surface-variant md:px-6">
              Cargá un viaje desde Retiros o Ceremonias y su portada aparece acá.
            </p>
          )}
        </Accordion>
      </div>

      <p className="mt-8 text-xs text-on-surface-variant">
        Las imágenes se achican y se convierten solas antes de subirse, así que
        podés cargar la foto tal cual sale de la cámara.
      </p>
    </div>
  );
}
