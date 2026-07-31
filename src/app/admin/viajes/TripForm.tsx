"use client";

import { useActionState } from "react";
import Image from "next/image";
import type { Tables } from "@/lib/supabase/types";
import type { TripFormState } from "./actions";

const STATUS_OPTIONS: { value: Tables<"trips">["status"]; label: string }[] = [
  { value: "draft", label: "Borrador" },
  { value: "open", label: "Abierto" },
  { value: "closed", label: "Cerrado" },
  { value: "completed", label: "Finalizado" },
];

const inputClass =
  "bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors";
const labelClass = "text-sm text-on-surface-variant tracking-[0.02em]";

export function TripForm({
  trip,
  action,
}: {
  trip?: Tables<"trips">;
  action: (
    prevState: TripFormState,
    formData: FormData
  ) => Promise<TripFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
  });

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
          defaultValue={trip?.title ?? ""}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className={labelClass}>
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={trip?.description ?? ""}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="image" className={labelClass}>
          Portada
        </label>
        {trip?.image_url && (
          <div className="relative aspect-[4/3] w-full max-w-48 overflow-hidden rounded-lg border border-outline-variant">
            <Image
              src={trip.image_url}
              alt="Portada actual del viaje"
              fill
              sizes="192px"
              className="object-cover"
            />
          </div>
        )}
        <input
          id="image"
          name="image"
          type="file"
          accept="image/*"
          className={`${inputClass} file:mr-4 file:rounded-md file:border-0 file:bg-primary-container file:px-3 file:py-1 file:text-on-primary`}
        />
        <p className="text-xs text-on-surface-variant/70">
          Apaisada, hasta 5MB. {trip?.image_url && "Si no elegís una, se mantiene la actual. "}
          Sin portada se usa una imagen genérica.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="location" className={labelClass}>
          Ubicación
        </label>
        <input
          id="location"
          name="location"
          type="text"
          defaultValue={trip?.location ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="start_date" className={labelClass}>
            Fecha inicio
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            defaultValue={trip?.start_date ?? ""}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="end_date" className={labelClass}>
            Fecha fin
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            required
            defaultValue={trip?.end_date ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="capacity" className={labelClass}>
            Cupo
          </label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            required
            defaultValue={trip?.capacity ?? 12}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="price" className={labelClass}>
            Precio (USD)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={trip?.price ?? 0}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="status" className={labelClass}>
          Estado
        </label>
        <select
          id="status"
          name="status"
          defaultValue={trip?.status ?? "draft"}
          className={inputClass}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {state.error && (
        <p className="text-error text-sm" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 bg-primary-container text-on-primary font-medium tracking-[0.05em] rounded-lg py-2.5 hover:bg-primary-fixed transition-colors disabled:opacity-60"
      >
        {pending ? "Guardando..." : trip ? "Guardar cambios" : "Crear viaje"}
      </button>
    </form>
  );
}
