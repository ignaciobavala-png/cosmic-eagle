/**
 * "Envio material" (28/10): documentos con el formato del cuaderno de
 * preparacion de Egipto (`docs/entregas/2026-10-28-texto-egipto/`). Ver
 * `docs/MATERIAL.md`.
 *
 * Un documento es una tapa + una lista de BLOQUES. Los bloques viajan como
 * jsonb y **nunca llevan HTML**: la clienta elige un tipo de bloque y escribe
 * texto, y `MaterialDocument` lo dibuja. No hay sanitizador en el proyecto, asi
 * que aceptar HTML seria un XSS almacenado.
 */

/** Las tres familias de imagen del PDF, mas la tapa (que es del documento). */
export const MATERIAL_IMAGE_KINDS = {
  banner: {
    label: "Banner",
    hint: "Horizontal, a todo el ancho de la hoja. Abre un capítulo o lo separa.",
    aspect: 16 / 9,
    maxPx: 2000,
  },
  perfil: {
    label: "Perfil",
    hint: "Vertical, dentro de la columna, al lado del texto.",
    aspect: 3 / 4,
    maxPx: 1400,
  },
  cuadrada: {
    label: "Cuadrada",
    hint: "Cuadrada, dentro de la columna.",
    aspect: 1,
    maxPx: 1200,
  },
} as const;

export type MaterialImageKind = keyof typeof MATERIAL_IMAGE_KINDS;

export function isImageKind(value: unknown): value is MaterialImageKind {
  return typeof value === "string" && value in MATERIAL_IMAGE_KINDS;
}

/** La tapa y la contratapa son una hoja A4 vertical, a sangre. */
export const MATERIAL_COVER = { aspect: 210 / 297, maxPx: 2000 } as const;

export type MaterialBlock =
  | {
      id: string;
      type: "capitulo";
      /** Linea chica arriba ("Parte I"). Opcional. */
      parte: string;
      /** Va en negrita, como el arranque de los titulos del PDF. */
      titulo: string;
      /** Sigue al titulo en peso normal ("Egipto como portal: [resto]"). */
      resto: string;
    }
  | {
      id: string;
      type: "texto";
      /** Parrafos separados por una linea en blanco. `**negrita**` inline. */
      texto: string;
      columnas: 1 | 2;
    }
  | { id: string; type: "destacado"; texto: string }
  | {
      id: string;
      type: "lista";
      /** Un item por linea. */
      texto: string;
    }
  | {
      id: string;
      type: "imagen";
      kind: MaterialImageKind;
      url: string;
      alt: string;
    };

export type MaterialBlockType = MaterialBlock["type"];

export const MATERIAL_BLOCK_LABELS: Record<MaterialBlockType, string> = {
  capitulo: "Capítulo",
  texto: "Texto",
  destacado: "Frase destacada",
  lista: "Lista",
  imagen: "Imagen",
};

export const MAX_BLOCKS = 200;
const MAX_TEXT = 20_000;
const MAX_LINE = 300;

/**
 * Los archivos de un documento viven en `site-assets` bajo `material/`, el
 * mismo bucket de Multimedia (escritura solo admin). Un bucket nuevo seria un
 * juego de policies mas para auditar sin ganar nada.
 */
export const MATERIAL_BUCKET = "site-assets";
export const MATERIAL_PREFIX = "material/";

function publicBase() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/${MATERIAL_BUCKET}/` : null;
}

/**
 * Solo se acepta una URL de nuestro bucket y bajo `material/`: los campos
 * viajan en el form y no pueden apuntar una imagen a cualquier lado.
 */
export function ownMaterialUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const base = publicBase();
  const url = value.trim();
  return base && url.startsWith(`${base}${MATERIAL_PREFIX}`) ? url : null;
}

/** La ruta dentro del bucket a partir de una URL publica nuestra. */
export function materialPathFromUrl(url: string): string | null {
  const base = publicBase();
  if (!base || !url.startsWith(base)) return null;
  const path = url.slice(base.length).split("?")[0];
  return path.startsWith(MATERIAL_PREFIX) ? decodeURIComponent(path) : null;
}

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max).trim() : "";
}

function blockId(value: unknown): string {
  return typeof value === "string" && /^[\w-]{1,64}$/.test(value)
    ? value
    : crypto.randomUUID();
}

/**
 * Valida lo que llega (del form o de la base) y devuelve solo bloques bien
 * formados: lo desconocido se descarta en silencio, y una imagen con URL ajena
 * se descarta entera. Nunca lanza.
 */
export function parseMaterialBlocks(raw: unknown): MaterialBlock[] {
  if (!Array.isArray(raw)) return [];

  const blocks: MaterialBlock[] = [];
  for (const item of raw.slice(0, MAX_BLOCKS)) {
    if (!item || typeof item !== "object") continue;
    const b = item as Record<string, unknown>;
    const id = blockId(b.id);

    switch (b.type) {
      case "capitulo": {
        const titulo = str(b.titulo, MAX_LINE);
        const resto = str(b.resto, MAX_LINE);
        if (!titulo && !resto) break;
        blocks.push({
          id,
          type: "capitulo",
          parte: str(b.parte, 80),
          titulo,
          resto,
        });
        break;
      }
      case "texto": {
        const texto = str(b.texto, MAX_TEXT);
        if (!texto) break;
        blocks.push({
          id,
          type: "texto",
          texto,
          columnas: b.columnas === 1 ? 1 : 2,
        });
        break;
      }
      case "destacado": {
        const texto = str(b.texto, 1000);
        if (texto) blocks.push({ id, type: "destacado", texto });
        break;
      }
      case "lista": {
        const texto = str(b.texto, MAX_TEXT);
        if (texto) blocks.push({ id, type: "lista", texto });
        break;
      }
      case "imagen": {
        const url = ownMaterialUrl(b.url);
        if (!url || !isImageKind(b.kind)) break;
        blocks.push({ id, type: "imagen", kind: b.kind, url, alt: str(b.alt, 200) });
        break;
      }
    }
  }
  return blocks;
}

/** Todas las imagenes que un documento usa, para limpiar el bucket. */
export function collectMaterialUrls(
  coverUrl: string | null,
  backCoverUrl: string | null,
  blocks: MaterialBlock[]
): string[] {
  const urls = new Set<string>();
  if (coverUrl) urls.add(coverUrl);
  if (backCoverUrl) urls.add(backCoverUrl);
  for (const block of blocks) {
    if (block.type === "imagen") urls.add(block.url);
  }
  return [...urls];
}

/** Parrafos de un texto: separados por una o mas lineas en blanco. */
export function splitParagraphs(texto: string): string[] {
  return texto
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);
}

/** Items de una lista: uno por linea, sin el guion si lo escribieron. */
export function splitItems(texto: string): string[] {
  return texto
    .split("\n")
    .map((line) => line.replace(/^\s*[-•●*]\s+/, "").trim())
    .filter(Boolean);
}

/** El indice sale de los capitulos, en orden. */
export function chapterAnchor(id: string) {
  return `cap-${id}`;
}
