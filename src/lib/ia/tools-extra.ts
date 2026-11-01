import { tool } from "ai";
import { z } from "zod";
import { ARTICLE_CATEGORY_LIST, articleCategoryLabel } from "@/lib/article";
import { contentAccessLabel } from "@/lib/content-access";
import { includesLoose } from "./names";
import { MAX_ROWS, clip, leer, total, type Ctx } from "./tools";

/**
 * Mas herramientas de LECTURA: contenidos, preguntas frecuentes, testimonios,
 * correos programados, codigos de acceso, material, suscriptores y medios de
 * cobro. Misma regla que `tools.ts`: cliente de la sesion del admin, columnas
 * a mano, topes y registro en `ai_agent_log`.
 *
 * Lo que NO sale de aca, a proposito (el modelo es un tercero):
 * - el **valor** de los codigos de acceso y el **token** de los links de material
 *   (quien los vea puede usarlos);
 * - el **cuerpo** de los articulos y del HTML de material (largo y no hace falta);
 * - los **correos de los suscriptores** (solo el conteo);
 * - los **datos de cobro** (cuentas, links): solo nombre, moneda y si esta activo.
 */
export function buildExtraReadTools(ctx: Ctx) {
  const { supabase } = ctx;

  return {
    listar_articulos: tool({
      description:
        "Lista los contenidos de la biblioteca (artículos): título, categoría, nivel de acceso (público, miembros, programa), estado (borrador o publicado), fecha de publicación y un extracto. NO trae el cuerpo del texto. Sirve para '¿qué artículos hay de salud?', '¿qué está en borrador?' o para saber si un contenido ya existe antes de crear otro.",
      inputSchema: z.object({
        texto: z.string().optional().describe("Parte del título"),
        estado: z.enum(["draft", "published"]).optional().describe("draft = borrador, published = publicado"),
        categoria: z.enum(ARTICLE_CATEGORY_LIST.map((c) => c.value) as [string, ...string[]]).optional(),
      }),
      execute: (args) =>
        leer(ctx, "listar_articulos", args, async () => {
          let query = supabase
            .from("articles")
            .select("id, title, slug, category, access_level, status, published_at, updated_at, excerpt", { count: "exact" })
            .order("updated_at", { ascending: false })
            .limit(200);
          if (args.estado) query = query.eq("status", args.estado);
          if (args.categoria) query = query.eq("category", args.categoria as never);
          const { data, error, count } = await query;
          if (error) return { error: error.message };
          const rows = data
            .filter((a) => !args.texto || includesLoose(a.title, args.texto))
            .slice(0, MAX_ROWS)
            .map((a) => ({
              id: a.id,
              titulo: a.title,
              direccion: a.slug,
              categoria: articleCategoryLabel(a.category),
              acceso: contentAccessLabel(a.access_level),
              estado: a.status === "published" ? "publicado" : "borrador",
              publicado_el: a.published_at,
              extracto: clip(a.excerpt, 160),
            }));
          return { rows, extra: total(args.texto ? rows.length : count, rows.length) };
        }),
    }),

    listar_faqs: tool({
      description:
        "Lista las preguntas frecuentes del sitio con su grupo, si están publicadas y un recorte de la respuesta.",
      inputSchema: z.object({
        texto: z.string().optional().describe("Palabra a buscar en la pregunta o la respuesta"),
        solo_borradores: z.boolean().optional(),
      }),
      execute: (args) =>
        leer(ctx, "listar_faqs", args, async () => {
          let query = supabase
            .from("faqs")
            .select("id, question, answer, group_label, is_published, placement", { count: "exact" })
            .order("sort_order", { ascending: true })
            .limit(200);
          if (args.solo_borradores) query = query.eq("is_published", false);
          const { data, error } = await query;
          if (error) return { error: error.message };
          const rows = data
            .filter((f) => !args.texto || includesLoose(`${f.question} ${f.answer}`, args.texto))
            .slice(0, MAX_ROWS)
            .map((f) => ({
              id: f.id,
              pregunta: f.question,
              grupo: f.group_label,
              publicada: f.is_published,
              respuesta: clip(f.answer, 200),
            }));
          return { rows, extra: total(data.length, rows.length) };
        }),
    }),

    listar_testimonios: tool({
      description:
        "Lista los testimonios del sitio: sección donde se muestran, autor, lugar, si está publicado, el texto corto (la cita) y si tiene relato completo (y de cuántos caracteres). Para leer el relato completo de uno usá ver_testimonio.",
      inputSchema: z.object({ solo_borradores: z.boolean().optional() }),
      execute: (args) =>
        leer(ctx, "listar_testimonios", args, async () => {
          let query = supabase
            .from("testimonials")
            .select("id, author_name, author_location, quote, body, is_published, placement", { count: "exact" })
            .order("sort_order", { ascending: true })
            .limit(MAX_ROWS * 2);
          if (args.solo_borradores) query = query.eq("is_published", false);
          const { data, error, count } = await query;
          if (error) return { error: error.message };
          return {
            rows: data.map((t) => ({
              id: t.id,
              seccion: t.placement,
              autor: t.author_name,
              lugar: t.author_location,
              publicado: t.is_published,
              cita: clip(t.quote, 300),
              tiene_relato_completo: Boolean(t.body),
              largo_relato: t.body?.length ?? 0,
            })),
            extra: total(count, data.length),
          };
        }),
    }),

    ver_testimonio: tool({
      description:
        "Devuelve el texto COMPLETO de un testimonio (la cita y el relato completo si lo tiene), con su autor. Usala solo cuando haga falta leerlo entero; para copiar testimonios a artículos usá crear_articulos_desde_testimonios, que no necesita que leas el texto.",
      inputSchema: z.object({ id: z.string().uuid().describe("Id sacado de listar_testimonios") }),
      execute: (args) =>
        leer(ctx, "ver_testimonio", args, async () => {
          const { data, error } = await supabase
            .from("testimonials")
            .select("id, author_name, author_location, quote, body, placement, is_published")
            .eq("id", args.id)
            .maybeSingle();
          if (error) return { error: error.message };
          if (!data) return { rows: [] };
          return { rows: [{ ...data, body: data.body ? data.body.slice(0, 8000) : null }] };
        }),
    }),

    listar_correos: tool({
      description:
        "Lista los correos programados que el sistema mandó (o intentó mandar) a participantes: tipo, a quién (nombre) y a qué evento, si salió bien y cuándo. Sirve para '¿se mandó el correo de bienvenida a X?' o '¿qué correos fallaron?'. NO trae el contenido ni la dirección del destinatario.",
      inputSchema: z.object({
        solo_fallidos: z.boolean().optional().describe("true para ver solo los que no se pudieron enviar"),
        nombre: z.string().optional().describe("Parte del nombre de la persona"),
      }),
      execute: (args) =>
        leer(ctx, "listar_correos", args, async () => {
          let query = supabase
            .from("scheduled_email_log")
            .select("id, kind, ok, error, sent_at, application:applications(full_name, trip:trips(title))", { count: "exact" })
            .order("sent_at", { ascending: false })
            .limit(args.nombre ? 300 : MAX_ROWS);
          if (args.solo_fallidos) query = query.eq("ok", false);
          const { data, error, count } = await query;
          if (error) return { error: error.message };
          const rows = data
            .filter((l) => !args.nombre || includesLoose(l.application?.full_name ?? "", args.nombre))
            .slice(0, MAX_ROWS)
            .map((l) => ({
              tipo: l.kind,
              persona: l.application?.full_name ?? null,
              evento: l.application?.trip?.title ?? null,
              salio_bien: l.ok,
              error: clip(l.error, 160),
              fecha: l.sent_at,
            }));
          return { rows, extra: total(args.nombre ? rows.length : count, rows.length) };
        }),
    }),

    listar_codigos_acceso: tool({
      description:
        "Lista los códigos de acceso a contenidos: para qué sirven (etiqueta), nivel, evento, si están activos, vencimiento y cuántas veces se usaron de cuántas posibles. NO devuelve el código en sí.",
      inputSchema: z.object({ solo_activos: z.boolean().optional() }),
      execute: (args) =>
        leer(ctx, "listar_codigos_acceso", args, async () => {
          let query = supabase
            .from("access_codes")
            .select("id, label, level, is_active, expires_at, max_uses, trip:trips(title)")
            .order("created_at", { ascending: false })
            .limit(MAX_ROWS);
          if (args.solo_activos) query = query.eq("is_active", true);
          const { data, error } = await query;
          if (error) return { error: error.message };

          const { data: grants } = await supabase
            .from("content_grants")
            .select("access_code_id")
            .not("access_code_id", "is", null);
          const usos = new Map<string, number>();
          for (const g of grants ?? []) if (g.access_code_id) usos.set(g.access_code_id, (usos.get(g.access_code_id) ?? 0) + 1);

          return {
            rows: data.map((c) => ({
              etiqueta: c.label,
              nivel: contentAccessLabel(c.level),
              evento: c.trip?.title ?? null,
              activo: c.is_active,
              vence: c.expires_at,
              usos: usos.get(c.id) ?? 0,
              usos_maximos: c.max_uses,
            })),
          };
        }),
    }),

    listar_materiales: tool({
      description:
        "Lista los documentos de 'Envío material': título, fecha y si tienen link para compartir. NO devuelve el link ni el contenido.",
      inputSchema: z.object({}),
      execute: (args) =>
        leer(ctx, "listar_materiales", args, async () => {
          const { data, error } = await supabase
            .from("materiales")
            .select("id, title, created_at, share_token")
            .order("created_at", { ascending: false })
            .limit(MAX_ROWS);
          if (error) return { error: error.message };
          return {
            rows: data.map((m) => ({ id: m.id, titulo: m.title, creado: m.created_at, tiene_link: Boolean(m.share_token) })),
          };
        }),
    }),

    contar_suscriptores: tool({
      description:
        "Cuántas personas se suscribieron al boletín desde el pie de la página, y cuántas en los últimos 7 y 30 días. Solo cifras: no trae los correos.",
      inputSchema: z.object({}),
      execute: (args) =>
        leer(ctx, "contar_suscriptores", args, async () => {
          const desde = (dias: number) => new Date(Date.now() - dias * 86_400_000).toISOString();
          const [todos, semana, mes] = await Promise.all([
            supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
            supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).gte("created_at", desde(7)),
            supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).gte("created_at", desde(30)),
          ]);
          const error = todos.error ?? semana.error ?? mes.error;
          if (error) return { error: error.message };
          return {
            rows: [{ total: todos.count ?? 0, ultimos_7_dias: semana.count ?? 0, ultimos_30_dias: mes.count ?? 0 }],
          };
        }),
    }),

    listar_medios_cobro: tool({
      description:
        "Lista los medios de cobro cargados en Pagos: nombre, moneda, a quién va dirigido y si está activo. NO trae cuentas, alias ni links de pago.",
      inputSchema: z.object({}),
      execute: (args) =>
        leer(ctx, "listar_medios_cobro", args, async () => {
          const { data, error } = await supabase
            .from("payment_methods")
            .select("label, currency, audience, is_active")
            .order("sort_order", { ascending: true })
            .limit(MAX_ROWS);
          if (error) return { error: error.message };
          return {
            rows: data.map((m) => ({ nombre: m.label, moneda: m.currency, para: m.audience, activo: m.is_active })),
          };
        }),
    }),
  };
}
