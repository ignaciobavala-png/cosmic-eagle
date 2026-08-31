"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, ImageUp, RotateCcw } from "lucide-react";
import { compressImage } from "@/lib/compress-image";
import { compressVideo, MAX_DURATION_SECONDS } from "@/lib/compress-video";
import { isVideoUrl } from "@/lib/media";
import { isEnabled, type Slot } from "@/lib/site-content";
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
  const isBoolean = slot.type === "boolean";
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
        ) : isBoolean ? (
          <BooleanField value={value} saving={saving} />
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

function BooleanField({
  value,
  saving,
}: {
  value: string;
  saving: boolean;
}) {
  const enabled = isEnabled(value);
  const [checked, setChecked] = useState(enabled);
  const [lastValue, setLastValue] = useState(value);

  // Tras guardar, el server manda el valor nuevo por props: si el estado no se
  // resincroniza, el tilde sigue mostrando lo viejo al restaurar. Se ajusta
  // durante el render (estado derivado) para no encadenar renders.
  if (lastValue !== value) {
    setLastValue(value);
    setChecked(enabled);
  }

  const dirty = checked !== enabled;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="flex w-fit cursor-pointer select-none items-center gap-3">
        <input
          type="checkbox"
          name="value"
          value="true"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="h-4 w-4 shrink-0 accent-primary-fixed-dim"
        />
        <span className="text-sm text-on-surface">
          {checked ? "Sí, se muestra el texto" : "No, solo la imagen"}
        </span>
      </label>
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
  const [previewIsVideo, setPreviewIsVideo] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const acceptsVideo = slot.video === true;

  // Al guardar, el valor nuevo llega por props y la preview local sobra.
  useEffect(() => {
    setPreview(null);
    setInfo(null);
    setProblem(null);
  }, [value]);

  function attach(file: File) {
    // El input tiene que llevar el archivo comprimido, no el original: es lo
    // que se sube cuando el form hace submit.
    const transfer = new DataTransfer();
    transfer.items.add(file);
    if (inputRef.current) inputRef.current.files = transfer.files;
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setProblem(null);
    setWorking(true);

    if (file.type.startsWith("video/")) {
      // La recodificacion corre en tiempo real: mientras dura, el boton dice
      // "Comprimiendo" y no hay nada que apurar.
      const result = await compressVideo(file);
      setWorking(false);

      if (!result.ok) {
        setProblem(result.error);
        setPreview(null);
        setInfo(null);
        // Se limpia el input para que no quede el archivo rechazado listo para
        // subir si la clienta le da Guardar igual.
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      attach(result.file);
      setPreview(URL.createObjectURL(result.file));
      setPreviewIsVideo(true);
      setInfo(
        `${formatSize(file.size)} → ${formatSize(result.file.size)} · listo para subir`
      );
      return;
    }

    const compressed = await compressImage(file, slot.maxPx);
    setWorking(false);

    attach(compressed);
    setPreview(URL.createObjectURL(compressed));
    setPreviewIsVideo(false);
    setInfo(
      `${formatSize(file.size)} → ${formatSize(compressed.size)} · lista para subir`
    );
  }

  const showVideo = preview ? previewIsVideo : isVideoUrl(value);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div
        className="w-full shrink-0 overflow-hidden rounded-lg bg-surface-container-lowest sm:w-44"
        style={{ aspectRatio: slot.ratio ?? "16/9" }}
      >
        {showVideo ? (
          <video
            src={preview ?? value}
            muted
            loop
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          /* <img> y no next/image: la preview local es un blob: y el optimizador
             no lo puede resolver. En el admin no hay costo de LCP que cuidar. */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={preview ?? value}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition-colors hover:border-primary-fixed-dim hover:text-on-surface">
          <ImageUp size={15} />
          {working
            ? "Preparando…"
            : acceptsVideo
              ? "Elegir imagen o video"
              : "Elegir imagen"}
          <input
            ref={inputRef}
            type="file"
            name="file"
            accept={acceptsVideo ? "image/*,video/*" : "image/*"}
            onChange={handleFile}
            className="sr-only"
          />
        </label>

        {acceptsVideo && !info && !problem && (
          <p className="text-xs text-on-surface-variant">
            También puedes subir un video corto (hasta {MAX_DURATION_SECONDS}{" "}
            segundos). Se reproduce solo, en silencio y en bucle. Comprimirlo
            tarda lo que dura el video.
          </p>
        )}

        {info && <p className="text-xs text-on-surface-variant">{info}</p>}
        {problem && <p className="text-xs text-error">{problem}</p>}

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
