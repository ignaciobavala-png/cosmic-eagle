import { tool } from "ai";
import { z } from "zod";
import type { createClient } from "@/lib/supabase/server";
import { SITE_GROUPS } from "@/lib/site-content";

/**
 * Herramientas de LECTURA del agente del panel (etapa 1 de /admin/ia).
 *
 * Reglas que sostienen todo esto:
 *
 * - Leen con el cliente de **la sesion del admin**, no con service role: la RLS
 *   es la misma que ve el panel, y el agente no puede mas que quien le habla.
 * - **Lista de columnas explicita, nunca `select("*")`.** Lo que devuelve una
 *   herramienta sale a DeepSeek, un tercero. Por decision (28/10) el agente ve
 *   nombres pero **no mails ni telefonos**, y **nada de salud**: ni el filtro
 *   medico de `applications` (`serious_illness`, `current_medication`, …) ni los
 *   comentarios libres, ni el formulario de salud, el consentimiento o los
 *   comprobantes. Una columna nueva en esas tablas no entra sola: hay que
 *   sumarla aca a proposito.
 * - Topes de filas y de largo de texto en cada respuesta.
 * - Cada llamada deja una fila en `ai_agent_log`: es el registro de lo que el
 *   modelo vio. Si el log falla, la herramienta igual responde.
 */
type Supabase = Awaited<ReturnType<typeof createClient>>;

type Ctx = {
  supabase: Supabase;
  userId: string;
  conversationId: string | null;
};

const MAX_ROWS = 25;

/** Saca lo que rompe un filtro de PostgREST (`%`, `,`, parentesis). */
function cleanSearch(text: string) {
  return text.replace(/[%,()*\\]/g, " ").trim().slice(0, 60);
}

function clip(text: string | null, max = 240) {
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/**
 * Corre una lectura, la registra y devuelve un resultado que el modelo puede
 * leer incluso si fallo (`{ error }`): lanzar cortaria el turno entero.
 */
async function leer<T>(
  ctx: Ctx,
  toolName: string,
  args: Record<string, unknown>,
  run: () => PromiseLike<{ rows: T[]; extra?: Record<string, unknown> } | { error: string }>
) {
  const result = await run();
  const error = "error" in result ? result.error : null;
  const rows = "rows" in result ? result.rows.length : null;

  const { error: logError } = await ctx.supabase.from("ai_agent_log").insert({
    user_id: ctx.userId,
    conversation_id: ctx.conversationId,
    kind: "read",
    tool: toolName,
    args: args as never,
    rows_returned: rows,
    error,
  });
  if (logError) console.error("[ia] no se pudo escribir ai_agent_log:", logError.message);

  if ("error" in result) return { error: result.error };
  return { cantidad: result.rows.length, ...result.extra, resultados: result.rows };
}

export function buildReadTools(ctx: Ctx) {
  const { supabase } = ctx;

  return {
    listar_viajes: tool({
      description:
        "Lista los viajes (tipo 'retiro') y las sesiones (tipo 'ceremonia') con fecha, precio en USD, cupo y cuántas solicitudes hay en cada estado. Usala para saber qué existe, cuántos lugares quedan o encontrar el id de un viaje.",
      inputSchema: z.object({
        tipo: z.enum(["retiro", "ceremonia"]).optional().describe("retiro = Viaje Cósmico, ceremonia = Sesión Cósmica"),
        estado: z
          .enum(["draft", "open", "closed", "completed"])
          .optional()
          .describe("draft = borrador, open = abierto a inscripción, closed = cerrado, completed = ya pasó"),
        texto: z.string().optional().describe("Parte del nombre"),
      }),
      execute: (args) =>
        leer(ctx, "listar_viajes", args, async () => {
          let query = supabase
            .from("trips")
            .select("id, title, type, status, category, start_date, end_date, capacity, price, deposit_amount, city, country")
            .order("start_date", { ascending: true })
            .limit(MAX_ROWS);
          if (args.tipo) query = query.eq("type", args.tipo);
          if (args.estado) query = query.eq("status", args.estado);
          if (args.texto && cleanSearch(args.texto)) query = query.ilike("title", `%${cleanSearch(args.texto)}%`);

          const { data: trips, error } = await query;
          if (error) return { error: error.message };
          if (!trips.length) return { rows: [] };

          const { data: apps, error: appsError } = await supabase
            .from("applications")
            .select("trip_id, status, payment_status")
            .in("trip_id", trips.map((t) => t.id));
          if (appsError) return { error: appsError.message };

          return {
            rows: trips.map((trip) => {
              const own = apps.filter((a) => a.trip_id === trip.id);
              const porEstado: Record<string, number> = {};
              for (const a of own) porEstado[a.status] = (porEstado[a.status] ?? 0) + 1;
              const aprobadas = porEstado.approved ?? 0;
              return {
                ...trip,
                solicitudes_por_estado: porEstado,
                aprobadas,
                lugares_libres: Math.max(trip.capacity - aprobadas, 0),
              };
            }),
          };
        }),
    }),

    listar_solicitudes: tool({
      description:
        "Lista solicitudes de inscripción con nombre, país, estado de revisión, estado y monto de pago, y a qué viaje corresponden. NO devuelve mails, teléfonos ni datos de salud: si te piden contactar a alguien, decí que eso se hace desde el panel. Devuelve como máximo 25, las más nuevas primero.",
      inputSchema: z.object({
        estado: z
          .enum(["pending_review", "needs_conversation", "approved", "rejected", "expired"])
          .optional()
          .describe("pending_review = esperando revisión, needs_conversation = hay que hablar con la persona"),
        pago: z.enum(["pending", "deposit_paid", "paid", "waived"]).optional(),
        viaje_id: z.string().uuid().optional().describe("Id de un viaje, sacado de listar_viajes"),
        nombre: z.string().optional().describe("Parte del nombre de la persona"),
      }),
      execute: (args) =>
        leer(ctx, "listar_solicitudes", args, async () => {
          let query = supabase
            .from("applications")
            .select(
              "id, full_name, residence_country, status, payment_status, amount_paid, created_at, reviewed_at, trip:trips(id, title, type, start_date)"
            )
            .order("created_at", { ascending: false })
            .limit(MAX_ROWS);
          if (args.estado) query = query.eq("status", args.estado);
          if (args.pago) query = query.eq("payment_status", args.pago);
          if (args.viaje_id) query = query.eq("trip_id", args.viaje_id);
          if (args.nombre && cleanSearch(args.nombre)) query = query.ilike("full_name", `%${cleanSearch(args.nombre)}%`);

          const { data, error } = await query;
          if (error) return { error: error.message };
          return { rows: data };
        }),
    }),

    listar_textos_sitio: tool({
      description:
        "Lista los textos editables del sitio (los que se cargan en Multimedia) con su clave, el grupo al que pertenecen y el valor actual. Sirve para encontrar la clave de un texto antes de proponer cambiarlo. Las imágenes y videos no se listan.",
      inputSchema: z.object({
        texto: z.string().optional().describe("Palabra a buscar en la etiqueta, la clave o el contenido"),
      }),
      execute: (args) =>
        leer(ctx, "listar_textos_sitio", args, async () => {
          const { data: overrides, error } = await supabase.from("site_content").select("key, value");
          if (error) return { error: error.message };
          const actuales = new Map(overrides.map((o) => [o.key, o.value]));

          const needle = args.texto ? cleanSearch(args.texto).toLowerCase() : "";
          const rows = SITE_GROUPS.flatMap((group) =>
            group.slots
              .filter((slot) => slot.type === "text" || slot.type === "multiline")
              .map((slot) => ({
                clave: slot.key,
                grupo: group.title,
                etiqueta: slot.label,
                valor: clip(actuales.get(slot.key) ?? slot.fallback),
                editado_por_la_clienta: actuales.has(slot.key),
              }))
          ).filter(
            (row) =>
              !needle ||
              `${row.clave} ${row.etiqueta} ${row.valor ?? ""}`.toLowerCase().includes(needle)
          );

          return { rows: rows.slice(0, MAX_ROWS), extra: rows.length > MAX_ROWS ? { hay_mas: rows.length - MAX_ROWS } : undefined };
        }),
    }),

    listar_avisos: tool({
      description:
        "Lista los avisos del panel (la campanita): solicitudes nuevas, comprobantes cargados, correos que no se pudieron mandar. Los más nuevos primero.",
      inputSchema: z.object({
        solo_no_leidos: z.boolean().optional().describe("true para ver solo los pendientes de leer"),
      }),
      execute: (args) =>
        leer(ctx, "listar_avisos", args, async () => {
          let query = supabase
            .from("admin_notifications")
            .select("id, kind, title, body, created_at, read_at, trip_id")
            .order("created_at", { ascending: false })
            .limit(MAX_ROWS);
          if (args.solo_no_leidos) query = query.is("read_at", null);

          const { data, error } = await query;
          if (error) return { error: error.message };
          return { rows: data.map((n) => ({ ...n, body: clip(n.body) })) };
        }),
    }),
  };
}
