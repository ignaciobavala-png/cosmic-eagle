/**
 * HTML subido por la organizacion (29/10): documentos ya armados en su
 * computadora, que se comparten por link o se cargan como contenido.
 *
 * El HTML se guarda como texto y se dibuja **siempre** dentro de `HtmlFrame`
 * (iframe `sandbox` sin `allow-same-origin`). No hay sanitizador en el
 * proyecto: lo que protege es el aislamiento, no la limpieza.
 */

/**
 * Tope del archivo. Un server action de Vercel acepta ~4.5MB de cuerpo, y las
 * imagenes embebidas en base64 pesan un tercio mas que el original.
 */
export const HTML_MAX_BYTES = 3 * 1024 * 1024;

/**
 * Lee el `<input type="file">` de un form. `{ html: undefined }` significa "no
 * se subio nada" (distinto de un error), para no pisar lo guardado al editar.
 */
export async function readHtmlFile(
  value: FormDataEntryValue | null
): Promise<{ error: string | null; html?: string }> {
  if (!(value instanceof File) || value.size === 0) return { error: null };

  if (!/\.html?$/i.test(value.name)) {
    return { error: "El archivo tiene que ser un .html." };
  }
  if (value.size > HTML_MAX_BYTES) {
    return {
      error:
        "El HTML pesa más de 3MB. Si lleva fotos adentro, comprímelas antes de exportarlo.",
    };
  }

  const html = (await value.text()).trim();
  if (!/<[a-z!][^>]*>/i.test(html)) {
    return { error: "El archivo no parece un HTML." };
  }
  return { error: null, html };
}
