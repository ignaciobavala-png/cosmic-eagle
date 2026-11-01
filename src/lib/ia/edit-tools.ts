import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { tool } from "ai";
import { z } from "zod";
import { publicPath } from "@/i18n/public-path";
import { TRIP_TYPES } from "@/lib/trip-type";
import { TRIP_CATEGORIES } from "@/lib/trip-fields";
import { ARTICLE_CATEGORY_LIST } from "@/lib/article";
import { CONTENT_ACCESS_LEVELS } from "@/lib/content-access";
import { FAQ_PLACEMENTS } from "@/lib/faqs";
import { TESTIMONIAL_MAX_CHARS } from "@/lib/testimonials";
import { SITE_CONTENT_TAG, SITE_GROUPS, SITE_SLOTS } from "@/lib/site-content";
import type { createClient } from "@/lib/supabase/server";

/**
 * EDICION y PUBLICACION desde el asistente. Sin borrar: ningun delete existe aca.
 *
 * Reglas que sostienen esto:
 * - **Todo pide aprobacion**, y la tarjeta muestra el antes -> despues calculado
 *   EN EL SERVIDOR (`vistaPrevia`), leyendo el valor actual de la base: no lo que
 *   el modelo diga que va a cambiar.
 * - **Solo cambia lo que se pide**: cada herramienta actualiza unicamente los
 *   campos recibidos, asi no se pisa nada que el modelo no vio (programa,
 *   galeria, habitaciones, versiones en ingles…).
 * - **Publicar es un campo mas** (`estado`, `publicado`): la tarjeta lo marca
 *   como "SE PUBLICA" o "SE OCULTA" arriba de todo.
 * - Se editan los campos de texto y de datos; las **imagenes, el audio y los
 *   legales** (copia literal de la clienta) siguen siendo del panel.
 * - Cada cambio queda en `ai_agent_log` con lo que cambio.
 */
type Supabase = Awaited<ReturnType<typeof createClient>>;
type Ctx = { supabase: Supabase; userId: string; conversationId: string | null };

/** Escrituras por persona y por dia (Buenos Aires): corta un bucle del modelo. */
const MAX_ESCRITURAS_DIA = 60;

const TRIP_STATUS = ["draft", "open", "closed", "completed"] as const;
const TRIP_STATUS_LABEL: Record<string, string> = {
  draft: "borrador",
  open: "abierto a inscripción",
  closed: "cerrado",
  completed: "realizado",
};

function hoyAR() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
}

async function anotar(ctx: Ctx, toolName: string, args: Record<string, unknown>, rows: number, error: string | null) {
  const { error: logError } = await ctx.supabase.from("ai_agent_log").insert({
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

async function topeAlcanzado(ctx: Ctx): Promise<string | null> {
  const { count } = await ctx.supabase
    .from("ai_agent_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.userId)
    .eq("kind", "write")
    .gte("created_at", `${hoyAR()}T00:00:00-03:00`);
  return (count ?? 0) >= MAX_ESCRITURAS_DIA ? "Llegaste al tope de cambios del asistente por hoy." : null;
}

// ---------- vista previa ----------

type Valor = string | number | boolean | null | undefined;

const corto = (v: Valor, max = 90) => {
  if (v === null || v === undefined || v === "") return "(vacío)";
  const t = String(v).replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
};

/** "Campo: antes → después" solo para lo que de verdad cambia. */
function lineasDeCambios(
  actual: Record<string, Valor>,
  nuevos: Record<string, Valor>,
  etiquetas: Record<string, string>
): string[] {
  const lineas: string[] = [];
  for (const [col, nuevo] of Object.entries(nuevos)) {
    if (nuevo === undefined) continue;
    const antes = actual[col];
    if ((antes ?? null) === (nuevo ?? null)) continue;
    const largo = typeof nuevo === "string" && nuevo.length > 90;
    lineas.push(
      largo
        ? `${etiquetas[col] ?? col}: texto de ${String(antes ?? "").length} → ${nuevo.length} caracteres. Empieza: "${corto(nuevo, 70)}"`
        : `${etiquetas[col] ?? col}: ${corto(antes)} → ${corto(nuevo)}`
    );
  }
  return lineas;
}

type Previa = { type: "user-approval"; reason: string } | { type: "denied"; reason: string };

const noEncontrado = (que: string): Previa => ({ type: "denied", reason: `No encontré ${que}.` });
const sinCambios: Previa = { type: "denied", reason: "No hay nada para cambiar: los valores ya son esos." };

function aprobar(encabezado: string | null, titulo: string, lineas: string[]): Previa {
  if (!lineas.length) return sinCambios;
  return {
    type: "user-approval",
    reason: [encabezado, `Sobre: ${titulo}`, ...lineas].filter(Boolean).join("\n"),
  };
}

// ---------- columnas editables ----------

const TRIP_LABELS = {
  title: "Nombre",
  description: "Descripción",
  city: "Ciudad",
  country: "País",
  start_date: "Inicio",
  end_date: "Fin",
  capacity: "Cupo",
  price: "Precio (USD)",
  deposit_amount: "Seña (USD)",
  category: "Categoría",
  status: "Estado",
  includes: "Qué incluye",
  arrival_notes: "Cómo llegar",
  packing_list: "Qué llevar",
  address: "Dirección",
} as const;

function tripCambios(a: {
  titulo?: string;
  descripcion?: string;
  ciudad?: string;
  pais?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  cupo?: number;
  precio_usd?: number;
  sena_usd?: number | null;
  categoria?: string;
  estado?: string;
  incluye?: string;
  notas_llegada?: string;
  que_llevar?: string;
  direccion?: string;
}): Record<string, Valor> {
  return {
    title: a.titulo?.trim(),
    description: a.descripcion?.trim(),
    city: a.ciudad?.trim(),
    country: a.pais?.trim(),
    start_date: a.fecha_inicio,
    end_date: a.fecha_fin,
    capacity: a.cupo,
    price: a.precio_usd,
    deposit_amount: a.sena_usd,
    category: a.categoria,
    status: a.estado,
    includes: a.incluye?.trim(),
    arrival_notes: a.notas_llegada?.trim(),
    packing_list: a.que_llevar?.trim(),
    address: a.direccion?.trim(),
  };
}

const ARTICLE_LABELS = {
  title: "Título",
  body: "Texto",
  excerpt: "Extracto",
  category: "Categoría",
  access_level: "Acceso",
  status: "Estado",
} as const;

const TESTIMONIAL_LABELS = {
  quote: "Cita",
  body: "Relato",
  author_name: "Autor",
  author_location: "Lugar",
  placement: "Sección",
  is_published: "Publicado",
} as const;

const FAQ_LABELS = { question: "Pregunta", answer: "Respuesta", placement: "Bloque", is_published: "Publicada" } as const;

/** Linea de arriba de todo cuando el cambio publica u oculta algo. */
function avisoPublicacion(antes: Valor, despues: Valor, visible: (v: Valor) => boolean): string | null {
  if (despues === undefined) return null;
  const a = visible(antes);
  const d = visible(despues);
  if (!a && d) return "⚠ SE PUBLICA: va a verse en el sitio.";
  if (a && !d) return "Se OCULTA del sitio.";
  return null;
}

// ---------- herramientas ----------

export function buildEditTools(ctx: Ctx) {
  const { supabase } = ctx;

  return {
    editar_viaje: tool({
      description:
        "Cambia datos de un retiro o sesión que YA EXISTE: nombre, descripción, ciudad, país, fechas, cupo, precio, seña, categoría, qué incluye, cómo llegar, qué llevar, dirección y ESTADO. Con estado='open' lo PUBLICA (abre inscripciones y se ve en el sitio); 'closed' cierra inscripciones; 'completed' lo marca realizado; 'draft' lo vuelve borrador. Mandá SOLO los campos que cambian. Pide aprobación y muestra el antes → después. No borra, no toca portada, galería, programa ni habitaciones (eso es del panel). Conseguí el id con listar_viajes. Los datos que la persona no dio, preguntalos.",
      inputSchema: z.object({
        id: z.string().uuid().describe("Id de listar_viajes"),
        titulo: z.string().min(2).max(120).optional(),
        descripcion: z.string().max(4000).optional().describe("Texto de la persona, tal cual"),
        ciudad: z.string().min(2).optional(),
        pais: z.string().min(2).optional(),
        fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        cupo: z.number().int().min(1).max(500).optional(),
        precio_usd: z.number().min(0).optional(),
        sena_usd: z.number().positive().nullable().optional().describe("null = sacar la seña (se paga completo)"),
        categoria: z.enum(TRIP_CATEGORIES.map((c) => c.value) as [string, ...string[]]).optional(),
        estado: z.enum(TRIP_STATUS).optional().describe("open = publicar/abrir inscripciones"),
        incluye: z.string().max(4000).optional(),
        notas_llegada: z.string().max(4000).optional(),
        que_llevar: z.string().max(4000).optional(),
        direccion: z.string().max(300).optional(),
      }),
      execute: async ({ id, ...a }) => {
        const nuevos = tripCambios(a);
        const logArgs = { id, campos: Object.keys(nuevos).filter((k) => nuevos[k] !== undefined) };
        const tope = await topeAlcanzado(ctx);
        if (tope) return { error: tope };

        const { data: actual, error: readError } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
        if (readError || !actual) return { error: readError?.message ?? "No encontré ese viaje." };

        // Reglas del panel, sobre los valores YA combinados.
        const start = (nuevos.start_date as string | undefined) ?? actual.start_date;
        const end = (nuevos.end_date as string | undefined) ?? actual.end_date;
        const price = (nuevos.price as number | undefined) ?? Number(actual.price);
        const deposit = nuevos.deposit_amount === undefined ? actual.deposit_amount : (nuevos.deposit_amount as number | null);
        const fail = async (error: string) => {
          await anotar(ctx, "editar_viaje", logArgs, 0, error);
          return { error };
        };
        if (end < start) return fail("La fecha de fin no puede ser anterior a la de inicio.");
        if (deposit !== null && deposit !== undefined && !(deposit > 0 && deposit < price)) {
          return fail("La seña tiene que ser mayor que cero y menor que el precio total.");
        }
        if (typeof nuevos.capacity === "number") {
          const { count } = await supabase
            .from("applications")
            .select("id", { count: "exact", head: true })
            .eq("trip_id", id)
            .eq("status", "approved");
          if ((count ?? 0) > nuevos.capacity) return fail(`Ya hay ${count} reservas aprobadas: el cupo no puede ser menor.`);
        }

        const cambios = Object.fromEntries(Object.entries(nuevos).filter(([, v]) => v !== undefined));
        if (!Object.keys(cambios).length) return fail("No indicaste nada para cambiar.");

        const { error } = await supabase.from("trips").update(cambios as never).eq("id", id);
        if (error) return fail(`No se pudo guardar: ${error.message}`);

        revalidatePath(TRIP_TYPES.retiro.adminPath);
        revalidatePath(TRIP_TYPES.ceremonia.adminPath);
        revalidatePath(publicPath("/viajes"), "page");
        revalidatePath(publicPath("/viajes/[id]"), "page");
        revalidatePath(publicPath("/"), "page");
        await anotar(ctx, "editar_viaje", logArgs, 1, null);
        return {
          actualizado: true,
          id,
          estado: TRIP_STATUS_LABEL[(cambios.status as string) ?? actual.status],
          nota: "Las versiones en inglés no se tocaron.",
          editar_en: `/admin/experiencias/${id}/editar`,
        };
      },
    }),

    editar_articulo: tool({
      description:
        "Cambia un artículo de Contenidos que YA EXISTE: título, texto, extracto, categoría, nivel de acceso y ESTADO. Con estado='published' lo PUBLICA (se ve en la biblioteca); 'draft' lo vuelve borrador. Mandá SOLO lo que cambia. Pide aprobación y muestra el antes → después. El texto nuevo lo pone la persona: usá exactamente lo que te dio, nunca lo inventes. No edita artículos que son un HTML subido, ni imagen ni audio, ni la dirección (slug). No borra. Conseguí el id con listar_articulos.",
      inputSchema: z.object({
        id: z.string().uuid().describe("Id de listar_articulos"),
        titulo: z.string().min(3).max(160).optional(),
        texto: z.string().min(20).max(30000).optional().describe("Reglas: '## ' título, '### ' subtítulo, '- ' viñeta, '> ' cita. Sin HTML."),
        extracto: z.string().max(400).optional(),
        categoria: z.enum(ARTICLE_CATEGORY_LIST.map((c) => c.value) as [string, ...string[]]).optional(),
        acceso: z.enum(CONTENT_ACCESS_LEVELS.map((l) => l.value) as [string, ...string[]]).optional(),
        estado: z.enum(["draft", "published"]).optional().describe("published = publicar"),
      }),
      execute: async ({ id, ...a }) => {
        const nuevos: Record<string, Valor> = {
          title: a.titulo?.trim(),
          body: a.texto?.trim(),
          excerpt: a.extracto?.trim(),
          category: a.categoria,
          access_level: a.acceso,
          status: a.estado,
        };
        const logArgs = { id, campos: Object.keys(nuevos).filter((k) => nuevos[k] !== undefined) };
        const fail = async (error: string) => {
          await anotar(ctx, "editar_articulo", logArgs, 0, error);
          return { error };
        };
        const tope = await topeAlcanzado(ctx);
        if (tope) return { error: tope };

        const { data: actual, error: readError } = await supabase
          .from("articles")
          .select("id, body_format")
          .eq("id", id)
          .maybeSingle();
        if (readError || !actual) return { error: readError?.message ?? "No encontré ese artículo." };
        if (nuevos.body !== undefined && actual.body_format === "html") {
          return fail("Este contenido es un HTML subido: el texto se cambia subiendo otro archivo desde Contenidos.");
        }

        const cambios = Object.fromEntries(Object.entries(nuevos).filter(([, v]) => v !== undefined));
        if (!Object.keys(cambios).length) return fail("No indicaste nada para cambiar.");

        const { error } = await supabase.from("articles").update(cambios as never).eq("id", id);
        if (error) return fail(`No se pudo guardar: ${error.message}`);

        revalidatePath(publicPath("/contenidos"), "page");
        revalidatePath(publicPath("/contenidos/[slug]"), "page");
        revalidatePath("/admin/contenidos");
        await anotar(ctx, "editar_articulo", logArgs, 1, null);
        return {
          actualizado: true,
          id,
          estado: (cambios.status as string | undefined) === "published" ? "publicado" : undefined,
          nota: "La versión en inglés no se tocó.",
          editar_en: `/admin/contenidos/${id}`,
        };
      },
    }),

    editar_testimonio: tool({
      description:
        "Cambia un testimonio que YA EXISTE: cita, relato, autor, lugar, sección y si está PUBLICADO. Con publicado=true lo PUBLICA (se ve en el sitio). Mandá SOLO lo que cambia. El texto es de quien lo dio: copialo tal cual. La cita no puede pasar de 250 caracteres. Pide aprobación y muestra el antes → después. No borra. Conseguí el id con listar_testimonios.",
      inputSchema: z.object({
        id: z.string().uuid(),
        cita: z.string().min(5).max(TESTIMONIAL_MAX_CHARS).optional(),
        relato: z.string().max(10000).optional(),
        autor: z.string().min(2).max(120).optional(),
        lugar: z.string().max(120).optional(),
        seccion: z.enum(["home", "sesiones", "viajes", "contenidos"]).optional(),
        publicado: z.boolean().optional().describe("true = publicar, false = ocultar"),
      }),
      execute: async ({ id, ...a }) => {
        const nuevos: Record<string, Valor> = {
          quote: a.cita?.trim(),
          body: a.relato?.trim(),
          author_name: a.autor?.trim(),
          author_location: a.lugar?.trim(),
          placement: a.seccion,
          is_published: a.publicado,
        };
        const logArgs = { id, campos: Object.keys(nuevos).filter((k) => nuevos[k] !== undefined) };
        const cambios = Object.fromEntries(Object.entries(nuevos).filter(([, v]) => v !== undefined));
        const tope = await topeAlcanzado(ctx);
        if (tope) return { error: tope };
        if (!Object.keys(cambios).length) {
          await anotar(ctx, "editar_testimonio", logArgs, 0, "sin cambios");
          return { error: "No indicaste nada para cambiar." };
        }

        const { data: existe } = await supabase.from("testimonials").select("id").eq("id", id).maybeSingle();
        if (!existe) return { error: "No encontré ese testimonio." };

        const { error } = await supabase.from("testimonials").update(cambios as never).eq("id", id);
        if (error) {
          await anotar(ctx, "editar_testimonio", logArgs, 0, error.message);
          return { error: `No se pudo guardar: ${error.message}` };
        }
        revalidatePath(publicPath("/"), "page");
        revalidatePath(publicPath("/viajes"), "page");
        revalidatePath("/admin/testimonios");
        await anotar(ctx, "editar_testimonio", logArgs, 1, null);
        return { actualizado: true, id, nota: "La versión en inglés no se tocó.", editar_en: `/admin/testimonios/${id}/editar` };
      },
    }),

    editar_faq: tool({
      description:
        "Cambia una pregunta frecuente que YA EXISTE: pregunta, respuesta, bloque y si está PUBLICADA. Con publicada=true la PUBLICA. Mandá SOLO lo que cambia. El texto es de la organización: usá exactamente lo que te dio la persona. Pide aprobación y muestra el antes → después. No borra. Conseguí el id con listar_faqs.",
      inputSchema: z.object({
        id: z.string().uuid(),
        pregunta: z.string().min(3).max(300).optional(),
        respuesta: z.string().min(3).max(4000).optional(),
        bloque: z.enum(FAQ_PLACEMENTS.map((p) => p.value) as [string, ...string[]]).optional(),
        publicada: z.boolean().optional(),
      }),
      execute: async ({ id, ...a }) => {
        const nuevos: Record<string, Valor> = {
          question: a.pregunta?.trim(),
          answer: a.respuesta?.trim(),
          placement: a.bloque,
          is_published: a.publicada,
        };
        const logArgs = { id, campos: Object.keys(nuevos).filter((k) => nuevos[k] !== undefined) };
        const cambios = Object.fromEntries(Object.entries(nuevos).filter(([, v]) => v !== undefined));
        const tope = await topeAlcanzado(ctx);
        if (tope) return { error: tope };
        if (!Object.keys(cambios).length) {
          await anotar(ctx, "editar_faq", logArgs, 0, "sin cambios");
          return { error: "No indicaste nada para cambiar." };
        }
        const { data: existe } = await supabase.from("faqs").select("id").eq("id", id).maybeSingle();
        if (!existe) return { error: "No encontré esa pregunta." };

        const { error } = await supabase.from("faqs").update(cambios as never).eq("id", id);
        if (error) {
          await anotar(ctx, "editar_faq", logArgs, 0, error.message);
          return { error: `No se pudo guardar: ${error.message}` };
        }
        revalidatePath(publicPath("/faqs"), "page");
        revalidatePath("/admin/faqs");
        await anotar(ctx, "editar_faq", logArgs, 1, null);
        return { actualizado: true, id, nota: "La versión en inglés no se tocó.", editar_en: `/admin/faqs/${id}` };
      },
    }),

    cambiar_texto_sitio: tool({
      description:
        "Cambia un texto de las páginas públicas del sitio (los que se editan en Multimedia). La clave sale de listar_textos_sitio: buscala ahí primero. El texto nuevo lo pone la persona: exactamente como lo dijo, sin reescribirlo. Solo castellano. Se ve en el sitio al instante. Pide aprobación y muestra el antes → después. No cambia imágenes ni videos.",
      inputSchema: z.object({
        clave: z.string().min(3).describe("Clave exacta, de listar_textos_sitio"),
        valor: z.string().min(1).max(4000),
      }),
      execute: async ({ clave, valor }) => {
        const slot = SITE_SLOTS.find((s) => s.key === clave);
        const logArgs = { clave };
        if (!slot || (slot.type !== "text" && slot.type !== "multiline")) {
          return { error: "Esa clave no existe o no es un texto editable. Buscala con listar_textos_sitio." };
        }
        const tope = await topeAlcanzado(ctx);
        if (tope) return { error: tope };

        const nuevo = valor.trim();
        if (!nuevo) return { error: "El texto no puede quedar vacío." };

        const { data: previa } = await supabase.from("site_content").select("value").eq("key", clave).maybeSingle();
        // Sin upsert: el grant de columna deja actualizar solo `value`.
        const { error } = previa
          ? await supabase.from("site_content").update({ value: nuevo }).eq("key", clave)
          : await supabase.from("site_content").insert({ key: clave, value: nuevo });
        if (error) {
          await anotar(ctx, "cambiar_texto_sitio", logArgs, 0, error.message);
          return { error: `No se pudo guardar: ${error.message}` };
        }

        // Route Handler: `updateTag` solo existe en Server Actions. `expire: 0`
        // vence el cache al instante, como el panel (la clienta mira enseguida).
        revalidateTag(SITE_CONTENT_TAG, { expire: 0 });
        const grupo = SITE_GROUPS.find((g) => g.slots.some((s) => s.key === clave));
        if (grupo) revalidatePath(publicPath(grupo.href), "page");
        await anotar(ctx, "cambiar_texto_sitio", logArgs, 1, null);
        return { actualizado: true, clave, nota: "La versión en inglés no se tocó." };
      },
    }),
  };
}

// ---------- aprobacion con vista previa ----------

/**
 * `toolApproval` de las herramientas de edicion: lee el valor ACTUAL y arma el
 * "antes → despues" que ve quien aprueba. Si el objeto no existe o no hay nada
 * que cambiar, deniega sin molestar a la persona.
 */
export function buildEditApprovals(ctx: Ctx) {
  const { supabase } = ctx;

  return {
    editar_viaje: async (a: Parameters<typeof tripCambios>[0] & { id: string }): Promise<Previa> => {
      const { data } = await supabase.from("trips").select("*").eq("id", a.id).maybeSingle();
      if (!data) return noEncontrado("ese viaje");
      const nuevos = tripCambios(a);
      return aprobar(
        avisoPublicacion(data.status, nuevos.status, (v) => v === "open"),
        data.title,
        lineasDeCambios(data as never, nuevos, { ...TRIP_LABELS, status: "Estado" }).map((l) =>
          l.startsWith("Estado:") ? l.replace(/(draft|open|closed|completed)/g, (m) => TRIP_STATUS_LABEL[m]) : l
        )
      );
    },

    editar_articulo: async (a: {
      id: string;
      titulo?: string;
      texto?: string;
      extracto?: string;
      categoria?: string;
      acceso?: string;
      estado?: string;
    }): Promise<Previa> => {
      const { data } = await supabase.from("articles").select("title, body, excerpt, category, access_level, status").eq("id", a.id).maybeSingle();
      if (!data) return noEncontrado("ese artículo");
      const nuevos: Record<string, Valor> = {
        title: a.titulo?.trim(),
        body: a.texto?.trim(),
        excerpt: a.extracto?.trim(),
        category: a.categoria,
        access_level: a.acceso,
        status: a.estado,
      };
      return aprobar(
        avisoPublicacion(data.status, nuevos.status, (v) => v === "published"),
        data.title,
        lineasDeCambios(data as never, nuevos, ARTICLE_LABELS)
      );
    },

    editar_testimonio: async (a: {
      id: string;
      cita?: string;
      relato?: string;
      autor?: string;
      lugar?: string;
      seccion?: string;
      publicado?: boolean;
    }): Promise<Previa> => {
      const { data } = await supabase.from("testimonials").select("*").eq("id", a.id).maybeSingle();
      if (!data) return noEncontrado("ese testimonio");
      const nuevos: Record<string, Valor> = {
        quote: a.cita?.trim(),
        body: a.relato?.trim(),
        author_name: a.autor?.trim(),
        author_location: a.lugar?.trim(),
        placement: a.seccion,
        is_published: a.publicado,
      };
      return aprobar(
        avisoPublicacion(data.is_published, nuevos.is_published, (v) => v === true),
        data.author_name,
        lineasDeCambios(data as never, nuevos, TESTIMONIAL_LABELS)
      );
    },

    editar_faq: async (a: { id: string; pregunta?: string; respuesta?: string; bloque?: string; publicada?: boolean }): Promise<Previa> => {
      const { data } = await supabase.from("faqs").select("*").eq("id", a.id).maybeSingle();
      if (!data) return noEncontrado("esa pregunta");
      const nuevos: Record<string, Valor> = {
        question: a.pregunta?.trim(),
        answer: a.respuesta?.trim(),
        placement: a.bloque,
        is_published: a.publicada,
      };
      return aprobar(
        avisoPublicacion(data.is_published, nuevos.is_published, (v) => v === true),
        data.question,
        lineasDeCambios(data as never, nuevos, FAQ_LABELS)
      );
    },

    cambiar_texto_sitio: async (a: { clave: string; valor: string }): Promise<Previa> => {
      const slot = SITE_SLOTS.find((s) => s.key === a.clave);
      if (!slot || (slot.type !== "text" && slot.type !== "multiline")) return noEncontrado("ese texto del sitio");
      const { data } = await supabase.from("site_content").select("value").eq("key", a.clave).maybeSingle();
      const antes = data?.value ?? slot.fallback;
      const grupo = SITE_GROUPS.find((g) => g.slots.some((s) => s.key === a.clave));
      return aprobar(
        "Se ve en el sitio al instante.",
        `${slot.label}${grupo ? ` (${grupo.title})` : ""}`,
        lineasDeCambios({ texto: antes }, { texto: a.valor.trim() }, { texto: "Texto" })
      );
    },
  };
}
