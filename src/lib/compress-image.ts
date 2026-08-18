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
 * `aspect` (ancho / alto) recorta la imagen a esa proporcion **desde el centro**
 * antes de escalar. Se usa para las portadas de viaje: se guarda una sola imagen
 * en 16:9 y cada lugar del sitio recorta desde ahi (ver docs/PORTADAS.md). Sin
 * `aspect` la imagen conserva su proporcion original, que es lo que quiere el
 * panel de multimedia, donde cada slot tiene la suya.
 */
export async function compressImage(
  file: File,
  maxPx = 1600,
  aspect?: number
): Promise<File> {
  try {
    return await toWebp(file, maxPx, aspect);
  } catch {
    // Formato raro, canvas sin contexto, imagen corrupta: sube el original.
    // Peor que comprimido, mejor que un error que la clienta no puede resolver.
    return file;
  }
}

function toWebp(file: File, maxPx: number, aspect?: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (!width || !height) return reject(new Error("dimensiones vacías"));

      // Recorte centrado a la proporcion pedida. Se calcula sobre la imagen
      // original (`sx/sy/sw/sh` de drawImage) y no escalando el canvas: escalar
      // deformaria, que es justo lo que hay que evitar.
      let sx = 0;
      let sy = 0;
      let sw = width;
      let sh = height;

      if (aspect) {
        if (width / height > aspect) {
          sw = Math.round(height * aspect);
          sx = Math.round((width - sw) / 2);
        } else {
          sh = Math.round(width / aspect);
          sy = Math.round((height - sh) / 2);
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
