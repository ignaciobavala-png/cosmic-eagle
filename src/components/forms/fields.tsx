"use client";

import { useState } from "react";
import { fieldInput, fieldLabel, panelDivider } from "./styles";

/**
 * Los controles que comparten el filtro corto (etapa 1) y el formulario de
 * salud extenso (etapa 2). Antes cada uno tenía su copia de `BoolQuestion` y de
 * los estilos de campo, y se desincronizaban solas: la corrección de Estela del
 * 04/09/2026 ("agregar box sí y no", "agregar caja de texto para aclaraciones")
 * era la misma para los dos formularios.
 */

// Desde el 05/09 son los mismos campos de la pantalla de acceso: el embudo
// entero pasó al azul de Julia y los tokens de superficie del sistema (pensados
// para el fondo oscuro general) quedaban invisibles encima. Ver
// `@/components/forms/styles`.
export const inputClass = fieldInput;

export const labelClass = fieldLabel;

/**
 * Un número que se escribe, sin las flechitas de `type="number"`.
 *
 * Pedido de Estela el 04/09/2026 para la edad: el spinner del navegador se
 * dispara con la rueda del mouse estando el campo enfocado y cambia el valor
 * sin que la persona se dé cuenta. `inputMode="numeric"` conserva el teclado
 * numérico en el celular, que es lo único que se quería de `type="number"`.
 */
export function NumberInput({
  name,
  required,
  defaultValue,
  maxLength = 3,
}: {
  name: string;
  required?: boolean;
  defaultValue?: string | number;
  maxLength?: number;
}) {
  return (
    <input
      name={name}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={maxLength}
      required={required}
      defaultValue={defaultValue}
      className={inputClass}
    />
  );
}

/**
 * Un sí/no explícito con caja de aclaraciones.
 *
 * **Son dos opciones y no una casilla tildable.** Con la casilla, "no" y "no
 * contestó" eran el mismo dato: la fila llegaba en `false` sin que nadie
 * supiera si la persona había leído la pregunta. Con dos opciones obligatorias
 * la respuesta es siempre deliberada, que es como está en los formularios de
 * Google de Estela.
 *
 * La caja de aclaraciones aparece al responder que sí — es donde vive lo que
 * Estela realmente lee, y el `required` del filtro corto la hace obligatoria
 * ahí.
 */
export function YesNoQuestion({
  name,
  label,
  hint,
  placeholder = "Contanos más...",
  detailName,
  detailRequired = false,
  detailLabel = "Aclaraciones",
}: {
  name: string;
  label: string;
  hint?: string;
  placeholder?: string;
  /** Por defecto `<name>_detail`; se pasa cuando la columna se llama distinto. */
  detailName?: string;
  detailRequired?: boolean;
  detailLabel?: string;
}) {
  const [answer, setAnswer] = useState<"si" | "no" | null>(null);

  return (
    <fieldset
      className={`flex flex-col gap-2 border-b py-4 last:border-0 ${panelDivider}`}
    >
      <legend className="text-white">{label}</legend>
      {hint && <p className="text-xs text-white/55">{hint}</p>}

      <div className="flex gap-6 pt-1">
        {(["si", "no"] as const).map((value) => (
          <label
            key={value}
            className="flex cursor-pointer items-center gap-2 text-white"
          >
            <input
              type="radio"
              name={name}
              value={value}
              required
              checked={answer === value}
              onChange={() => setAnswer(value)}
              className="h-4 w-4 accent-[#f9d78f]"
            />
            {value === "si" ? "Sí" : "No"}
          </label>
        ))}
      </div>

      {answer === "si" && (
        <div className="flex flex-col gap-1.5 pt-1">
          <label className={labelClass}>{detailLabel}</label>
          <textarea
            name={detailName ?? `${name}_detail`}
            required={detailRequired}
            placeholder={placeholder}
            rows={3}
            className={inputClass}
          />
        </div>
      )}
    </fieldset>
  );
}
