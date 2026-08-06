"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ScheduleItem } from "@/lib/trip-schedule";

const inputClass =
  "bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors";

const EMPTY_ROW: ScheduleItem = { time: "", activity: "" };

/**
 * Editor del programa del viaje: filas hora + actividad, como la slide
 * "Programa" del flyer que hoy mandan por WhatsApp.
 *
 * Viaja al server action como un unico campo `schedule` con el JSON serializado,
 * en vez de N campos indexados: el array se arma entero aca y el action solo lo
 * valida. Las filas incompletas se descartan al serializar, asi que dejar una
 * vacia al final no rompe nada.
 */
export function ScheduleEditor({ defaultValue }: { defaultValue: ScheduleItem[] }) {
  const [rows, setRows] = useState<ScheduleItem[]>(
    defaultValue.length > 0 ? defaultValue : [EMPTY_ROW]
  );

  const update = (index: number, patch: Partial<ScheduleItem>) =>
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );

  const remove = (index: number) =>
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [EMPTY_ROW];
    });

  const filled = rows.filter((row) => row.time && row.activity.trim());

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-on-surface-variant tracking-[0.02em]">
        Programa
      </span>

      <input type="hidden" name="schedule" value={JSON.stringify(filled)} />

      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="time"
              aria-label={`Hora de la actividad ${i + 1}`}
              value={row.time}
              onChange={(e) => update(i, { time: e.target.value })}
              className={`${inputClass} w-32 shrink-0`}
            />
            <input
              type="text"
              aria-label={`Actividad ${i + 1}`}
              placeholder="Llegada al lugar"
              value={row.activity}
              onChange={(e) => update(i, { activity: e.target.value })}
              className={`${inputClass} min-w-0 flex-1`}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Quitar la actividad ${i + 1}`}
              className="shrink-0 rounded-lg border border-outline-variant p-2.5 text-on-surface-variant transition-colors hover:border-error/50 hover:text-error"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setRows((prev) => [...prev, EMPTY_ROW])}
        className="mt-1 inline-flex w-fit items-center gap-2 rounded-lg border border-primary-fixed-dim/40 px-3 py-1.5 text-sm text-primary-fixed-dim transition-colors hover:bg-primary-container/10"
      >
        <Plus size={14} />
        Agregar horario
      </button>

      <p className="text-xs text-on-surface-variant/70">
        Se muestra ordenado por hora en la página del viaje. Sin horarios, la
        sección no aparece.
      </p>
    </div>
  );
}
