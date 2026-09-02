"use client";

import { useActionState, useRef, useState } from "react";
import { compressImage } from "@/lib/compress-image";
import { TRIP_COVER_ASPECT, TRIP_COVER_MAX_PX } from "@/lib/trip-cover";
import type { Tables } from "@/lib/supabase/types";
import type { TripType } from "@/lib/trip-type";
import { parseSchedule } from "@/lib/trip-schedule";
import { ScheduleEditor } from "./ScheduleEditor";
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
  type,
  action,
}: {
  trip?: Tables<"trips">;
  /**
   * El tipo se decide antes de entrar al form (por la seccion desde la que se
   * crea) y no se edita despues: cambiarselo a un viaje que ya tiene solicitudes
   * le cambia la naturaleza, no es un ajuste. Por eso viaja como hidden y el
   * server igual lo relee de la base al actualizar.
   */
  type: TripType;
  action: (
    prevState: TripFormState,
    formData: FormData
  ) => Promise<TripFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
  });
  // Controlado (y no `defaultValue`) porque el editor del programa muestra a que
  // fecha cae cada jornada, y tiene que seguir a este campo mientras se edita.
  const [startDate, setStartDate] = useState(trip?.start_date ?? "");

  // Preview del recorte real, no del archivo original: lo que se ve aca es
  // exactamente lo que se va a subir.
  const [preview, setPreview] = useState<string | null>(null);
  const [cropping, setCropping] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function handleCover(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setCropping(true);
    const cover = await compressImage(file, TRIP_COVER_MAX_PX, TRIP_COVER_ASPECT);
    setCropping(false);

    // El input tiene que llevar el archivo recortado, no el original: es el que
    // se sube cuando el form hace submit.
    const transfer = new DataTransfer();
    transfer.items.add(cover);
    if (imageInputRef.current) imageInputRef.current.files = transfer.files;

    setPreview(URL.createObjectURL(cover));
  }

  return (
    <form
      action={formAction}
      className="glass-card rounded-2xl p-5 md:p-8 flex flex-col gap-5 max-w-2xl"
    >
      <input type="hidden" name="type" value={type} />

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
        {(preview || trip?.image_url) && (
          <div className="relative aspect-[16/9] w-full max-w-64 overflow-hidden rounded-lg border border-outline-variant">
            {/* <img> y no next/image: la preview local es un blob: y el
                optimizador no lo puede resolver (mismo caso que SlotEditor). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview ?? trip!.image_url!}
              alt={preview ? "Portada nueva, ya recortada" : "Portada actual del viaje"}
              className="h-full w-full object-cover"
            />
            {/* Guia de zona segura: lo que quede fuera del 75% central se pierde
                en alguno de los dos recortes (tarjeta 4:3 o banner 21:9). */}
            <div className="pointer-events-none absolute inset-x-[12.5%] inset-y-[12.5%] border border-dashed border-primary-fixed-dim/60" />
          </div>
        )}
        <input
          ref={imageInputRef}
          id="image"
          name="image"
          type="file"
          accept="image/*"
          onChange={handleCover}
          className={`${inputClass} file:mr-4 file:rounded-md file:border-0 file:bg-primary-container file:px-3 file:py-1 file:text-on-primary`}
        />
        <p className="text-xs text-on-surface-variant/70">
          {cropping
            ? "Recortando…"
            : "Se recorta sola a 16:9 desde el centro y se convierte a WebP. Deja lo importante dentro del recuadro punteado: es lo que se ve en todos los tamaños. "}
          {!cropping && trip?.image_url && "Si no eliges una, se mantiene la actual. "}
          {!cropping && "Sin portada se usa una imagen genérica."}
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
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="deposit_amount" className={labelClass}>
            Seña para reservar (USD)
          </label>
          <input
            id="deposit_amount"
            name="deposit_amount"
            type="number"
            min={0}
            step="0.01"
            defaultValue={trip?.deposit_amount ?? ""}
            className={inputClass}
          />
          {/* Vacío es una opción real, no un olvido: hay experiencias que se
              pagan enteras. Si se carga, la persona ve las dos opciones. */}
          <p className="text-xs text-on-surface-variant">
            Dejalo vacío si este viaje se paga completo. Si ponés un monto, la
            persona elige entre reservar con esa seña o pagar el total.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="payment_url" className={labelClass}>
          Link de pago con tarjeta
        </label>
        <input
          id="payment_url"
          name="payment_url"
          type="url"
          inputMode="url"
          defaultValue={trip?.payment_url ?? ""}
          placeholder="https://encuadrado.com/s/..."
          className={inputClass}
        />
        {/* La URL se pega a mano porque la API de Encuadrado no crea servicios:
            tiene dos endpoints y los dos piden un `service_uuid` que ya exista
            (ver docs/ENCUADRADO.md §8). Es UN link por viaje —lleva el precio
            adentro— y por eso vive acá y no en el riel global de /admin/pagos. */}
        <p className="text-xs text-on-surface-variant">
          Pegá acá el link del viaje en Encuadrado. Sólo lo ve quien ya fue
          aprobado, junto a los datos de transferencia. Dejalo vacío si este
          viaje se cobra sólo por transferencia.
        </p>
      </div>

      <ScheduleEditor
        defaultValue={parseSchedule(trip?.schedule)}
        type={type}
        startDate={startDate}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="terms" className={labelClass}>
          Condiciones de inscripción
        </label>
        <textarea
          id="terms"
          name="terms"
          rows={3}
          defaultValue={trip?.terms ?? ""}
          placeholder="Inscripciones con formulario de salud aprobado. Pago del 50% para reservar cupo, reembolsable hasta 7 días antes del evento."
          className={inputClass}
        />
        <p className="text-xs text-on-surface-variant/70">
          Seña, reembolsos, requisitos. Se muestra junto al aporte. El cobro
          sigue siendo por fuera de la web.
        </p>
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-[50%] sm:pr-2">
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
