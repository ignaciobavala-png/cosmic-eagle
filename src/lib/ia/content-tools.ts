import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { articleCategoryLabel } from "@/lib/article";
import { contentAccessLabel } from "@/lib/content-access";
import { normalize } from "./names";
import { clip, leer, type Ctx } from "./tools";

/**
 * LEER el cuerpo de los contenidos: lo que la organizacion publica en la
 * biblioteca y en las preguntas frecuentes.
 *
 * Por que herramientas y no cargarlo todo en el prompt: son ~30 articulos y
 * ~225.000 caracteres (unos 60.000 tokens). En el prompt eso se paga en CADA
 * mensaje (hoy una consulta simple gasta ~8.000). Asi el asistente busca primero
 * y lee completo solo lo que hace falta, y puede llegar a todos.
 *
 * Que sale a DeepSeek (un tercero): texto que la propia organizacion escribio y
 * publica (o tiene en borrador). Incluye los contenidos de nivel "programa", que
 * son material cerrado: salen solo para quien ya es admin, nunca para un viajero.
 * No hay datos de personas (los testimonios ya son publicos con su nombre).
 */

/** Cuanto texto devuelve `leer_articulo` por llamada (~1.600 tokens). */
const CHUNK = 6000;
const MAX_ARTICLES = 8;
const MAX_HITS_PER_ARTICLE = 3;

/** Un HTML subido se guarda entero en `body`: se pasa a texto plano. */
function plano(body: string, format: string | null) {
  if (format !== "html") return body;
  return body
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

/**
 * Todas las palabras buscadas, cada una al COMIENZO de alguna palabra del texto
 * (sin acentos ni mayusculas): "ayuno" encuentra "ayuno" y "ayunos", pero no
 * "desayuno". Un `includes` pelado confundia las dos y el asistente tenia que
 * descartar el falso positivo.
 */
function contiene(texto: string, palabras: string[]) {
  const n = ` ${normalize(texto)}`;
  return palabras.every((w) => n.includes(` ${w}`));
}

/** Parrafos que contienen TODAS las palabras buscadas. */
function parrafosCon(texto: string, palabras: string[]) {
  return texto
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20 && contiene(p, palabras));
}

export function buildContentTools(ctx: Ctx) {
  const { supabase } = ctx;

  return {
    buscar_en_contenidos: tool({
      description:
        "Busca una palabra o tema DENTRO del texto de los artículos de la biblioteca y de las preguntas frecuentes (no solo en el título). Devuelve los artículos donde aparece, con los párrafos que lo mencionan. Usala para '¿qué dice la organización sobre el ego / la preparación / la psilocibina / la alimentación?', '¿hay algún artículo que hable de X?' o para encontrar de dónde sale una respuesta. Después, si hace falta el texto entero, usá leer_articulo con el id.",
      inputSchema: z.object({
        texto: z.string().min(2).max(80).describe("Una o varias palabras: deben aparecer todas en el mismo párrafo"),
      }),
      execute: (args) =>
        leer(ctx, "buscar_en_contenidos", args, async () => {
          const palabras = normalize(args.texto).split(" ").filter((w) => w.length > 1);
          if (!palabras.length) return { error: "Buscá con alguna palabra más larga." };

          const [{ data: arts, error }, { data: faqs, error: faqError }] = await Promise.all([
            supabase.from("articles").select("id, title, category, access_level, status, body_format, body"),
            supabase.from("faqs").select("id, question, answer, group_label, is_published"),
          ]);
          if (error) return { error: error.message };
          if (faqError) return { error: faqError.message };

          const enArticulos = arts
            .map((a) => {
              const hits = parrafosCon(plano(a.body ?? "", a.body_format), palabras);
              const enTitulo = contiene(a.title, palabras);
              return { a, hits, enTitulo };
            })
            .filter((x) => x.hits.length || x.enTitulo)
            .sort((x, y) => Number(y.enTitulo) - Number(x.enTitulo) || y.hits.length - x.hits.length)
            .slice(0, MAX_ARTICLES)
            .map(({ a, hits }) => ({
              tipo: "articulo",
              id: a.id,
              titulo: a.title,
              categoria: articleCategoryLabel(a.category),
              acceso: contentAccessLabel(a.access_level),
              estado: a.status === "published" ? "publicado" : "borrador",
              parrafos_que_lo_mencionan: hits.length,
              fragmentos: hits.slice(0, MAX_HITS_PER_ARTICLE).map((h) => clip(h, 320)),
            }));

          const enFaqs = faqs
            .filter((f) => contiene(`${f.question} ${f.answer}`, palabras))
            .slice(0, 6)
            .map((f) => ({
              tipo: "pregunta frecuente",
              grupo: f.group_label,
              publicada: f.is_published,
              pregunta: f.question,
              respuesta: clip(f.answer, 700),
            }));

          const rows = [...enArticulos, ...enFaqs];
          return {
            rows,
            extra: rows.length
              ? undefined
              : { aviso: "No aparece en ningún artículo ni pregunta frecuente. No supongas lo que diría la organización." },
          };
        }),
    }),

    leer_articulo: tool({
      description:
        "Lee el TEXTO COMPLETO de un artículo de la biblioteca (por su id, que sale de listar_articulos o buscar_en_contenidos). Devuelve el texto en tramos de unos 6.000 caracteres: si `quedan_caracteres` es mayor que 0, llamala de nuevo con `desde` = `siguiente_desde` para seguir leyendo. Usala antes de afirmar qué dice un artículo.",
      inputSchema: z.object({
        id: z.string().uuid(),
        desde: z.number().int().min(0).optional().describe("Posición desde la que seguir leyendo (default 0)"),
      }),
      execute: (args) =>
        leer(ctx, "leer_articulo", args, async () => {
          const { data, error } = await supabase
            .from("articles")
            .select("id, title, category, access_level, status, body_format, body, excerpt")
            .eq("id", args.id)
            .maybeSingle();
          if (error) return { error: error.message };
          if (!data) return { error: "No encontré ese artículo." };

          const texto = plano(data.body ?? "", data.body_format);
          const desde = args.desde ?? 0;
          const tramo = texto.slice(desde, desde + CHUNK);
          const quedan = Math.max(texto.length - (desde + CHUNK), 0);
          return {
            rows: [
              {
                id: data.id,
                titulo: data.title,
                categoria: articleCategoryLabel(data.category),
                acceso: contentAccessLabel(data.access_level),
                estado: data.status === "published" ? "publicado" : "borrador",
                largo_total: texto.length,
                desde,
                texto: tramo,
                quedan_caracteres: quedan,
                ...(quedan > 0 ? { siguiente_desde: desde + CHUNK } : {}),
              },
            ],
          };
        }),
    }),
  };
}
