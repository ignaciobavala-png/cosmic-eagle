/**
 * El contenido que carga la clienta, en el idioma de la página.
 *
 * Patrón de docs/I18N.md §6: cada campo traducible tiene su hermana `_en`
 * nulable, y en `/en` se usa la traducción si está cargada y el castellano si
 * no. Un viaje recién cargado aparece en inglés con sus textos en castellano;
 * no desaparece ni sale vacío.
 */
export function localized<T extends string | null | undefined>(
  locale: string,
  es: T,
  en: string | null | undefined
): T | string {
  return locale === "en" && en?.trim() ? en : es;
}

/**
 * Pisa cada campo de `row` con su `_en` cuando la página está en inglés, y
 * devuelve la fila **sin** las columnas `_en`: sirve para filas que después
 * pasan tal cual a un componente (`TripCard`), que así no se entera de que hay
 * dos idiomas — y a un Client Component no le viaja en el payload el idioma
 * que no se muestra.
 */
export function localizeRow<
  R extends Record<string, unknown>,
  F extends keyof R & string,
>(row: R, locale: string, fields: readonly F[]): Omit<R, `${F}_en`> {
  const out: Record<string, unknown> = { ...row };

  for (const field of fields) {
    const en = row[`${field}_en`];
    if (locale === "en" && typeof en === "string" && en.trim()) out[field] = en;
    delete out[`${field}_en`];
  }

  return out as Omit<R, `${F}_en`>;
}
