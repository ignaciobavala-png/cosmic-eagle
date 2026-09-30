/**
 * El bloque "English" de los formularios del panel: la versión en inglés de
 * los campos de texto, todos opcionales. Lo que queda vacío se ve en castellano
 * en `/en` (docs/I18N.md §6), así que cargar el inglés nunca es un requisito
 * para publicar.
 *
 * Es el mismo recuadro que tiene el formulario de testimonios desde el 29/09.
 * Cada form le pasa su clase de campo: los del panel no comparten estilo.
 */
export type EnglishField = {
  /** El `name` del input, que es la columna: `title_en`, `body_en`… */
  name: string;
  label: string;
  value: string | null | undefined;
  /** Filas del textarea; sin esto es un input de una línea. */
  rows?: number;
  maxLength?: number;
};

export function EnglishFields({
  fields,
  fieldClassName,
  hint = "Lo que se ve en la versión en inglés del sitio. Un campo vacío aparece en castellano.",
}: {
  fields: EnglishField[];
  fieldClassName: string;
  hint?: string;
}) {
  return (
    <fieldset className="space-y-4 rounded-xl border border-outline/60 p-4">
      <legend className="px-2 text-sm text-on-surface">
        English <span className="text-on-surface-variant/60">(opcional)</span>
      </legend>
      <p className="text-xs text-on-surface-variant">{hint}</p>
      {fields.map((field) => (
        <div key={field.name}>
          <label
            htmlFor={field.name}
            className="mb-1.5 block text-sm text-on-surface-variant"
          >
            {field.label}
          </label>
          {field.rows ? (
            <textarea
              id={field.name}
              name={field.name}
              lang="en"
              rows={field.rows}
              maxLength={field.maxLength}
              defaultValue={field.value ?? ""}
              className={fieldClassName}
            />
          ) : (
            <input
              id={field.name}
              name={field.name}
              lang="en"
              maxLength={field.maxLength}
              defaultValue={field.value ?? ""}
              className={fieldClassName}
            />
          )}
        </div>
      ))}
    </fieldset>
  );
}

/** Lado server: un campo opcional del form, vacío o sólo espacios = `null`. */
export function optionalEnglish(
  formData: FormData,
  name: string
): string | null {
  const value = formData.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
