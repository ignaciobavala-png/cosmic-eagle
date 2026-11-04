import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { tool } from "ai";
import { z } from "zod";
import { includesLoose } from "./names";
import type { Ctx } from "./tools";

/**
 * La guia de la organizacion (`docs/GUIA_ORG.md`): como funciona la plataforma,
 * por que, y que NO esta decidido. Es lo que le permite al asistente contestar
 * lo que la organizacion le pregunta a Ignacio.
 *
 * - **Una fuente, un archivo en docs/**: se edita como markdown. Cada `## ` es un
 *   tema; lo anterior al primero (el cartel de borrador) no se sirve.
 * - **Se lee por tema, no entera**: el asistente pide solo lo que necesita, asi la
 *   guia puede crecer sin encarecer cada mensaje.
 * - **Se lee del disco en cada request** (es chico). En Vercel el archivo viaja en
 *   el bundle por `outputFileTracingIncludes` en `next.config.ts`; sin eso la
 *   herramienta responde que la guia no esta disponible.
 * - **Lo que la guia no cubre se registra** (`ai_agent_log`, tool
 *   `guia_sin_respuesta`) para saber que documentar. Sin migracion: usa
 *   `kind = 'read'`.
 */
const GUIDE_PATH = path.join(process.cwd(), "docs", "GUIA_ORG.md");

type Tema = { titulo: string; texto: string };

function cargarTemas(): Tema[] | null {
  let raw: string;
  try {
    raw = readFileSync(GUIDE_PATH, "utf8");
  } catch {
    return null;
  }
  const partes = raw.split(/^## /m).slice(1);
  return partes
    .map((p) => {
      const salto = p.indexOf("\n");
      const titulo = p.slice(0, salto).trim();
      // El separador `---` entre temas no es contenido.
      const texto = p.slice(salto + 1).replace(/\n---\s*$/m, "").trim();
      return { titulo, texto };
    })
    .filter((t) => t.titulo && t.texto);
}

async function anotar(ctx: Ctx, tool: string, args: Record<string, unknown>, error: string | null, rows: number | null) {
  const { error: logError } = await ctx.supabase.from("ai_agent_log").insert({
    user_id: ctx.userId,
    conversation_id: ctx.conversationId,
    kind: "read",
    tool,
    args: args as never,
    rows_returned: rows,
    error,
  });
  if (logError) console.error("[ia] no se pudo escribir ai_agent_log:", logError.message);
}

export function buildGuideTools(ctx: Ctx) {
  const temas = cargarTemas();
  const lista = temas?.map((t) => t.titulo) ?? [];

  return {
    consultar_guia: tool({
      description:
        "Guía de la organización: cómo funciona la plataforma, POR QUÉ funciona así y qué cosas todavía NO están decididas. Usala SIEMPRE que pregunten cómo funciona algo, por qué pasa algo, qué sigue en un proceso, qué política hay (pagos, correos, acceso, cancelación) o qué existe y qué no. NO trae datos de personas ni de eventos (eso son las otras herramientas). Sin `tema` devuelve el índice. Temas: " +
        (lista.length ? lista.map((t) => `«${t}»`).join(", ") : "(la guía no está disponible)") +
        ". Podés pedir varios temas llamándola más de una vez.",
      inputSchema: z.object({
        tema: z
          .string()
          .optional()
          .describe("Título (o parte del título) de un tema de la lista. Vacío = índice de temas."),
      }),
      execute: async (args) => {
        if (!temas) {
          await anotar(ctx, "consultar_guia", args, "guia_no_disponible", null);
          return { error: "La guía no está disponible en este momento. No inventes la respuesta: decilo." };
        }
        if (!args.tema?.trim()) {
          await anotar(ctx, "consultar_guia", args, null, temas.length);
          return { temas: lista };
        }
        const hallados = temas.filter((t) => includesLoose(t.titulo, args.tema!));
        await anotar(ctx, "consultar_guia", args, hallados.length ? null : "tema_inexistente", hallados.length);
        if (!hallados.length) {
          return { error: `No hay un tema que coincida con «${args.tema}».`, temas: lista };
        }
        return { secciones: hallados.slice(0, 3).map((t) => ({ tema: t.titulo, contenido: t.texto })) };
      },
    }),

    guia_sin_respuesta: tool({
      description:
        "Registrá una pregunta que la guía NO cubre (o que cubre como PENDIENTE), para que Ignacio sepa qué documentar. Llamala cuando, después de consultar la guía, no tengas la respuesta. Después contestale a la persona que eso no está documentado y que lo consulte con Ignacio. No la uses para preguntas sobre datos en vivo.",
      inputSchema: z.object({
        pregunta: z.string().min(3).max(500).describe("La pregunta de la persona, en pocas palabras y sin datos personales"),
      }),
      execute: async (args) => {
        await anotar(ctx, "guia_sin_respuesta", { pregunta: args.pregunta.slice(0, 500) }, null, 0);
        return { registrada: true };
      },
    }),
  };
}
