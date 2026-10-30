import { tool } from "ai";
import { z } from "zod";
import type { createClient } from "@/lib/supabase/server";
import { SITE_GROUPS } from "@/lib/site-content";
import { EXPERIENCE_LEVELS, RELATIONSHIP_STATES, filterContacts } from "@/lib/crm";
import { loadContacts } from "@/lib/crm-data";

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

/** Hoy en Buenos Aires como `YYYY-MM-DD`: `trips.start_date`/`end_date` son `date`, sin hora. */
function hoyAR() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
}

const TIPO_NOMBRE = { retiro: "Retiro", ceremonia: "Sesión" } as const;

/**
 * Lo que el modelo no debe deducir solo: si el evento ya pasó y de qué tipo es.
 * Comparar strings `YYYY-MM-DD` es comparar fechas. `estado_desactualizado`
 * marca un evento pasado que sigue 'open' o 'closed' (nadie lo pasó a
 * 'completed'): el dato está mal cargado, no el evento.
 */
function momento(trip: { type: string; status: string; start_date: string; end_date: string }) {
  const hoy = hoyAR();
  const yaPaso = trip.end_date < hoy;
  const enCurso = !yaPaso && trip.start_date <= hoy;
  return {
    tipo_nombre: TIPO_NOMBRE[trip.type as keyof typeof TIPO_NOMBRE] ?? trip.type,
    momento: yaPaso ? "ya sucedió" : enCurso ? "en curso" : "próximo",
    ya_paso: yaPaso,
    ...(yaPaso && (trip.status === "open" || trip.status === "closed") ? { estado_desactualizado: true } : {}),
  };
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
        "Lista los retiros (tipo 'retiro') y las sesiones (tipo 'ceremonia') con fecha, precio en USD, cupo, cuántas solicitudes hay en cada estado y si ya sucedió ('momento'). Por defecto trae solo los próximos o en curso: para lo que ya pasó usá cuando='pasados'. Usala para saber qué existe, cuántos lugares quedan o encontrar el id de un evento.",
      inputSchema: z.object({
        tipo: z.enum(["retiro", "ceremonia"]).optional().describe("retiro = Viaje Cósmico, ceremonia = Sesión Cósmica"),
        estado: z
          .enum(["draft", "open", "closed", "completed"])
          .optional()
          .describe("draft = borrador, open = abierto a inscripción, closed = cerrado, completed = ya pasó"),
        texto: z.string().optional().describe("Parte del nombre"),
        cuando: z
          .enum(["proximos", "pasados", "todos"])
          .optional()
          .describe("proximos (por defecto) = los que terminan hoy o después; pasados = los que ya sucedieron, el más reciente primero; todos"),
      }),
      execute: (args) =>
        leer(ctx, "listar_viajes", args, async () => {
          const cuando = args.cuando ?? "proximos";
          const hoy = hoyAR();
          let query = supabase
            .from("trips")
            .select("id, title, type, status, category, start_date, end_date, capacity, price, deposit_amount, city, country")
            .order("start_date", { ascending: cuando !== "pasados" })
            .limit(MAX_ROWS);
          if (cuando === "proximos") query = query.gte("end_date", hoy);
          if (cuando === "pasados") query = query.lt("end_date", hoy);
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
              const m = momento(trip);
              return {
                ...trip,
                ...m,
                solicitudes_por_estado: porEstado,
                aprobadas,
                // En un evento que ya pasó "lugares libres" no significa nada.
                lugares_libres: m.ya_paso ? null : Math.max(trip.capacity - aprobadas, 0),
              };
            }),
          };
        }),
    }),

    listar_solicitudes: tool({
      description:
        "Lista solicitudes de inscripción (cada una es la reserva de una persona en UN evento, retiro o sesión; el campo trip.tipo_nombre lo dice y trip.momento aclara si ya sucedió) con nombre, país, ceremonias previas, estado de revisión, estado y monto de pago. NO devuelve mails, teléfonos ni datos de salud: si te piden contactar a alguien, decí que eso se hace desde el panel. Devuelve como máximo 25, las más nuevas primero.",
      inputSchema: z.object({
        estado: z
          .enum(["pending_review", "needs_conversation", "approved", "rejected", "expired"])
          .optional()
          .describe("pending_review = esperando revisión, needs_conversation = hay que hablar con la persona"),
        pago: z.enum(["pending", "deposit_paid", "paid", "waived"]).optional(),
        viaje_id: z.string().uuid().optional().describe("Id de un viaje, sacado de listar_viajes"),
        nombre: z.string().optional().describe("Parte del nombre de la persona"),
        tipo: z.enum(["retiro", "ceremonia"]).optional().describe("Solo reservas de retiros o solo de sesiones"),
        cuando: z
          .enum(["proximos", "pasados"])
          .optional()
          .describe("Filtra por si el evento al que apunta la solicitud ya sucedió (pasados) o no (proximos). Sin esto trae ambos"),
      }),
      execute: (args) =>
        leer(ctx, "listar_solicitudes", args, async () => {
          const hoy = hoyAR();
          // `!inner` solo cuando se filtra por el evento: sin él, un filtro sobre la
          // tabla embebida no descarta la fila de la solicitud.
          const inner = args.tipo || args.cuando ? "!inner" : "";
          let query = supabase
            .from("applications")
            .select(
              `id, full_name, residence_country, status, payment_status, amount_paid, previous_ceremonies, created_at, reviewed_at, trip:trips${inner}(id, title, type, status, start_date, end_date)`
            )
            .order("created_at", { ascending: false })
            .limit(MAX_ROWS);
          if (args.estado) query = query.eq("status", args.estado);
          if (args.pago) query = query.eq("payment_status", args.pago);
          if (args.viaje_id) query = query.eq("trip_id", args.viaje_id);
          if (args.nombre && cleanSearch(args.nombre)) query = query.ilike("full_name", `%${cleanSearch(args.nombre)}%`);
          if (args.tipo) query = query.eq("trips.type", args.tipo);
          if (args.cuando === "proximos") query = query.gte("trips.end_date", hoy);
          if (args.cuando === "pasados") query = query.lt("trips.end_date", hoy);

          const { data, error } = await query;
          if (error) return { error: error.message };
          return { rows: data.map((a) => ({ ...a, trip: a.trip ? { ...a.trip, ...momento(a.trip) } : null })) };
        }),
    }),

    ver_participante: tool({
      description:
        "Ficha de una persona: país, profesión, experiencia previa y su HISTORIAL completo de reservas (a qué retiros y sesiones se anotó, cuáles ya sucedieron, estado y pago de cada una), con totales por tipo. 'asistio' es true solo si la reserva fue aprobada, el evento ya pasó y hay pago (o está exonerado). NO trae mail, teléfono ni salud. Si el nombre coincide con varias personas, devuelve a todas: preguntá cuál.",
      inputSchema: z.object({
        nombre: z.string().min(2).describe("Parte del nombre de la persona"),
      }),
      execute: (args) =>
        leer(ctx, "ver_participante", args, async () => {
          const needle = cleanSearch(args.nombre);
          if (needle.length < 2) return { error: "Nombre demasiado corto." };

          const { data: apps, error } = await supabase
            .from("applications")
            .select(
              "id, user_id, full_name, residence_country, status, payment_status, amount_paid, previous_ceremonies, created_at, trip:trips(id, title, type, status, start_date, end_date)"
            )
            .ilike("full_name", `%${needle}%`)
            .order("created_at", { ascending: false })
            .limit(100);
          if (error) return { error: error.message };
          if (!apps.length) return { rows: [] };

          const ids = [...new Set(apps.map((a) => a.user_id))].slice(0, 10);
          const { data: perfiles, error: perfilesError } = await supabase
            .from("profiles")
            .select("id, country, gender, profession, prior_experience, spiritual_practices, referral_source")
            .in("id", ids);
          if (perfilesError) return { error: perfilesError.message };

          const rows = ids.map((id) => {
            const own = apps.filter((a) => a.user_id === id);
            const perfil = perfiles.find((p) => p.id === id);
            const historial = own
              .filter((a) => a.trip)
              .map((a) => {
                const m = momento(a.trip!);
                const asistio = a.status === "approved" && m.ya_paso && a.payment_status !== "pending";
                return {
                  evento: a.trip!.title,
                  tipo_nombre: m.tipo_nombre,
                  inicio: a.trip!.start_date,
                  fin: a.trip!.end_date,
                  momento: m.momento,
                  estado_reserva: a.status,
                  pago: a.payment_status,
                  monto_pagado_usd: a.amount_paid,
                  asistio,
                };
              })
              .sort((x, y) => y.inicio.localeCompare(x.inicio));
            const asistidos = historial.filter((h) => h.asistio);
            return {
              nombre: own[0].full_name,
              pais_residencia: own[0].residence_country,
              ceremonias_previas_declaradas: Math.max(...own.map((a) => a.previous_ceremonies)),
              perfil: perfil
                ? {
                    pais: perfil.country,
                    genero: perfil.gender,
                    profesion: perfil.profession,
                    experiencia_previa: clip(perfil.prior_experience),
                    practicas_espirituales: clip(perfil.spiritual_practices),
                    como_nos_conocio: perfil.referral_source,
                  }
                : null,
              totales: {
                reservas: historial.length,
                retiros_asistidos: asistidos.filter((h) => h.tipo_nombre === "Retiro").length,
                sesiones_asistidas: asistidos.filter((h) => h.tipo_nombre === "Sesión").length,
                proximos: historial.filter((h) => h.momento !== "ya sucedió" && h.estado_reserva === "approved").length,
              },
              historial,
            };
          });
          return { rows, extra: ids.length > 1 ? { aviso: "Hay más de una persona con ese nombre." } : undefined };
        }),
    }),

    consultar_crm: tool({
      description:
        "Segmenta a las personas registradas como el CRM del panel: estado de la relación (viajero = tiene una reserva aprobada, solicitante = reserva en revisión, potencial = se registró pero nunca viajó), nivel de experiencia (nuevo, principiante, intermedio, avanzado, experto, según ceremonias), país, género y evento. Devuelve el conteo total del segmento y hasta 25 personas. Sirve para '¿cuántos viajeros nuevos hay?', '¿quiénes son de Chile y ya viajaron?'. NO trae mails ni teléfonos. Los umbrales de avanzado (10) y experto (20) son provisorios.",
      inputSchema: z.object({
        estado: z.enum(RELATIONSHIP_STATES.map((s) => s.value) as [string, ...string[]]).optional(),
        nivel: z.enum(EXPERIENCE_LEVELS.map((l) => l.value) as [string, ...string[]]).optional(),
        pais: z.string().optional().describe("País tal como figura en el CRM, ej. 'Chile'"),
        genero: z.enum(["mujer", "hombre", "no_binario", "prefiero_no_decir"]).optional(),
        viaje_id: z.string().uuid().optional().describe("Solo personas con una reserva (cualquier estado) en este evento"),
      }),
      execute: (args) =>
        leer(ctx, "consultar_crm", args, async () => {
          const todos = await loadContacts(supabase);
          // Las cuentas del equipo no son contactos.
          const segmento = filterContacts(todos, {
            estado: args.estado,
            nivel: args.nivel,
            pais: args.pais,
            genero: args.genero,
            viaje: args.viaje_id,
          }).filter((c) => !c.isAdmin);

          const contar = (key: "state" | "experience") => {
            const out: Record<string, number> = {};
            for (const c of segmento) out[c[key]] = (out[c[key]] ?? 0) + 1;
            return out;
          };

          return {
            rows: segmento
              .slice(0, MAX_ROWS)
              .map((c) => ({
                nombre: c.fullName,
                pais: c.country,
                genero: c.gender,
                estado: c.state,
                nivel: c.experience,
                ceremonias: c.ceremonies,
                solicitudes: c.applications,
              })),
            extra: {
              total_segmento: segmento.length,
              por_estado: contar("state"),
              por_nivel: contar("experience"),
              ...(segmento.length > MAX_ROWS ? { aviso: "Se muestran 25; los conteos son del segmento completo." } : {}),
            },
          };
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
