import type { Answer } from "@/lib/health-history";

/**
 * Render de un bloque de respuestas (filtro corto o formulario de salud).
 * Lo comparten el detalle de solicitud y la ficha de salud del CRM: las dos
 * pantallas muestran exactamente las mismas preguntas.
 */
export function AnswerList({
  answers,
  children,
}: {
  answers: Answer[];
  /** Filas extra al pie (fechas, metadatos), dentro del mismo listado. */
  children?: React.ReactNode;
}) {
  return (
    <div>
      {answers.map((answer) => (
        <div
          key={answer.key}
          className="py-3 border-b border-outline-variant/40 last:border-0"
        >
          <p className="text-xs text-on-surface-variant tracking-[0.02em] mb-1">
            {answer.label}
          </p>
          <p className={answer.flagged ? "text-error font-medium" : "text-on-surface"}>
            {answer.kind === "bool"
              ? `${answer.bool ? "Sí" : "No"}${
                  answer.bool && answer.text ? ` — ${answer.text}` : ""
                }`
              : (answer.text ?? "—")}
          </p>
          {answer.changedFrom && (
            <p className="mt-1 text-xs text-primary-fixed-dim">
              Cambió — antes decía: {answer.changedFrom}
            </p>
          )}
        </div>
      ))}
      {children}
    </div>
  );
}
