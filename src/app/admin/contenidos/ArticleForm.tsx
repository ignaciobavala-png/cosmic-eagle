"use client";

import { useActionState, useRef, useState } from "react";
import { compressImage } from "@/lib/compress-image";
import {
  ARTICLE_CATEGORY_LIST,
  ARTICLE_COVER_ASPECT,
  ARTICLE_COVER_MAX_PX,
  slugify,
} from "@/lib/article";
import type { Tables } from "@/lib/supabase/types";
import type { ArticleFormState } from "./actions";

const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador (no se ve en el sitio)" },
  { value: "published", label: "Publicado" },
] as const;

const inputClass =
  "bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors";
const labelClass = "text-sm text-on-surface-variant tracking-[0.02em]";

export function ArticleForm({
  article,
  action,
}: {
  article?: Tables<"articles">;
  action: (
    prevState: ArticleFormState,
    formData: FormData
  ) => Promise<ArticleFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  // La direccion se sugiere sola desde el titulo, pero se puede editar. En un
  // articulo ya publicado NO se sigue al titulo: cambiarla rompe el link que
  // ya circulo, asi que ahi solo cambia si la tocan a mano.
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(article));

  const [preview, setPreview] = useState<string | null>(null);
  const [cropping, setCropping] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  function handleTitle(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleCover(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setCropping(true);
    const cover = await compressImage(
      file,
      ARTICLE_COVER_MAX_PX,
      ARTICLE_COVER_ASPECT
    );
    setCropping(false);

    // El input tiene que llevar el archivo recortado, no el original: es el que
    // se sube cuando el form hace submit.
    const transfer = new DataTransfer();
    transfer.items.add(cover);
    if (coverInputRef.current) coverInputRef.current.files = transfer.files;

    setPreview(URL.createObjectURL(cover));
  }

  return (
    <form
      action={formAction}
      className="glass-card rounded-2xl p-5 md:p-8 flex flex-col gap-5 max-w-2xl"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className={labelClass}>
          Título
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={handleTitle}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="slug" className={labelClass}>
          Dirección en el sitio
        </label>
        <div className="flex items-center gap-1 text-sm text-on-surface-variant">
          <span className="shrink-0">/contenidos/</span>
          <input
            id="slug"
            name="slug"
            type="text"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            className={`${inputClass} min-w-0 flex-1`}
          />
        </div>
        <p className="text-xs text-on-surface-variant">
          Se arma sola con el título. Si ya compartiste el link de un contenido
          publicado, cambiarla lo rompe.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="excerpt" className={labelClass}>
          Bajada
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          defaultValue={article?.excerpt ?? ""}
          className={inputClass}
        />
        <p className="text-xs text-on-surface-variant">
          El resumen corto que se lee en la tarjeta del listado.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="cover" className={labelClass}>
          Portada
        </label>
        {(preview || article?.cover_url) && (
          <div className="relative aspect-[16/9] w-full max-w-64 overflow-hidden rounded-lg border border-outline-variant">
            {/* <img> y no next/image: la preview local es un blob: y el
                optimizador no lo puede resolver (mismo caso que TripForm). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview ?? article!.cover_url!}
              alt={
                preview
                  ? "Portada nueva, ya recortada"
                  : "Portada actual del contenido"
              }
              className="h-full w-full object-cover"
            />
            {/* Zona segura, igual que en las portadas de viaje: lo que queda
                fuera del 75% central se pierde en el recorte de la tarjeta. */}
            <div className="pointer-events-none absolute inset-[12.5%] border border-dashed border-primary-fixed-dim/60" />
          </div>
        )}
        <input
          ref={coverInputRef}
          id="cover"
          name="cover"
          type="file"
          accept="image/*"
          onChange={handleCover}
          className="text-sm text-on-surface-variant file:mr-3 file:rounded-lg file:border file:border-outline-variant file:bg-surface-container-low file:px-3 file:py-1.5 file:text-sm file:text-on-surface-variant"
        />
        <p className="text-xs text-on-surface-variant">
          {cropping && "Recortando… "}
          {!cropping && "Se recorta sola a 16:9 desde el centro. "}
          {!cropping &&
            article?.cover_url &&
            "Si no eliges una, se mantiene la actual. "}
          {!cropping && !article?.cover_url && "Sin portada la tarjeta va sin imagen."}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className={labelClass}>
            Categoría
          </label>
          <select
            id="category"
            name="category"
            defaultValue={article?.category ?? "preparacion"}
            className={inputClass}
          >
            {ARTICLE_CATEGORY_LIST.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className={labelClass}>
            Estado
          </label>
          <select
            id="status"
            name="status"
            defaultValue={article?.status ?? "draft"}
            className={inputClass}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="body" className={labelClass}>
          Texto
        </label>
        <textarea
          id="body"
          name="body"
          rows={16}
          required
          defaultValue={article?.body ?? ""}
          className={`${inputClass} font-body leading-relaxed`}
        />
        <p className="text-xs text-on-surface-variant">
          Deja una línea en blanco entre párrafos. Una línea que empiece con{" "}
          <code className="text-primary-fixed-dim">## </code> se ve como
          subtítulo.
        </p>
      </div>

      {state.error && <p className="text-sm text-error">{state.error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending || cropping}
          className="bg-primary-container text-on-primary font-medium tracking-[0.05em] rounded-lg px-6 py-2.5 text-sm hover:bg-primary-fixed transition-colors disabled:opacity-40"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
