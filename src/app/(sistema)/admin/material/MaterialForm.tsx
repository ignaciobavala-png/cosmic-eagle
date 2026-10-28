"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { MaterialDocument } from "@/components/material/MaterialDocument";
import { compressImage } from "@/lib/compress-image";
import { createClient } from "@/lib/supabase/client";
import {
  MATERIAL_BLOCK_LABELS,
  MATERIAL_BUCKET,
  MATERIAL_COVER,
  MATERIAL_IMAGE_KINDS,
  MATERIAL_PREFIX,
  isImageKind,
  parseMaterialBlocks,
  type MaterialBlock,
  type MaterialBlockType,
} from "@/lib/material";
import type { Tables } from "@/lib/supabase/types";
import type { MaterialFormState } from "./actions";

const inputClass =
  "bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors";
const labelClass = "text-sm text-on-surface-variant tracking-[0.02em]";
const fileClass =
  "text-sm text-on-surface-variant file:mr-3 file:rounded-lg file:border file:border-outline-variant file:bg-surface-container-low file:px-3 file:py-1.5 file:text-sm file:text-on-surface-variant";

/** Lo que se muestra de cada tipo en la barra de "agregar". */
const ADD_ORDER: MaterialBlockType[] = [
  "capitulo",
  "texto",
  "destacado",
  "lista",
  "imagen",
];

function newBlock(type: MaterialBlockType): MaterialBlock {
  const id = crypto.randomUUID();
  switch (type) {
    case "capitulo":
      return { id, type, parte: "", titulo: "", resto: "" };
    case "texto":
      return { id, type, texto: "", columnas: 2 };
    case "destacado":
      return { id, type, texto: "" };
    case "lista":
      return { id, type, texto: "" };
    case "imagen":
      return { id, type, kind: "banner", url: "", alt: "" };
  }
}

/**
 * Comprime, recorta a la proporcion del tipo y sube directo a Storage desde el
 * browser (como `AudioField`): al form solo viaja la URL, y la imagen no pasa
 * por el cuerpo del server action — con el tope de ~4,5MB de una funcion de
 * Vercel. La escritura en `site-assets` es solo admin por RLS.
 */
async function uploadImage(
  file: File,
  maxPx: number,
  aspect: number
): Promise<string | null> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return null;
  }
  const prepared = await compressImage(file, maxPx, aspect);
  const ext = prepared.type.split("/")[1]?.replace("jpeg", "jpg") ?? "webp";
  // Nombre nuevo en cada subida: con un path fijo el CDN sigue sirviendo la
  // imagen vieja despues de reemplazarla.
  const path = `${MATERIAL_PREFIX}${crypto.randomUUID()}.${ext}`;

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(MATERIAL_BUCKET)
    .upload(path, prepared, { contentType: prepared.type });
  if (error) return null;

  return supabase.storage.from(MATERIAL_BUCKET).getPublicUrl(path).data.publicUrl;
}

function ImageField({
  label,
  hint,
  aspect,
  maxPx,
  url,
  onChange,
  onBusy,
}: {
  label: string;
  hint: string;
  aspect: number;
  maxPx: number;
  url: string;
  onChange: (url: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");

  async function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setStatus("uploading");
    onBusy(true);
    const uploaded = await uploadImage(file, maxPx, aspect);
    onBusy(false);

    if (!uploaded) {
      setStatus("error");
      return;
    }
    onChange(uploaded);
    setStatus("idle");
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      {url && (
        <div
          className="w-full max-w-48 overflow-hidden rounded-lg border border-outline-variant"
          style={{ aspectRatio: aspect }}
        >
          {/* <img>: la URL ya es publica y la imagen llega recortada. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        disabled={status === "uploading"}
        onChange={pick}
        className={fileClass}
      />
      <p className="text-xs text-on-surface-variant">
        {status === "uploading" && "Subiendo… espera a que termine antes de guardar. "}
        {status === "error" && "No se pudo subir la imagen. Prueba con un JPG, PNG o WebP. "}
        {status === "idle" && hint}
      </p>
      {url && status !== "uploading" && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="self-start text-xs text-on-surface-variant underline underline-offset-4"
        >
          Quitar la imagen
        </button>
      )}
    </div>
  );
}

function BlockFields({
  block,
  onChange,
  onBusy,
}: {
  block: MaterialBlock;
  onChange: (block: MaterialBlock) => void;
  onBusy: (busy: boolean) => void;
}) {
  switch (block.type) {
    case "capitulo":
      return (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Línea chica de arriba (opcional)</label>
            <input
              type="text"
              value={block.parte}
              onChange={(e) => onChange({ ...block, parte: e.target.value })}
              placeholder="Parte I"
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Título (va en negrita)</label>
              <input
                type="text"
                value={block.titulo}
                onChange={(e) => onChange({ ...block, titulo: e.target.value })}
                placeholder="Recuperar el poder:"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Continuación (opcional)</label>
              <input
                type="text"
                value={block.resto}
                onChange={(e) => onChange({ ...block, resto: e.target.value })}
                placeholder="Liberar condicionamientos…"
                className={inputClass}
              />
            </div>
          </div>
          <p className="text-xs text-on-surface-variant">
            Cada capítulo arranca página nueva al guardar como PDF y entra en el
            índice.
          </p>
        </div>
      );

    case "texto":
      return (
        <div className="flex flex-col gap-3">
          <textarea
            rows={8}
            value={block.texto}
            onChange={(e) => onChange({ ...block, texto: e.target.value })}
            className={inputClass}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-on-surface-variant">
              Una línea en blanco separa párrafos. Para negrita: **así**.
            </p>
            <label className="flex items-center gap-2 text-sm text-on-surface-variant">
              Columnas
              <select
                value={block.columnas}
                onChange={(e) =>
                  onChange({ ...block, columnas: e.target.value === "1" ? 1 : 2 })
                }
                className={`${inputClass} py-1.5`}
              >
                <option value={2}>Dos</option>
                <option value={1}>Una</option>
              </select>
            </label>
          </div>
        </div>
      );

    case "destacado":
      return (
        <div className="flex flex-col gap-1.5">
          <textarea
            rows={3}
            value={block.texto}
            onChange={(e) => onChange({ ...block, texto: e.target.value })}
            className={inputClass}
          />
          <p className="text-xs text-on-surface-variant">
            Una frase en letra grande dentro de la columna.
          </p>
        </div>
      );

    case "lista":
      return (
        <div className="flex flex-col gap-1.5">
          <textarea
            rows={5}
            value={block.texto}
            onChange={(e) => onChange({ ...block, texto: e.target.value })}
            className={inputClass}
          />
          <p className="text-xs text-on-surface-variant">Un ítem por línea.</p>
        </div>
      );

    case "imagen": {
      const spec = MATERIAL_IMAGE_KINDS[block.kind];
      return (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Tipo de imagen</label>
            <select
              value={block.kind}
              onChange={(e) => {
                const kind = e.target.value;
                // Cambiar el tipo cambia la proporcion: la imagen ya subida
                // quedaria deformada, asi que se pide de nuevo.
                if (isImageKind(kind)) onChange({ ...block, kind, url: "" });
              }}
              className={`${inputClass} max-w-xs`}
            >
              {(Object.keys(MATERIAL_IMAGE_KINDS) as (keyof typeof MATERIAL_IMAGE_KINDS)[]).map(
                (kind) => (
                  <option key={kind} value={kind}>
                    {MATERIAL_IMAGE_KINDS[kind].label}
                  </option>
                )
              )}
            </select>
          </div>
          <ImageField
            label="Foto"
            hint={`${spec.hint} Se recorta sola a esa proporción.`}
            aspect={spec.aspect}
            maxPx={spec.maxPx}
            url={block.url}
            onChange={(url) => onChange({ ...block, url })}
            onBusy={onBusy}
          />
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Descripción (opcional)</label>
            <input
              type="text"
              value={block.alt}
              onChange={(e) => onChange({ ...block, alt: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      );
    }
  }
}

export function MaterialForm({
  material,
  action,
}: {
  material?: Tables<"materiales">;
  action: (
    prevState: MaterialFormState,
    formData: FormData
  ) => Promise<MaterialFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  const [title, setTitle] = useState(material?.title ?? "");
  const [eyebrow, setEyebrow] = useState(material?.eyebrow ?? "");
  const [coverUrl, setCoverUrl] = useState(material?.cover_url ?? "");
  const [backCoverUrl, setBackCoverUrl] = useState(material?.back_cover_url ?? "");
  const [blocks, setBlocks] = useState<MaterialBlock[]>(() =>
    parseMaterialBlocks(material?.blocks)
  );
  const [tab, setTab] = useState<"editar" | "vista">("editar");
  // Cuantas subidas hay en curso: con una abierta no se puede guardar, o el
  // documento se guardaria sin esa imagen.
  const [uploading, setUploading] = useState(0);
  const onBusy = (busy: boolean) => setUploading((n) => n + (busy ? 1 : -1));

  function update(id: string, next: MaterialBlock) {
    setBlocks((all) => all.map((b) => (b.id === id ? next : b)));
  }
  function move(index: number, delta: -1 | 1) {
    setBlocks((all) => {
      const to = index + delta;
      if (to < 0 || to >= all.length) return all;
      const copy = [...all];
      [copy[index], copy[to]] = [copy[to], copy[index]];
      return copy;
    });
  }

  // Una imagen todavia sin foto no se guarda ni se dibuja.
  const ready = blocks.filter((b) => b.type !== "imagen" || b.url);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="cover_url" value={coverUrl} />
      <input type="hidden" name="back_cover_url" value={backCoverUrl} />
      <input type="hidden" name="blocks" value={JSON.stringify(ready)} />

      <div
        role="tablist"
        className="flex gap-1 self-start rounded-lg border border-outline-variant/60 p-1"
      >
        {(
          [
            ["editar", "Editar"],
            ["vista", "Vista previa"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`rounded-md px-4 py-1.5 text-sm transition-colors ${
              tab === value
                ? "bg-primary-container/15 text-primary-fixed-dim"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Los dos paneles quedan montados y se esconde uno: desmontar el editor
          al pasar a la vista previa perderia las subidas en curso. */}
      <div hidden={tab !== "editar"} className="flex flex-col gap-6 max-w-2xl">
        <section className="glass-card rounded-2xl p-5 md:p-8 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className={labelClass}>
              Título del documento
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Egipto y el despertar del sagrado femenino"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="eyebrow" className={labelClass}>
              Línea chica de la tapa (opcional)
            </label>
            <input
              id="eyebrow"
              name="eyebrow"
              type="text"
              value={eyebrow}
              onChange={(e) => setEyebrow(e.target.value)}
              placeholder="Cuaderno de preparación"
              className={inputClass}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <ImageField
              label="Tapa"
              hint="Hoja A4 vertical, a sangre. El título se escribe encima, en dorado: la imagen puede llevar el logo."
              aspect={MATERIAL_COVER.aspect}
              maxPx={MATERIAL_COVER.maxPx}
              url={coverUrl}
              onChange={setCoverUrl}
              onBusy={onBusy}
            />
            <ImageField
              label="Contratapa (opcional)"
              hint="Misma proporción que la tapa."
              aspect={MATERIAL_COVER.aspect}
              maxPx={MATERIAL_COVER.maxPx}
              url={backCoverUrl}
              onChange={setBackCoverUrl}
              onBusy={onBusy}
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-xl text-primary-fixed-dim">
            Contenido
          </h2>

          {blocks.length === 0 && (
            <p className="text-sm text-on-surface-variant">
              Todavía no hay nada. Agrega un capítulo para empezar.
            </p>
          )}

          {blocks.map((block, index) => (
            <div
              key={block.id}
              className="glass-card rounded-2xl p-4 md:p-5 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">
                  {index + 1} · {MATERIAL_BLOCK_LABELS[block.type]}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Subir"
                    className="rounded p-1.5 text-on-surface-variant hover:text-primary-fixed-dim disabled:opacity-30"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === blocks.length - 1}
                    aria-label="Bajar"
                    className="rounded p-1.5 text-on-surface-variant hover:text-primary-fixed-dim disabled:opacity-30"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("¿Quitar este bloque?")) {
                        setBlocks((all) => all.filter((b) => b.id !== block.id));
                      }
                    }}
                    aria-label="Quitar"
                    className="rounded p-1.5 text-error hover:opacity-80"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <BlockFields
                block={block}
                onChange={(next) => update(block.id, next)}
                onBusy={onBusy}
              />
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            {ADD_ORDER.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBlocks((all) => [...all, newBlock(type)])}
                className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface-variant transition-colors hover:border-primary-fixed-dim/60 hover:text-primary-fixed-dim"
              >
                <Plus size={14} />
                {MATERIAL_BLOCK_LABELS[type]}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div hidden={tab !== "vista"}>
        <div className="rounded-2xl bg-[#e8e8ee] p-3 sm:p-6">
          {title.trim() || ready.length || coverUrl ? (
            <MaterialDocument
              title={title.trim() || "Sin título"}
              eyebrow={eyebrow.trim() || null}
              coverUrl={coverUrl || null}
              backCoverUrl={backCoverUrl || null}
              blocks={ready}
            />
          ) : (
            <p className="py-10 text-center text-sm text-[#05125a]">
              Escribe algo en &ldquo;Editar&rdquo; y se ve acá.
            </p>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-4 bg-void-black/90 px-1 py-4 backdrop-blur">
        <button
          type="submit"
          disabled={pending || uploading > 0}
          className="bg-primary-container text-on-primary font-medium tracking-[0.05em] rounded-lg px-6 py-2.5 text-sm hover:bg-primary-fixed transition-colors disabled:opacity-50"
        >
          {pending
            ? "Guardando…"
            : uploading > 0
              ? "Subiendo imagen…"
              : material
                ? "Guardar cambios"
                : "Crear documento"}
        </button>
        {state.saved && !pending && (
          <span className="text-sm text-primary-fixed-dim">Guardado ✓</span>
        )}
        {state.error && (
          <span role="alert" className="text-sm text-error">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
