/**
 * Un slot de multimedia guarda una URL, y esa URL puede ser una imagen o un
 * video corto de fondo (desde el 27/08 el panel acepta los dos). El renderer
 * decide por la extension: no hay una columna que diga de que tipo es.
 *
 * Se mira solo la extension y no el `Content-Type` porque la decision se toma
 * en el server durante el render, sin pedir el archivo. Las URLs que guarda el
 * panel siempre traen extension (la pone el propio upload), y los assets del
 * repo tambien.
 */
const VIDEO_EXTENSIONS = /\.(webm|mp4|mov|m4v)(\?|#|$)/i;

export function isVideoUrl(url: string) {
  return VIDEO_EXTENSIONS.test(url);
}
