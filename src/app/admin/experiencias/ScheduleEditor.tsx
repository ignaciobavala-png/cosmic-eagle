"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatScheduleDay } from "@/lib/format";
import type { ScheduleItem } from "@/lib/trip-schedule";
import type { TripType } from "@/lib/trip-type";

const inputClass =
  "bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors";

const EMPTY_ROW: ScheduleItem = { day: null, time: "", activity: "" };

/**
 * Editor del programa del viaje.
 *
 * Cambia segun el tipo, que es la unica diferencia real entre los dos formatos:
 * una ceremonia dura un dia y su programa es una lista de horas; un retiro dura
 * varios y se organiza por jornada (Dia 1, Dia 2...), con la hora opcional
 * porque hay jornadas que son "Integracion" a secas.
 *
 * Viaja al server action como un unico campo `schedule` con el JSON serializado,
 * en vez de N campos indexados: el array se arma entero aca y el action solo lo
 * valida. Las filas incompletas se descartan al serializar, asi que dejar una
 * vacia al final no rompe nada.
 */
export function ScheduleEditor({
  defaultValue,
  type,
  startDate,
}: {
  defaultValue: ScheduleItem[];
  type: TripType;
  /** Fecha de inicio del viaje, para mostrar a que dia corresponde cada jornada. */
  startDate: string;
}) {
  const byDay = type === "retiro";
  const [rows, setRows] = useState<ScheduleItem[]>(
    defaultValue.length > 0 ? defaultValue : [{ ...EMPTY_ROW, day: byDay ? 1 : null }]
  );

  const update = (index: number, patch: Partial<ScheduleItem>) =>
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );

  const remove = (index: number) =>
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ ...EMPTY_ROW, day: byDay ? 1 : null }];
    });

  // La fila nueva hereda la jornada de la anterior: en un retiro se cargan
  // varias actividades seguidas del mismo dia, y retipear el numero cada vez
  // seria el paso mas molesto del form.
  const addRow = () =>
    setRows((prev) => [
      ...prev,
      { ...EMPTY_ROW, day: byDay ? (prev.at(-1)?.day ?? 1) : null },
    ]);

  const filled = rows.filter(
    (row) => row.activity.trim() && (byDay ? row.day !== null : row.time)
  );

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-on-surface-variant tracking-[0.02em]">
        Programa
      </span>

      <input type="hidden" name="schedule" value={JSON.stringify(filled)} />

      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            {byDay && (
              <div className="w-24 shrink-0">
                <input
                  type="number"
                  min={1}
                  max={60}
                  aria-label={`Jornada de la actividad ${i + 1}`}
                  placeholder="Día"
                  value={row.day ?? ""}
                  onChange={(e) =>
                    update(i, {
                      day: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className={`${inputClass} w-full`}
                />
                {row.day !== null && startDate && (
                  <span className="mt-1 block text-xs text-on-surface-variant/70 capitalize">
                    {formatScheduleDay(startDate, row.day)}
                  </span>
                )}
              </div>
            )}

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
              placeholder={byDay ? "Sesión Cósmica" : "Llegada al lugar"}
              value={row.activity}
              onChange={(e) => update(i, { activity: e.target.value })}
              className={`${inputClass} min-w-0 flex-1`}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Quitar la actividad ${i + 1}`}
              className="shrink-0 self-start rounded-lg border border-outline-variant p-2.5 text-on-surface-variant transition-colors hover:border-error/50 hover:text-error"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-1 inline-flex w-fit items-center gap-2 rounded-lg border border-primary-fixed-dim/40 px-3 py-1.5 text-sm text-primary-fixed-dim transition-colors hover:bg-primary-container/10"
      >
        <Plus size={14} />
        {byDay ? "Agregar actividad" : "Agregar horario"}
      </button>

      <p className="text-xs text-on-surface-variant/70">
        {byDay
          ? "Se agrupa por jornada y se ordena por hora al guardar. La hora es opcional. Sin actividades, la sección no aparece."
          : "Se muestra ordenado por hora en la página del viaje. Sin horarios, la sección no aparece."}
      </p>
    </div>
  );
}
