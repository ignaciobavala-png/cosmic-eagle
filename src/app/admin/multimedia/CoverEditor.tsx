"use client";

import { useActionState, useRef, useState } from "react";
import { Check, ImageUp } from "lucide-react";
import { compressImage } from "@/lib/compress-image";
import { TRIP_COVER_ASPECT, TRIP_COVER_MAX_PX } from "@/lib/trip-cover";
import { saveTripCover } from "./actions";
import type { SlotState } from "./actions";

const INITIAL: SlotState = { error: null };

/**
 * Portada de un viaje, editable desde Multimedia. Misma forma que `SlotEditor`
 * pero contra `trips.image_url` en vez de `site_content`.
 *
 * El recorte a 16:9 se hace acá, en el browser, con el mismo helper que usa el
 * form del viaje: la clienta ve la preview del recorte real antes de guardar,
 * con la zona segura marcada (ver `docs/PORTADAS.md`).
 */
export function CoverEditor({
  tripId,
  title,
  meta,
  imageUrl,
}: {
  tripId: string;
  title: string;
  /** Fechas y lugar, para distinguir dos viajes con el mismo nombre. */
  meta: string;
  imageUrl: string | null;
}) {
  const [state, save, saving] = useActionState(saveTripCover, INITIAL);
  const inputRef = useRef<HTMLInputElement>(null);
  // La preview recuerda contra que portada se hizo. Cuando el guardado trae la
  // nueva por props, deja de coincidir y se descarta sola — sin un efecto que
  // limpie estado despues de renderizar.
  const [preview, setPreview] = useState<{ url: string; base: string | null } | null>(
    null
  );
  const [working, setWorking] = useState(false);

  const previewUrl = preview?.base === imageUrl ? preview.url : null;

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setWorking(true);
    const cover = await compressImage(file, TRIP_COVER_MAX_PX, TRIP_COVER_ASPECT);
    setWorking(false);

    // El input tiene que llevar el archivo recortado, no el original.
    const transfer = new DataTransfer();
    transfer.items.add(cover);
    if (inputRef.current) inputRef.current.files = transfer.files;

    setPreview({ url: URL.createObjectURL(cover), base: imageUrl });
  }

  return (
    <div className="border-t border-outline-variant/30 px-5 py-5 first:border-t-0 md:px-6">
      <div className="min-w-0">
        <h3 className="text-sm font-medium text-on-surface">{title}</h3>
        <p className="mt-0.5 text-xs text-on-surface-variant">{meta}</p>
      </div>

      <form action={save} className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
        <input type="hidden" name="trip_id" value={tripId} />

        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-lg bg-surface-container-lowest sm:w-56">
          {previewUrl || imageUrl ? (
            <>
              {/* <img> y no next/image: la preview local es un blob: y el
                  optimizador no lo puede resolver. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl ?? imageUrl!}
                alt=""
                className="h-full w-full object-cover"
              />
              {/* Zona segura: lo que queda fuera del 75% central se pierde en
                  alguno de los recortes (tarjeta 4:3 o banner 21:9). */}
              <div className="pointer-events-none absolute inset-[12.5%] border border-dashed border-primary-fixed-dim/60" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-on-surface-variant/70">
              Sin portada
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition-colors hover:border-primary-fixed-dim hover:text-on-surface">
            <ImageUp size={15} />
            {working ? "Recortando…" : "Elegir imagen"}
            <input
              ref={inputRef}
              type="file"
              name="file"
              accept="image/*"
              onChange={handleFile}
              className="sr-only"
            />
          </label>

          <p className="text-xs text-on-surface-variant">
            Se recorta sola a 16:9 desde el centro. Deja lo importante dentro del
            recuadro punteado: es lo que se ve en todos los tamaños.
          </p>

          <div>
            <button
              type="submit"
              disabled={saving || working || !previewUrl}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-container px-4 py-2 text-sm font-medium text-on-primary transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Check size={15} />
              {saving ? "Guardando…" : "Guardar portada"}
            </button>
          </div>

          {state.error && <p className="text-xs text-error">{state.error}</p>}
        </div>
      </form>
    </div>
  );
}
