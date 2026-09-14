/**
 * Comprime y redimensiona una imagen en el browser antes de subirla.
 *
 * No es por espacio en el bucket (el free tier aguanta miles de assets a este
 * peso): es porque `next/image` transformando un PNG de 5MB en frio cuelga la
 * primera visita, que es justo la que hace la clienta al revisar lo que acaba
 * de cargar.
 *
 * De yapa, pasar por canvas borra el EXIF — incluida la geolocalizacion. La
 * orientacion no se pierde: `<img>` ya aplica el tag `Orientation` al decodificar,
 * asi que la foto de celular entra al canvas derecha. Eso NO vale para pipelines
 * que no pasan por el browser (scripts, imports masivos), que tienen que rotar
 * a mano.
 */

const QUALITY = 0.82;

/**
 * Punto de la imagen original que queda en el centro del recorte, en fracciones
 * de 0 a 1. `{x: 0.5, y: 0.5}` es el centro, `{y: 0}` pega el recorte al borde
 * de arriba.
 *
 * Solo tiene efecto el eje que sobra: recortando a 16:9, una foto vertical solo
 * se puede correr en `y` y una panoramica solo en `x`.
 */
export type CropFocus = { x: number; y: number };

export const CENTER_FOCUS: CropFocus = { x: 0.5, y: 0.5 };

/**
 * `aspect` (ancho / alto) recorta la imagen a esa proporcion antes de escalar.
 * Se usa para las portadas de viaje: se guarda una sola imagen en 16:9 y cada
 * lugar del sitio recorta desde ahi (ver docs/PORTADAS.md). Sin `aspect` la
 * imagen conserva su proporcion original, que es lo que quiere el panel de
 * multimedia, donde cada slot tiene la suya.
 *
 * `focus` mueve ese recorte. El default es el centro, que es como se comporto
 * desde el 18/08 y sigue siendo lo que sale sin tocar nada. Existe porque una
 * foto vertical pierde el 58% del alto al pasar a 16:9 (el 68% si es 9:16), y
 * repartido mitad arriba y mitad abajo eso le corta la cabeza a una persona de
 * cuerpo entero. Lo elige la clienta con `CoverFramer`.
 */
export async function compressImage(
  file: File,
  maxPx = 1600,
  aspect?: number,
  focus: CropFocus = CENTER_FOCUS
): Promise<File> {
  try {
    return await toWebp(file, maxPx, aspect, focus);
  } catch {
    // Formato raro, canvas sin contexto, imagen corrupta: sube el original.
    // Peor que comprimido, mejor que un error que la clienta no puede resolver.
    return file;
  }
}

function toWebp(
  file: File,
  maxPx: number,
  aspect: number | undefined,
  focus: CropFocus
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (!width || !height) return reject(new Error("dimensiones vacías"));

      // Recorte a la proporcion pedida, corrido al punto de foco. Se calcula
      // sobre la imagen original (`sx/sy/sw/sh` de drawImage) y no escalando el
      // canvas: escalar deformaria, que es justo lo que hay que evitar.
      let sx = 0;
      let sy = 0;
      let sw = width;
      let sh = height;

      if (aspect) {
        // El foco se acota antes de usarlo: un valor fuera de rango daria un
        // `sx`/`sy` negativo y `drawImage` devolveria borde transparente.
        const fx = clamp01(focus.x);
        const fy = clamp01(focus.y);

        if (width / height > aspect) {
          sw = Math.round(height * aspect);
          sx = Math.round((width - sw) * fx);
        } else {
          sh = Math.round(width / aspect);
          sy = Math.round((height - sh) * fy);
        }
        width = sw;
        height = sh;
      }

      if (width > maxPx || height > maxPx) {
        if (width >= height) {
          height = Math.round((height / width) * maxPx);
          width = maxPx;
        } else {
          width = Math.round((width / height) * maxPx);
          height = maxPx;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("sin contexto 2d"));
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("toBlob falló"));

          const name = file.name.replace(/\.[^.]+$/, "") || "imagen";
          resolve(
            new File([blob], `${name}.webp`, { type: "image/webp" })
          );
        },
        "image/webp",
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("no se pudo cargar la imagen"));
    };

    img.src = url;
  });
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}
