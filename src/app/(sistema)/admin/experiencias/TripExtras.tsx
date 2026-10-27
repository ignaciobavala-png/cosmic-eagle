"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";
import {
  MAX_GALLERY_IMAGES,
  MAX_ROOM_OPTIONS,
  type RoomOption,
} from "@/lib/trip-rooms";

const inputClass =
  "bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors";
const labelClass = "text-sm text-on-surface-variant tracking-[0.02em]";
const hintClass = "text-xs text-on-surface-variant/70";

const BUCKET = "trip-images";

/**
 * La galería del lugar de un retiro (Sofía, 27/10: "al menos 3 imágenes").
 * Cada foto se comprime en el browser y se sube al bucket de portadas al
 * elegirla; el form manda sólo la lista de URLs, en un hidden. Una foto que se
 * saca de la lista queda en el bucket hasta que se borre el viaje: es el costo
 * de que "Guardar" siga siendo lo único que escribe en la base.
 */
export function GalleryField({ initial }: { initial: string[] }) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const next = [...urls];
    for (const original of Array.from(files)) {
      if (next.length >= MAX_GALLERY_IMAGES) {
        setError(`Máximo ${MAX_GALLERY_IMAGES} imágenes.`);
        break;
      }
      if (!original.type.startsWith("image/") || original.type === "image/svg+xml") {
        setError("Sólo JPG, PNG o WebP.");
        continue;
      }
      const file = await compressImage(original, 1600);
      const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "webp";
      const path = `gallery-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type });
      if (upErr) {
        setError("No se pudo subir una imagen. Probá de nuevo.");
        continue;
      }
      next.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    }
    setUrls(next);
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= urls.length) return;
    const next = [...urls];
    [next[i], next[j]] = [next[j], next[i]];
    setUrls(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="gallery" value={JSON.stringify(urls)} />
      <span className={labelClass}>Fotos del lugar</span>
      {urls.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {urls.map((url, i) => (
            <li key={url} className="flex flex-col gap-1.5">
              {/* <img> y no next/image: es una vista previa de admin. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
              <div className="flex gap-1 text-xs">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded border border-outline-variant px-2 py-1 disabled:opacity-30" aria-label="Mover antes">←</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === urls.length - 1} className="rounded border border-outline-variant px-2 py-1 disabled:opacity-30" aria-label="Mover después">→</button>
                <button type="button" onClick={() => setUrls(urls.filter((u) => u !== url))} className="ml-auto rounded border border-outline-variant px-2 py-1 text-error">Quitar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        disabled={busy}
        onChange={(e) => onPick(e.target.files)}
        className={inputClass}
      />
      <p className={hintClass}>
        {busy
          ? "Subiendo…"
          : `Para un retiro, al menos 3 (${urls.length} cargadas, máximo ${MAX_GALLERY_IMAGES}). Se comprimen solas; se guardan al apretar Guardar.`}
      </p>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

const SUGERIDAS = ["Private room", "Shared room", "Healers & artists"];

/**
 * Tipos de habitación con su precio (Sofía, 27/10). Vacío = el retiro no tiene
 * variantes y el detalle muestra sólo el aporte de siempre.
 */
export function RoomOptionsField({ initial }: { initial: RoomOption[] }) {
  const [rows, setRows] = useState<{ label: string; price: string }[]>(
    initial.map((r) => ({ label: r.label, price: String(r.price) }))
  );

  const clean = rows
    .filter((r) => r.label.trim() && r.price !== "" && Number(r.price) >= 0)
    .map((r) => ({ label: r.label.trim(), price: Number(r.price) }));

  function set(i: number, patch: Partial<{ label: string; price: string }>) {
    setRows(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="room_options" value={JSON.stringify(clean)} />
      <span className={labelClass}>Tipos de habitación y precio (USD)</span>
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            list="room-suggestions"
            value={r.label}
            onChange={(e) => set(i, { label: e.target.value })}
            placeholder="Private room"
            maxLength={60}
            className={`${inputClass} min-w-0 flex-1`}
            aria-label="Tipo de habitación"
          />
          <input
            type="number"
            min={0}
            step="0.01"
            value={r.price}
            onChange={(e) => set(i, { price: e.target.value })}
            placeholder="2700"
            className={`${inputClass} w-28`}
            aria-label="Precio"
          />
          <button type="button" onClick={() => setRows(rows.filter((_, k) => k !== i))} className="rounded border border-outline-variant px-3 text-sm text-error">
            Quitar
          </button>
        </div>
      ))}
      <datalist id="room-suggestions">
        {SUGERIDAS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {rows.length < MAX_ROOM_OPTIONS && (
        <button type="button" onClick={() => setRows([...rows, { label: "", price: "" }])} className="self-start rounded border border-outline-variant px-3 py-1.5 text-sm">
          + Agregar tipo
        </button>
      )}
      <p className={hintClass}>
        Se muestran al abrir el aporte en el detalle del viaje. El monto que
        cobra la inscripción sigue siendo el «Precio» de arriba.
      </p>
    </div>
  );
}
