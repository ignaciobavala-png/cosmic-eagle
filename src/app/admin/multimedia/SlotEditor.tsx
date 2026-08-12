"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, ImageUp, RotateCcw } from "lucide-react";
import { compressImage } from "@/lib/compress-image";
import type { Slot } from "@/lib/site-content";
import { resetSlot, saveSlot, type SlotState } from "./actions";

const INITIAL: SlotState = { error: null };

export function SlotEditor({
  slot,
  value,
  edited,
}: {
  slot: Slot;
  /** Valor que se esta mostrando hoy en el sitio (override o el del repo). */
  value: string;
  /** true si hay override cargado: sin esto no se sabe que se puede restaurar. */
  edited: boolean;
}) {
  const [state, save, saving] = useActionState(saveSlot, INITIAL);
  const [resetState, reset, resetting] = useActionState(resetSlot, INITIAL);

  const isImage = slot.type === "image";
  const error = state.error ?? resetState.error;

  return (
    <div className="border-t border-outline-variant/30 px-5 py-5 first:border-t-0 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-on-surface">{slot.label}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-on-surface-variant">
            {slot.help}
          </p>
        </div>
        {edited && (
          <form action={reset} className="shrink-0">
            <input type="hidden" name="key" value={slot.key} />
            <button
              type="submit"
              disabled={resetting}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-on-surface-variant transition-colors hover:text-primary-fixed-dim disabled:opacity-50"
            >
              <RotateCcw size={13} />
              {resetting ? "Restaurando…" : "Volver al original"}
            </button>
          </form>
        )}
      </div>

      <form action={save} className="mt-3">
        <input type="hidden" name="key" value={slot.key} />

        {isImage ? (
          <ImageField slot={slot} value={value} saving={saving} />
        ) : (
          <TextField slot={slot} value={value} saving={saving} />
        )}
      </form>

      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}

function SaveButton({
  saving,
  disabled,
}: {
  saving: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={saving || disabled}
      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-container px-4 py-2 text-sm font-medium text-on-primary transition-opacity hover:opacity-90 disabled:opacity-40"
    >
      <Check size={15} />
      {saving ? "Guardando…" : "Guardar"}
    </button>
  );
}

function TextField({
  slot,
  value,
  saving,
}: {
  slot: Slot;
  value: string;
  saving: boolean;
}) {
  const [draft, setDraft] = useState(value);

  // Tras guardar, el server manda el valor nuevo por props: si el borrador no
  // se resincroniza, el textarea sigue mostrando lo viejo al restaurar.
  useEffect(() => setDraft(value), [value]);

  const dirty = draft.trim() !== value.trim();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      {slot.type === "multiline" ? (
        <textarea
          name="value"
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-fixed-dim"
        />
      ) : (
        <input
          type="text"
          name="value"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-fixed-dim"
        />
      )}
      <SaveButton saving={saving} disabled={!dirty} />
    </div>
  );
}

function ImageField({
  slot,
  value,
  saving,
}: {
  slot: Slot;
  value: string;
  saving: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  // Al guardar, el valor nuevo llega por props y la preview local sobra.
  useEffect(() => {
    setPreview(null);
    setInfo(null);
  }, [value]);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setWorking(true);
    const compressed = await compressImage(file, slot.maxPx);
    setWorking(false);

    // El input tiene que llevar el archivo comprimido, no el original: es lo
    // que se sube cuando el form hace submit.
    const transfer = new DataTransfer();
    transfer.items.add(compressed);
    if (inputRef.current) inputRef.current.files = transfer.files;

    setPreview(URL.createObjectURL(compressed));
    setInfo(
      `${formatSize(file.size)} → ${formatSize(compressed.size)} · lista para subir`
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div
        className="w-full shrink-0 overflow-hidden rounded-lg bg-surface-container-lowest sm:w-44"
        style={{ aspectRatio: slot.ratio ?? "16/9" }}
      >
        {/* <img> y no next/image: la preview local es un blob: y el optimizador
            no lo puede resolver. En el admin no hay costo de LCP que cuidar. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview ?? value}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition-colors hover:border-primary-fixed-dim hover:text-on-surface">
          <ImageUp size={15} />
          {working ? "Preparando…" : "Elegir imagen"}
          <input
            ref={inputRef}
            type="file"
            name="file"
            accept="image/*"
            onChange={handleFile}
            className="sr-only"
          />
        </label>

        {info && <p className="text-xs text-on-surface-variant">{info}</p>}

        <div>
          <SaveButton saving={saving || working} disabled={!preview} />
        </div>
      </div>
    </div>
  );
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}
