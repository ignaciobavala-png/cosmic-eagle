import "server-only";
import { createHmac } from "node:crypto";
import { tool } from "ai";
import { z } from "zod";
import { sendEmail } from "@/lib/email/resend";
import { AvisoInterno } from "@/emails/AvisoInterno";
import { capitalizeName } from "@/lib/person-name";
import { revalidatePath } from "next/cache";
import { publicPath } from "@/i18n/public-path";
import { TRIP_TYPES } from "@/lib/trip-type";
import { TRIP_CATEGORIES } from "@/lib/trip-fields";
import { ARTICLE_CATEGORY_LIST } from "@/lib/article";
import { CONTENT_ACCESS_LEVELS } from "@/lib/content-access";
import { parseTripForm } from "@/lib/trip-form";
import { parseArticleForm } from "@/lib/article-form";
import { parseTestimonialForm } from "@/lib/testimonial-form";
import { TESTIMONIAL_MAX_CHARS } from "@/lib/testimonials";
import type { createClient } from "@/lib/supabase/server";

/**
 * Herramientas de ESCRITURA del asistente (etapa 2). Todas exigen aprobacion
 * humana: el agente las declara en `toolApproval` y firma el pedido con
 * `approvalSecret()`, asi un cliente manipulado no puede fabricar un "aprobado".
 *
 * Reglas:
 * - El correo solo va al EQUIPO (cuentas `is_admin`). El destinatario lo resuelve
 *   el servidor por nombre; el modelo no ve ni escribe direcciones.
 * - Un correo a un viajero NO existe aca: eso se hace desde el panel.
 */
type Supabase = Awaited<ReturnType<typeof createClient>>;
type Ctx = { supabase: Supabase; userId: string; conversationId: string | null };

/** Correos por persona y por dia (Buenos Aires). Corta un bucle del modelo. */
const MAX_CORREOS_DIA = 20;

/**
 * Secreto para firmar las aprobaciones. `TOOL_APPROVAL_SECRET` si existe; si no,
 * se deriva de la llave de servicio (que solo vive en el servidor), asi no hay
 * una variable mas que configurar.
 */
export function approvalSecret(): string | null {
  if (process.env.TOOL_APPROVAL_SECRET) return process.env.TOOL_APPROVAL_SECRET;
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) return null;
  return createHmac("sha256", base).update("ia-tool-approval").digest("hex");
}

function hoyAR() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
}

export function buildWriteTools(ctx: Ctx) {
  const { supabase } = ctx;

  async function anotar(
    args: Record<string, unknown>,
    rows: number | null,
    error: string | null,
    toolName = "enviar_correo_equipo"
  ) {
    const { error: logError } = await supabase.from("ai_agent_log").insert({
      user_id: ctx.userId,
      conversation_id: ctx.conversationId,
      kind: "write",
      tool: toolName,
      args: args as never,
      rows_returned: rows,
      error,
    });
    if (logError) console.error("[ia] no se pudo escribir ai_agent_log:", logError.message);
  }

  return {
    enviar_correo_equipo: tool({
      description:
        "Manda un correo INTERNO a una persona del equipo o a todo el equipo (las cuentas de administración). Pide la aprobación de quien habla antes de enviar. NO sirve para escribirle a viajeros ni a participantes: eso se hace desde el CRM del panel. Usala cuando te pidan avisar, recordar o pasarle un resumen a alguien del equipo. El mensaje va en texto plano, en español, con los datos concretos que ya consultaste.",
      inputSchema: z.object({
        para: z
          .string()
          .min(2)
          .describe("Nombre de la persona del equipo (ej. 'Estela') o 'todos' para todo el equipo"),
        asunto: z.string().min(3).max(120),
        mensaje: z.string().min(3).max(3000).describe("Cuerpo del correo, texto plano; sin saludo ni firma (se agregan solos)"),
      }),
      execute: async (args) => {
        // Tope diario de correos de esta persona.
        const { count } = await supabase
          .from("ai_agent_log")
          .select("id", { count: "exact", head: true })
          .eq("user_id", ctx.userId)
          .eq("kind", "write")
          .eq("tool", "enviar_correo_equipo")
          .gte("created_at", `${hoyAR()}T00:00:00-03:00`);
        if ((count ?? 0) >= MAX_CORREOS_DIA) {
          const error = "Llegaste al tope de correos del asistente por hoy.";
          await anotar({ para: args.para, asunto: args.asunto }, 0, error);
          return { error };
        }

        const { data: equipo, error: equipoError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("is_admin", true);
        if (equipoError) {
          await anotar({ para: args.para, asunto: args.asunto }, 0, equipoError.message);
          return { error: equipoError.message };
        }

        const todos = (equipo ?? []).filter((p) => p.email);
        const quiere = args.para.trim().toLowerCase();
        const destinatarios =
          quiere === "todos" || quiere === "todo el equipo" || quiere === "equipo"
            ? todos
            : todos.filter((p) => `${p.full_name ?? ""} ${p.email!.split("@")[0]}`.toLowerCase().includes(quiere));

        if (!destinatarios.length) {
          const error = `No encontré a nadie del equipo que coincida con "${args.para}".`;
          await anotar({ para: args.para, asunto: args.asunto }, 0, error);
          return { error };
        }
        // Un nombre ambiguo no se adivina: se pregunta.
        if (quiere !== "todos" && quiere !== "todo el equipo" && quiere !== "equipo" && destinatarios.length > 1) {
          const error = `"${args.para}" coincide con más de una persona: ${destinatarios
            .map((p) => p.full_name ?? "cuenta sin nombre")
            .join(", ")}. Preguntá a cuál.`;
          await anotar({ para: args.para, asunto: args.asunto }, 0, error);
          return { error };
        }

        const yo = todos.find((p) => p.id === ctx.userId)?.full_name ?? "alguien del equipo";
        const enviados: string[] = [];
        const fallidos: string[] = [];
        for (const p of destinatarios) {
          // La cuenta compartida de la organización se llama "Cosmic Eagle": el saludo
          // va con el nombre entero, no con la primera palabra ("Hola Cosmic").
          const completo = p.full_name ?? "";
          const nombre = /cosmic eagle/i.test(completo)
            ? completo
            : capitalizeName(completo.split(" ")[0] || "equipo");
          const result = await sendEmail({
            to: p.email!,
            subject: args.asunto,
            react: AvisoInterno({ nombre, asunto: args.asunto, mensaje: args.mensaje, pedidoPor: yo }),
          });
          (result.ok ? enviados : fallidos).push(p.full_name ?? "una cuenta del equipo");
        }

        await anotar(
          { para: args.para, asunto: args.asunto, enviados: enviados.length, fallidos: fallidos.length },
          enviados.length,
          fallidos.length ? `No se pudo enviar a: ${fallidos.join(", ")}` : null
        );
        return { enviados, fallidos };
      },
    }),

    crear_viaje: tool({
      description:
        "Crea un retiro (Viaje Cósmico, de varios días) o una sesión (Sesión Cósmica, de un día) NUEVO. Siempre se crea como BORRADOR: no se ve en el sitio hasta que alguien lo abra desde el panel (Experiencias). Pide aprobación antes de crear. Antes de llamarla, consultá listar_viajes para no duplicar uno que ya existe. Pedile a la persona los datos que falten (tipo, ciudad, país, fechas, cupo, precio en USD); NO los inventes. No carga portada, galería ni programa: eso se completa después en el panel.",
      inputSchema: z.object({
        tipo: z.enum(["retiro", "ceremonia"]).describe("retiro = Viaje Cósmico, ceremonia = Sesión Cósmica"),
        titulo: z
          .string()
          .max(120)
          .optional()
          .describe("Nombre. Si no hay, se arma solo (ej. 'Sesión Cósmica en Santiago'). La fecha se suele escribir en el nombre."),
        ciudad: z.string().min(2),
        pais: z.string().min(2),
        fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("YYYY-MM-DD"),
        fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("YYYY-MM-DD; en una sesión de un día, igual al inicio"),
        cupo: z.number().int().min(1).max(500),
        precio_usd: z.number().min(0).describe("Precio total en dólares"),
        sena_usd: z.number().positive().optional().describe("Seña en dólares; menor que el precio. Vacío = se paga completo"),
        categoria: z.enum(TRIP_CATEGORIES.map((c) => c.value) as [string, ...string[]]).optional().describe("mixto (por defecto), mujeres, hombres, avanzados"),
        descripcion: z.string().max(4000).optional().describe("Texto de la persona, tal cual; no lo inventes"),
      }),
      execute: async (a) => {
        const fd = new FormData();
        fd.set("type", a.tipo);
        fd.set("title", a.titulo ?? "");
        fd.set("city", a.ciudad);
        fd.set("country", a.pais);
        fd.set("start_date", a.fecha_inicio);
        fd.set("end_date", a.fecha_fin);
        fd.set("capacity", String(a.cupo));
        fd.set("price", String(a.precio_usd));
        if (a.sena_usd !== undefined) fd.set("deposit_amount", String(a.sena_usd));
        if (a.categoria) fd.set("category", a.categoria);
        if (a.descripcion) fd.set("description", a.descripcion);
        // Nunca se publica desde el asistente: abrir inscripciones es decision de una persona.
        fd.set("status", "draft");

        const logArgs = { tipo: a.tipo, ciudad: a.ciudad, inicio: a.fecha_inicio, fin: a.fecha_fin, cupo: a.cupo };
        const parsed = parseTripForm(fd);
        if (parsed.error) {
          await anotar(logArgs, 0, parsed.error, "crear_viaje");
          return { error: parsed.error };
        }

        const { data: repetidos } = await supabase
          .from("trips")
          .select("id, title")
          .eq("type", parsed.data.type)
          .eq("start_date", parsed.data.start_date)
          .eq("end_date", parsed.data.end_date)
          .eq("city", parsed.data.city);
        if (repetidos?.length) {
          const error = `Ya existe uno igual: "${repetidos[0].title}". No se creó otro.`;
          await anotar(logArgs, 0, error, "crear_viaje");
          return { error };
        }

        const { data, error } = await supabase
          .from("trips")
          .insert({ ...parsed.data, image_url: null })
          .select("id, title")
          .single();
        if (error) {
          await anotar(logArgs, 0, error.message, "crear_viaje");
          return { error: `No se pudo crear: ${error.message}` };
        }

        revalidatePath(TRIP_TYPES.retiro.adminPath);
        revalidatePath(TRIP_TYPES.ceremonia.adminPath);
        revalidatePath(publicPath("/viajes"), "page");
        revalidatePath(publicPath("/"), "page");
        await anotar({ ...logArgs, id: data.id }, 1, null, "crear_viaje");
        return {
          creado: true,
          id: data.id,
          titulo: data.title,
          estado: "borrador",
          editar_en: `/admin/experiencias/${data.id}/editar`,
        };
      },
    }),

    crear_articulo: tool({
      description:
        "Sube un artículo NUEVO a Contenidos (la biblioteca). Por defecto queda como BORRADOR; solo se publica si la persona lo pidió expresamente. Pide aprobación antes de crear. El texto del artículo lo pone la persona: usá EXACTAMENTE el texto que te dio o dictó (podés ordenarlo en párrafos y títulos), nunca escribas ni inventes el contenido de la organización. Antes, consultá listar_articulos para no duplicar. No carga imagen ni audio: eso se agrega después en el panel (Contenidos).",
      inputSchema: z.object({
        titulo: z.string().min(3).max(160),
        texto: z
          .string()
          .min(20)
          .max(30000)
          .describe(
            "Cuerpo en texto plano. Reglas: '## ' título, '### ' subtítulo, '- ' viñeta, '> ' cita, '**Título.** resto' párrafo con apertura en negrita. Sin HTML."
          ),
        categoria: z.enum(ARTICLE_CATEGORY_LIST.map((c) => c.value) as [string, ...string[]]),
        acceso: z
          .enum(CONTENT_ACCESS_LEVELS.map((l) => l.value) as [string, ...string[]])
          .optional()
          .describe("publico (cualquiera), miembros (con cuenta) o programa (solo habilitados). Por defecto publico"),
        extracto: z.string().max(400).optional().describe("Resumen corto, de la persona"),
        estado: z.enum(["draft", "published"]).optional().describe("draft por defecto; published solo si lo pidieron"),
      }),
      execute: async (a) => {
        const fd = new FormData();
        fd.set("title", a.titulo);
        fd.set("body", a.texto);
        fd.set("category", a.categoria);
        fd.set("access_level", a.acceso ?? "publico");
        fd.set("status", a.estado ?? "draft");
        if (a.extracto) fd.set("excerpt", a.extracto);

        const logArgs = { titulo: a.titulo, categoria: a.categoria, estado: a.estado ?? "draft", largo: a.texto.length };
        const parsed = await parseArticleForm(fd);
        if (!parsed.data || parsed.data.body === undefined) {
          const error = parsed.error ?? "Falta el texto.";
          await anotar(logArgs, 0, error, "crear_articulo");
          return { error };
        }

        const { data, error } = await supabase
          .from("articles")
          .insert({ ...parsed.data, body: parsed.data.body })
          .select("id, slug")
          .single();
        if (error) {
          const msg = error.message.includes("articles_slug_key")
            ? "Ya hay un contenido con esa dirección. Cambiá el título."
            : `No se pudo crear: ${error.message}`;
          await anotar(logArgs, 0, msg, "crear_articulo");
          return { error: msg };
        }

        revalidatePath(publicPath("/contenidos"), "page");
        revalidatePath(publicPath("/contenidos/[slug]"), "page");
        revalidatePath("/admin/contenidos");
        await anotar({ ...logArgs, id: data.id }, 1, null, "crear_articulo");
        return {
          creado: true,
          id: data.id,
          estado: a.estado === "published" ? "publicado" : "borrador",
          editar_en: `/admin/contenidos/${data.id}`,
        };
      },
    }),

    crear_testimonio: tool({
      description:
        "Carga un testimonio NUEVO como BORRADOR (no se muestra en el sitio hasta que alguien lo publique desde Testimonios). Pide aprobación. El texto es de la persona que lo dio: copialo tal cual, no lo reescribas ni lo inventes. La cita corta no puede pasar de 250 caracteres (es el largo de la tarjeta); un relato más largo va en 'relato'.",
      inputSchema: z.object({
        seccion: z.enum(["home", "sesiones", "viajes", "contenidos"]).describe("Dónde se muestra: home (Voces de Luz), sesiones, viajes o contenidos"),
        autor: z.string().min(2).max(120),
        lugar: z.string().max(120).optional().describe("Ciudad o país del autor"),
        cita: z.string().min(5).max(TESTIMONIAL_MAX_CHARS),
        relato: z.string().max(10000).optional().describe("Relato completo, si lo hay"),
      }),
      execute: async (a) => {
        const fd = new FormData();
        fd.set("placement", a.seccion);
        fd.set("author_name", a.autor);
        if (a.lugar) fd.set("author_location", a.lugar);
        fd.set("quote", a.cita);
        if (a.relato) fd.set("body", a.relato);
        // Sin `is_published`: queda como borrador. Publicar es decision de una persona.
        const logArgs = { seccion: a.seccion, autor: a.autor };
        const parsed = parseTestimonialForm(fd);
        if (parsed.error) {
          await anotar(logArgs, 0, parsed.error, "crear_testimonio");
          return { error: parsed.error };
        }
        const { data, error } = await supabase.from("testimonials").insert(parsed.data).select("id").single();
        if (error) {
          await anotar(logArgs, 0, error.message, "crear_testimonio");
          return { error: `No se pudo crear: ${error.message}` };
        }
        revalidatePath(publicPath("/"), "page");
        revalidatePath(publicPath("/viajes"), "page");
        revalidatePath("/admin/testimonios");
        await anotar({ ...logArgs, id: data.id }, 1, null, "crear_testimonio");
        return { creado: true, id: data.id, estado: "borrador", editar_en: `/admin/testimonios/${data.id}/editar` };
      },
    }),

    crear_articulos_desde_testimonios: tool({
      description:
        "Copia testimonios existentes a Contenidos como artículos en BORRADOR, categoría Testimonios. El servidor copia el texto COMPLETO (el relato si lo tiene, si no la cita) y arma el título ('Testimonio de <autor>'): NO necesitás leer ni reescribir el texto. Pasá los ids (de listar_testimonios), hasta 15 por vez. Si ya hay un artículo con ese título, lo saltea. Pide aprobación y muestra qué testimonios se copian. Después hay que publicarlos desde Contenidos.",
      inputSchema: z.object({
        ids: z.array(z.string().uuid()).min(1).max(15).describe("Ids de testimonios"),
        acceso: z
          .enum(CONTENT_ACCESS_LEVELS.map((l) => l.value) as [string, ...string[]])
          .optional()
          .describe("publico por defecto"),
      }),
      execute: async (a) => {
        const { data: testimonios, error: readError } = await supabase
          .from("testimonials")
          .select("id, author_name, author_location, quote, body")
          .in("id", a.ids);
        if (readError) return { error: readError.message };
        if (!testimonios?.length) return { error: "No encontré esos testimonios." };

        const { data: existentes } = await supabase.from("articles").select("title");
        const titulos = new Set((existentes ?? []).map((t) => t.title.trim().toLowerCase()));

        const creados: string[] = [];
        const salteados: string[] = [];
        const fallidos: string[] = [];

        for (const t of testimonios) {
          const titulo = `Testimonio de ${t.author_name.trim()}`;
          if (titulos.has(titulo.toLowerCase())) {
            salteados.push(`${t.author_name} (ya existe)`);
            continue;
          }
          const fd = new FormData();
          fd.set("title", titulo);
          fd.set("body", (t.body ?? t.quote).trim());
          fd.set("category", "testimonios");
          fd.set("access_level", a.acceso ?? "publico");
          fd.set("status", "draft");
          if (t.body) fd.set("excerpt", t.quote.trim().slice(0, 400));

          const parsed = await parseArticleForm(fd);
          if (!parsed.data || parsed.data.body === undefined) {
            fallidos.push(`${t.author_name}: ${parsed.error ?? "texto vacío"}`);
            continue;
          }
          const { error } = await supabase.from("articles").insert({ ...parsed.data, body: parsed.data.body });
          if (error) {
            fallidos.push(`${t.author_name}: ${error.message.includes("articles_slug_key") ? "ya hay uno con esa dirección" : error.message}`);
            continue;
          }
          titulos.add(titulo.toLowerCase());
          creados.push(t.author_name);
        }

        if (creados.length) {
          revalidatePath(publicPath("/contenidos"), "page");
          revalidatePath(publicPath("/contenidos/[slug]"), "page");
          revalidatePath("/admin/contenidos");
        }
        await anotar(
          { pedidos: a.ids.length, creados: creados.length, salteados: salteados.length, fallidos: fallidos.length },
          creados.length,
          fallidos.length ? fallidos.join(" | ").slice(0, 400) : null,
          "crear_articulos_desde_testimonios"
        );
        return { creados, salteados, fallidos, estado: "borrador", ver_en: "/admin/contenidos" };
      },
    }),
  };
}
