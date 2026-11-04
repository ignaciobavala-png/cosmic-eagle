import "server-only";
import { revalidatePath } from "next/cache";
import { tool } from "ai";
import { z } from "zod";
import { publicPath } from "@/i18n/public-path";
import { ARTICLE_CATEGORY_LIST, articleCategoryLabel } from "@/lib/article";
import { contentAccessLabel, type ContentAccessLevel } from "@/lib/content-access";
import { matchNames } from "./names";
import { anotar, aprobar, noEncontrado, topeAlcanzado, type Previa } from "./edit-tools";
import { MAX_ROWS, leer, type Ctx } from "./tools";

/**
 * ACCESO: que ve cada categoria de usuario y a quien se habilita. Son las mismas
 * tres palancas de `/admin/acceso` y `/admin/contenidos`:
 *
 * 1. el **nivel de cada contenido** (`articles.access_level`: abierto, con cuenta,
 *    del programa);
 * 2. las **habilitaciones** (`content_grants`): quien ve lo "del programa", por
 *    persona o por evento;
 * 3. los **codigos** (`access_codes`) que canjea quien no paso por la plataforma.
 *
 * Reglas que sostienen esto (no "simplificar"):
 * - **Todo pide aprobacion** y la tarjeta la arma el SERVIDOR leyendo la base:
 *   quien aprueba ve los nombres y titulos reales afectados, no lo que diga el
 *   modelo. Lo que ABRE contenido (lo hace visible a mas gente) se marca arriba.
 * - **Corre con la sesion del admin**: la RLS es la del panel. El asistente no
 *   puede mas que quien le habla.
 * - **Nunca toca roles.** Ni `profiles.is_admin` ni nada que haga admin a alguien:
 *   el acceso a la biblioteca y el poder de administrar son cosas distintas.
 * - **Sin borrar.** Quitar un acceso es marcar `revoked_at` (queda el rastro de
 *   quien lo dio y cuando), igual que el boton del panel.
 * - Los **valores de los codigos** no salen en ninguna lectura ni en el log.
 * - Cada cambio cuenta para el tope diario de escrituras y queda en `ai_agent_log`.
 */
const RANK: Record<ContentAccessLevel, number> = { publico: 0, miembros: 1, programa: 2 };
const NIVELES = ["publico", "miembros", "programa"] as const;
const MAX_CONTENIDOS = 40;
const MAX_PERSONAS = 100;
const MOSTRAR_NOMBRES = 30;

type Grant = {
  id: string;
  user_id: string;
  level: ContentAccessLevel;
  note: string | null;
  granted_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  access_code_id: string | null;
  application_id: string | null;
};

const vigente = (g: Pick<Grant, "revoked_at" | "expires_at">) =>
  !g.revoked_at && (!g.expires_at || g.expires_at > new Date().toISOString());

const origen = (g: Pick<Grant, "access_code_id" | "application_id">) =>
  g.access_code_id ? "código" : g.application_id ? "solicitud aprobada" : "manual";

/** Quien ve el contenido segun su nivel, en palabras de la organizacion. */
const QUIEN: Record<ContentAccessLevel, string> = {
  publico: "cualquiera, con o sin cuenta",
  miembros: "cualquier persona registrada",
  programa: "solo quien está habilitada",
};

function nivelEfectivo(esAdmin: boolean, grants: Grant[]): ContentAccessLevel {
  if (esAdmin) return "programa";
  return grants.some((g) => vigente(g) && g.level === "programa") ? "programa" : "miembros";
}

function revalidarAcceso() {
  revalidatePath(publicPath("/contenidos"), "page");
  revalidatePath(publicPath("/contenidos/[slug]"), "page");
  revalidatePath("/admin/acceso");
  revalidatePath("/admin/contenidos");
  revalidatePath("/admin/solicitudes", "layout");
}

async function perfil(ctx: Ctx, id: string) {
  const { data } = await ctx.supabase.from("profiles").select("id, full_name, is_admin").eq("id", id).maybeSingle();
  return data ? { ...data, full_name: data.full_name ?? "(sin nombre)" } : null;
}

async function grantsDe(ctx: Ctx, userIds: string[]) {
  if (!userIds.length) return [] as Grant[];
  const { data } = await ctx.supabase
    .from("content_grants")
    .select("id, user_id, level, note, granted_at, expires_at, revoked_at, access_code_id, application_id")
    .in("user_id", userIds);
  return (data ?? []) as Grant[];
}

/** Contenidos objetivo de un cambio de nivel: los que HOY tienen otro nivel. */
async function contenidosObjetivo(ctx: Ctx, a: { nivel: ContentAccessLevel; categoria?: string; ids?: string[] }) {
  let query = ctx.supabase.from("articles").select("id, title, category, access_level, status");
  if (a.ids?.length) query = query.in("id", a.ids);
  else if (a.categoria) query = query.eq("category", a.categoria as never);
  else return { error: "Indicá una categoría o los contenidos (ids)." as const };
  const { data, error } = await query.limit(500);
  if (error) return { error: error.message };
  const cambian = data.filter((c) => c.access_level !== a.nivel);
  if (cambian.length > MAX_CONTENIDOS) {
    return { error: `Son ${cambian.length} contenidos: más de ${MAX_CONTENIDOS} juntos. Acotá por categoría o por lista.` as const };
  }
  return { cambian, total: data.length };
}

/** Personas con reserva aprobada en un evento, y sus habilitaciones nacidas de esa reserva. */
async function aprobadosDe(ctx: Ctx, viajeId: string) {
  const { data: trip } = await ctx.supabase.from("trips").select("id, title").eq("id", viajeId).maybeSingle();
  if (!trip) return { error: "No encontré ese evento." as const };
  const { data: apps, error } = await ctx.supabase
    .from("applications")
    .select("id, user_id, full_name")
    .eq("trip_id", viajeId)
    .eq("status", "approved")
    .limit(MAX_PERSONAS + 1);
  if (error) return { error: error.message };
  if (apps.length > MAX_PERSONAS) return { error: `Hay más de ${MAX_PERSONAS} personas aprobadas: hacelo desde el panel.` as const };
  const grants = await grantsDe(ctx, [...new Set(apps.map((a) => a.user_id))]);
  return { trip, apps, grants };
}

function nombres(lista: string[]) {
  const mostrar = lista.slice(0, MOSTRAR_NOMBRES).join(", ");
  return lista.length > MOSTRAR_NOMBRES ? `${mostrar} y ${lista.length - MOSTRAR_NOMBRES} más` : mostrar;
}

export function buildAccessTools(ctx: Ctx) {
  const { supabase } = ctx;

  return {
    // ------------------------------------------------------------- lectura
    ver_acceso: tool({
      description:
        "Muestra QUÉ VE cada categoría de usuario y a QUIÉN se habilitó. Sin nombre: cuántos contenidos hay por nivel (abierto = lo ve cualquiera, con cuenta = cualquier registrada, del programa = solo habilitadas; publicados y borradores aparte) y las habilitaciones vigentes (persona, de dónde salió: solicitud aprobada, código o manual, nota, vencimiento). Con `nombre`: el nivel efectivo de esa persona, sus habilitaciones y qué contenidos publicados NO puede leer. Devuelve `persona_id`, que necesitan habilitar_acceso y quitar_acceso. NO trae mails ni datos de salud.",
      inputSchema: z.object({
        nombre: z.string().min(2).optional().describe("Parte del nombre de una persona"),
      }),
      execute: (args) =>
        leer(ctx, "ver_acceso", args, async (): Promise<{ rows: Record<string, unknown>[]; extra?: Record<string, unknown> } | { error: string }> => {
          const { data: arts, error } = await supabase.from("articles").select("id, title, access_level, status").limit(1000);
          if (error) return { error: error.message };

          const porNivel = Object.fromEntries(
            NIVELES.map((n) => [
              contentAccessLabel(n),
              {
                quien_lo_ve: QUIEN[n],
                publicados: arts.filter((a) => a.access_level === n && a.status === "published").length,
                borradores: arts.filter((a) => a.access_level === n && a.status !== "published").length,
              },
            ])
          );

          if (!args.nombre) {
            const { data: g, error: gError } = await supabase
              .from("content_grants")
              .select("id, user_id, level, note, granted_at, expires_at, revoked_at, access_code_id, application_id")
              .is("revoked_at", null)
              .order("granted_at", { ascending: false })
              .limit(500);
            if (gError) return { error: gError.message };
            const vigentes = (g as Grant[]).filter(vigente);
            const shown = vigentes.slice(0, MAX_ROWS);
            const { data: perfiles } = await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", [...new Set(shown.map((x) => x.user_id))]);
            const nombre = new Map((perfiles ?? []).map((p) => [p.id, p.full_name]));
            return {
              rows: shown.map((x) => ({
                persona_id: x.user_id,
                persona: nombre.get(x.user_id) ?? "(sin nombre)",
                origen: origen(x),
                nota: x.note,
                desde: x.granted_at,
                vence: x.expires_at,
              })),
              extra: { contenidos_por_nivel: porNivel, habilitaciones_vigentes: vigentes.length },
            };
          }

          const { data: perfiles, error: pError } = await supabase.from("profiles").select("id, full_name, is_admin").limit(5000);
          if (pError) return { error: pError.message };
          const hallados = matchNames(args.nombre, perfiles, (p) => p.full_name).slice(0, 5);
          if (!hallados.length) return { rows: [], extra: { aviso: "No encontré a nadie con ese nombre." } };

          const grants = await grantsDe(ctx, hallados.map((p) => p.id));
          const publicados = arts.filter((a) => a.status === "published");
          return {
            rows: hallados.map((p) => {
              const propios = grants.filter((x) => x.user_id === p.id);
              const nivel = nivelEfectivo(p.is_admin, propios);
              const cerrados = publicados.filter((a) => RANK[a.access_level] > RANK[nivel]);
              return {
                persona_id: p.id,
                persona: p.full_name,
                es_admin: p.is_admin,
                nivel_efectivo: contentAccessLabel(nivel),
                habilitaciones: propios.map((x) => ({
                  origen: origen(x),
                  nota: x.note,
                  vigente: vigente(x),
                  revocada: Boolean(x.revoked_at),
                  vence: x.expires_at,
                })),
                contenidos_que_puede_leer: publicados.length - cerrados.length,
                contenidos_que_no_puede_leer: cerrados.slice(0, MAX_ROWS).map((a) => a.title),
              };
            }),
            extra: {
              contenidos_por_nivel: porNivel,
              ...(hallados.length > 1 ? { aviso: "Hay más de una persona con ese nombre: preguntá cuál antes de cambiar nada." } : {}),
            },
          };
        }),
    }),

    // ------------------------------------------- 1. nivel de los contenidos
    cambiar_acceso_contenidos: tool({
      description:
        "Cambia QUIÉN PUEDE LEER uno o varios contenidos ya existentes: nivel 'publico' (lo ve cualquiera, con o sin cuenta), 'miembros' (cualquier persona registrada) o 'programa' (solo quien fue habilitada). Elegí los contenidos con `categoria` (todos los de un tema) o `ids` (de listar_articulos). Máximo 40. NO cambia si están publicados o en borrador (eso es `estado` en editar_articulo). Pide aprobación y la tarjeta lista cada contenido con su antes → después; marca con ⚠ lo que se ABRE a más gente. Ojo: pasar algo a 'publico' lo deja visible para cualquiera.",
      inputSchema: z.object({
        nivel: z.enum(NIVELES).describe("Nivel nuevo"),
        categoria: z.enum(ARTICLE_CATEGORY_LIST.map((c) => c.value) as [string, ...string[]]).optional(),
        ids: z.array(z.string().uuid()).max(MAX_CONTENIDOS).optional(),
      }),
      execute: async (a) => {
        const logArgs = { nivel: a.nivel, categoria: a.categoria, ids: a.ids?.length };
        const tope = await topeAlcanzado(ctx);
        if (tope) return { error: tope };
        const objetivo = await contenidosObjetivo(ctx, a);
        if ("error" in objetivo && objetivo.error) {
          await anotar(ctx, "cambiar_acceso_contenidos", logArgs, 0, objetivo.error);
          return { error: objetivo.error };
        }
        const cambian = objetivo.cambian ?? [];
        if (!cambian.length) return { error: "Esos contenidos ya tienen ese nivel: no hay nada para cambiar." };

        const { error } = await supabase.from("articles").update({ access_level: a.nivel }).in("id", cambian.map((c) => c.id));
        if (error) {
          await anotar(ctx, "cambiar_acceso_contenidos", logArgs, 0, error.message);
          return { error: `No se pudo guardar: ${error.message}` };
        }
        revalidarAcceso();
        await anotar(ctx, "cambiar_acceso_contenidos", { ...logArgs, cambiados: cambian.map((c) => c.id) }, cambian.length, null);
        return {
          actualizados: cambian.length,
          nota: `${cambian.length} contenidos pasaron a «${contentAccessLabel(a.nivel)}» (${QUIEN[a.nivel]}).`,
        };
      },
    }),

    // ------------------------------------------------- 2. habilitar personas
    habilitar_acceso: tool({
      description:
        "Habilita a UNA persona para leer los contenidos DEL PROGRAMA (nivel más alto). Es lo mismo que el botón de Niveles de acceso: sirve para quien ceremonió por fuera de la plataforma o a quien se le había quitado. No hace falta para quien fue aprobada en una solicitud: eso lo hace el sistema solo. Necesita `persona_id` (sale de ver_acceso). No convierte a nadie en administrador. Pide aprobación.",
      inputSchema: z.object({
        persona_id: z.string().uuid(),
        nota: z.string().max(200).optional().describe("Por qué se la habilita, ej. 'ceremonió con Estela en 2024'"),
      }),
      execute: async (a) => {
        const logArgs = { persona_id: a.persona_id };
        const tope = await topeAlcanzado(ctx);
        if (tope) return { error: tope };
        const p = await perfil(ctx, a.persona_id);
        if (!p) return { error: "No encontré a esa persona." };
        if (p.is_admin) return { error: "Es administradora: ya ve todo." };
        const grants = await grantsDe(ctx, [p.id]);
        if (nivelEfectivo(false, grants) === "programa") return { error: `${p.full_name} ya tiene acceso al programa.` };

        const { error } = await supabase.from("content_grants").insert({
          user_id: p.id,
          level: "programa",
          note: a.nota?.trim() || "Habilitada desde el asistente",
        });
        if (error) {
          await anotar(ctx, "habilitar_acceso", logArgs, 0, error.message);
          return { error: `No se pudo habilitar: ${error.message}` };
        }
        revalidarAcceso();
        await anotar(ctx, "habilitar_acceso", logArgs, 1, null);
        return { habilitada: p.full_name, nota: `${p.full_name} ya puede leer los contenidos del programa.` };
      },
    }),

    quitar_acceso: tool({
      description:
        "Le QUITA a UNA persona el acceso a los contenidos DEL PROGRAMA (revoca sus habilitaciones vigentes; queda registrado quién la había habilitado). Seguirá viendo lo abierto y lo 'con cuenta'. Necesita `persona_id` (de ver_acceso). Ojo: si la habilitación vino de una solicitud aprobada, volver a aprobar la solicitud NO la habilita de nuevo: hay que usar habilitar_acceso. Pide aprobación.",
      inputSchema: z.object({ persona_id: z.string().uuid() }),
      execute: async (a) => {
        const logArgs = { persona_id: a.persona_id };
        const tope = await topeAlcanzado(ctx);
        if (tope) return { error: tope };
        const p = await perfil(ctx, a.persona_id);
        if (!p) return { error: "No encontré a esa persona." };
        if (p.is_admin) return { error: "Es administradora: no se le puede quitar el acceso desde acá." };
        const grants = (await grantsDe(ctx, [p.id])).filter(vigente);
        if (!grants.length) return { error: `${p.full_name} no tiene habilitaciones vigentes.` };

        const { error } = await supabase
          .from("content_grants")
          .update({ revoked_at: new Date().toISOString() })
          .in("id", grants.map((g) => g.id));
        if (error) {
          await anotar(ctx, "quitar_acceso", logArgs, 0, error.message);
          return { error: `No se pudo quitar: ${error.message}` };
        }
        revalidarAcceso();
        await anotar(ctx, "quitar_acceso", logArgs, grants.length, null);
        return { quitada: p.full_name, nota: `${p.full_name} ya no ve los contenidos del programa.` };
      },
    }),

    // ------------------------------------------------- por evento (grupo)
    cambiar_acceso_por_evento: tool({
      description:
        "Habilita o quita el acceso a los contenidos DEL PROGRAMA a TODAS las personas con reserva APROBADA en un retiro o sesión (la categoría 'los que van a / fueron a ese evento'). accion='habilitar': a quienes todavía no lo tienen. accion='quitar': revoca las habilitaciones que nacieron de ese evento (las que vinieron por código o manuales de esas personas se conservan). Máximo 100 personas. Necesita `viaje_id` (de listar_viajes). Pide aprobación; la tarjeta lista los nombres.",
      inputSchema: z.object({
        viaje_id: z.string().uuid(),
        accion: z.enum(["habilitar", "quitar"]),
      }),
      execute: async (a) => {
        const logArgs = { viaje_id: a.viaje_id, accion: a.accion };
        const tope = await topeAlcanzado(ctx);
        if (tope) return { error: tope };
        const r = await aprobadosDe(ctx, a.viaje_id);
        if ("error" in r && r.error) return { error: r.error };
        const { trip, apps, grants } = r as Exclude<typeof r, { error: string }>;

        if (a.accion === "habilitar") {
          const aHabilitar = apps.filter((x) => !grants.some((g) => g.user_id === x.user_id && vigente(g) && g.level === "programa"));
          if (!aHabilitar.length) return { error: "Todas las personas aprobadas de ese evento ya tienen acceso." };
          let hechas = 0;
          const fallos: string[] = [];
          for (const app of aHabilitar) {
            const previa = grants.find((g) => g.application_id === app.id);
            // Una habilitacion por solicitud (indice unico parcial): si hubo una
            // revocada, se reactiva en vez de insertar otra.
            const { error } = previa
              ? await supabase.from("content_grants").update({ revoked_at: null }).eq("id", previa.id)
              : await supabase.from("content_grants").insert({
                  user_id: app.user_id,
                  level: "programa",
                  application_id: app.id,
                  note: "Habilitada desde el asistente (por evento)",
                });
            if (error) fallos.push(app.full_name);
            else hechas++;
          }
          revalidarAcceso();
          await anotar(ctx, "cambiar_acceso_por_evento", logArgs, hechas, fallos.length ? `fallaron ${fallos.length}` : null);
          return {
            habilitadas: hechas,
            ...(fallos.length ? { fallaron: fallos } : {}),
            nota: `Se habilitó a ${hechas} personas de «${trip.title}».${fallos.length ? ` Fallaron: ${fallos.join(", ")}.` : ""}`,
          };
        }

        const idsApps = new Set(apps.map((x) => x.id));
        const aQuitar = grants.filter((g) => vigente(g) && g.application_id && idsApps.has(g.application_id));
        if (!aQuitar.length) return { error: "Nadie de ese evento tiene una habilitación vigente nacida de su reserva." };
        const { error } = await supabase
          .from("content_grants")
          .update({ revoked_at: new Date().toISOString() })
          .in("id", aQuitar.map((g) => g.id));
        if (error) {
          await anotar(ctx, "cambiar_acceso_por_evento", logArgs, 0, error.message);
          return { error: `No se pudo quitar: ${error.message}` };
        }
        revalidarAcceso();
        await anotar(ctx, "cambiar_acceso_por_evento", logArgs, aQuitar.length, null);
        return { quitadas: aQuitar.length, nota: `Se quitó el acceso a ${aQuitar.length} personas de «${trip.title}».` };
      },
    }),

    // ---------------------------------------------------------- 3. códigos
    crear_codigo_acceso: tool({
      description:
        "Crea un CÓDIGO DE ACCESO que una persona CON CUENTA canjea para quedar habilitada (sirve para quien ceremonió antes de la plataforma). El texto del código lo da la persona de la organización (4 a 32 caracteres: letras, números y guiones, ej. TULUM-2026); NO lo inventes. Uno por viaje o tanda, no por persona. Se puede limitar por usos y por vencimiento (el vencimiento también vence el acceso de quien lo canjeó). Pide aprobación.",
      inputSchema: z.object({
        codigo: z.string().min(4).max(40),
        etiqueta: z.string().max(120).optional().describe("Para qué es, ej. 'Grupo Tulum 2026'"),
        nivel: z.enum(["miembros", "programa"]).default("programa"),
        viaje_id: z.string().uuid().optional().describe("Evento al que se asocia (opcional)"),
        usos_maximos: z.number().int().min(1).max(1000).optional().describe("Vacío = sin tope"),
        vence: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("AAAA-MM-DD, hasta el final de ese día"),
      }),
      execute: async (a) => {
        const code = normalizarCodigo(a.codigo);
        const logArgs = { etiqueta: a.etiqueta, nivel: a.nivel, viaje_id: a.viaje_id, usos_maximos: a.usos_maximos, vence: a.vence };
        const tope = await topeAlcanzado(ctx);
        if (tope) return { error: tope };
        if (!CODIGO_OK.test(code)) return { error: MSG_CODIGO };

        const { error } = await supabase.from("access_codes").insert({
          code,
          level: a.nivel,
          label: a.etiqueta?.trim() || null,
          trip_id: a.viaje_id ?? null,
          max_uses: a.usos_maximos ?? null,
          expires_at: a.vence ? `${a.vence}T23:59:59-03:00` : null,
        });
        if (error) {
          const msg = error.message.includes("access_codes_code_key") ? "Ya existe un código con ese texto." : error.message;
          await anotar(ctx, "crear_codigo_acceso", logArgs, 0, msg);
          return { error: `No se pudo crear el código: ${msg}` };
        }
        revalidarAcceso();
        await anotar(ctx, "crear_codigo_acceso", logArgs, 1, null);
        return { creado: true, nota: `Código creado (${contentAccessLabel(a.nivel)}). Quien lo canjee con su cuenta queda habilitada.` };
      },
    }),

    cambiar_estado_codigo: tool({
      description:
        "Apaga o vuelve a activar un código de acceso (`id` sale de listar_codigos_acceso). Apagar corta la entrada de gente NUEVA; quienes ya lo canjearon conservan el acceso (a ellas se les quita con quitar_acceso). Pide aprobación.",
      inputSchema: z.object({ id: z.string().uuid(), activo: z.boolean() }),
      execute: async (a) => {
        const logArgs = { id: a.id, activo: a.activo };
        const tope = await topeAlcanzado(ctx);
        if (tope) return { error: tope };
        const { data: c } = await supabase.from("access_codes").select("id, label, is_active").eq("id", a.id).maybeSingle();
        if (!c) return { error: "No encontré ese código." };
        if (c.is_active === a.activo) return { error: `Ese código ya está ${a.activo ? "activo" : "apagado"}.` };
        const { error } = await supabase.from("access_codes").update({ is_active: a.activo }).eq("id", a.id);
        if (error) {
          await anotar(ctx, "cambiar_estado_codigo", logArgs, 0, error.message);
          return { error: `No se pudo guardar: ${error.message}` };
        }
        revalidarAcceso();
        await anotar(ctx, "cambiar_estado_codigo", logArgs, 1, null);
        return { actualizado: true, nota: `El código «${c.label ?? "sin etiqueta"}» quedó ${a.activo ? "activo" : "apagado"}.` };
      },
    }),
  };
}

// ----------------------------------------------------------- vista previa

const CODIGO_OK = /^[A-Z0-9][A-Z0-9-]{3,31}$/;
const MSG_CODIGO = "El código va de 4 a 32 caracteres, con letras, números y guiones. Sin acentos ni espacios.";
const normalizarCodigo = (raw: string) => raw.trim().toUpperCase().replace(/\s+/g, "-");

/**
 * `toolApproval` de las herramientas de acceso: lee el estado REAL de la base y
 * arma lo que va a pasar, con nombres y titulos. Si no hay nada que hacer,
 * deniega sin molestar a la persona.
 */
export function buildAccessApprovals(ctx: Ctx) {
  const { supabase } = ctx;

  return {
    cambiar_acceso_contenidos: async (a: { nivel: ContentAccessLevel; categoria?: string; ids?: string[] }): Promise<Previa> => {
      const r = await contenidosObjetivo(ctx, a);
      if ("error" in r && r.error) return { type: "denied", reason: r.error };
      const cambian = r.cambian ?? [];
      if (!cambian.length) return { type: "denied", reason: "Esos contenidos ya tienen ese nivel: no hay nada para cambiar." };

      const abre = cambian.filter((c) => RANK[a.nivel] < RANK[c.access_level]);
      const publicadosAbiertos = abre.filter((c) => c.status === "published").length;
      const encabezado = abre.length
        ? `⚠ SE ABRE a más gente: ${abre.length} contenido(s) pasan a ser visibles para ${QUIEN[a.nivel]}.${publicadosAbiertos ? ` ${publicadosAbiertos} ya está(n) publicado(s): se ve(n) de inmediato.` : ""}`
        : `Se CIERRA: desde ahora lo lee ${QUIEN[a.nivel]}; el resto verá un candado.`;
      const cat = a.categoria ? `categoría ${articleCategoryLabel(a.categoria as never)}` : "contenidos elegidos";
      return aprobar(
        encabezado,
        `${cambian.length} contenido(s) (${cat}) → «${contentAccessLabel(a.nivel)}»`,
        cambian.map((c) => `${c.title}${c.status === "published" ? "" : " (borrador)"}: ${contentAccessLabel(c.access_level)} → ${contentAccessLabel(a.nivel)}`)
      );
    },

    habilitar_acceso: async (a: { persona_id: string; nota?: string }): Promise<Previa> => {
      const p = await perfil(ctx, a.persona_id);
      if (!p) return noEncontrado("a esa persona");
      if (p.is_admin) return { type: "denied", reason: "Es administradora: ya ve todo." };
      const grants = await grantsDe(ctx, [p.id]);
      if (nivelEfectivo(false, grants) === "programa") return { type: "denied", reason: `${p.full_name} ya tiene acceso al programa.` };
      const { count } = await supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .eq("access_level", "programa");
      return aprobar(
        `${
          count
            ? `Va a poder leer los ${count} contenidos publicados del programa.`
            : "Hoy no hay contenidos publicados del programa: no va a ver nada nuevo hasta que se publique alguno."
        } No se le da ningún permiso de administración.`,
        p.full_name,
        [`Acceso: ${contentAccessLabel("miembros")} → ${contentAccessLabel("programa")}`, `Nota: ${a.nota?.trim() || "Habilitada desde el asistente"}`]
      );
    },

    quitar_acceso: async (a: { persona_id: string }): Promise<Previa> => {
      const p = await perfil(ctx, a.persona_id);
      if (!p) return noEncontrado("a esa persona");
      if (p.is_admin) return { type: "denied", reason: "Es administradora: no se le puede quitar el acceso desde acá." };
      const grants = (await grantsDe(ctx, [p.id])).filter(vigente);
      if (!grants.length) return { type: "denied", reason: `${p.full_name} no tiene habilitaciones vigentes.` };
      return aprobar(
        "Deja de ver los contenidos del programa. Seguirá viendo lo abierto y lo «con cuenta».",
        p.full_name,
        [
          `Acceso: ${contentAccessLabel("programa")} → ${contentAccessLabel("miembros")}`,
          ...grants.map((g) => `Se revoca: habilitación por ${origen(g)}${g.note ? ` («${g.note}»)` : ""}`),
          "Si vino de una solicitud aprobada, aprobarla de nuevo no la habilita otra vez.",
        ]
      );
    },

    cambiar_acceso_por_evento: async (a: { viaje_id: string; accion: "habilitar" | "quitar" }): Promise<Previa> => {
      const r = await aprobadosDe(ctx, a.viaje_id);
      if ("error" in r && r.error) return { type: "denied", reason: r.error };
      const { trip, apps, grants } = r as Exclude<typeof r, { error: string }>;
      if (a.accion === "habilitar") {
        const aHabilitar = apps.filter((x) => !grants.some((g) => g.user_id === x.user_id && vigente(g) && g.level === "programa"));
        if (!aHabilitar.length) return { type: "denied", reason: "Todas las personas aprobadas de ese evento ya tienen acceso." };
        return aprobar(
          `Se habilita a ${aHabilitar.length} persona(s) a los contenidos del programa.`,
          `«${trip.title}» (reservas aprobadas)`,
          [`Personas: ${nombres(aHabilitar.map((x) => x.full_name))}`]
        );
      }
      const idsApps = new Set(apps.map((x) => x.id));
      const aQuitar = grants.filter((g) => vigente(g) && g.application_id && idsApps.has(g.application_id));
      if (!aQuitar.length) return { type: "denied", reason: "Nadie de ese evento tiene una habilitación vigente nacida de su reserva." };
      const quienes = apps.filter((x) => aQuitar.some((g) => g.application_id === x.id)).map((x) => x.full_name);
      return aprobar(
        `Se QUITA el acceso al programa a ${aQuitar.length} persona(s). Las habilitaciones por código o manuales de esas personas se conservan.`,
        `«${trip.title}»`,
        [`Personas: ${nombres(quienes)}`]
      );
    },

    crear_codigo_acceso: async (a: {
      codigo: string;
      etiqueta?: string;
      nivel: "miembros" | "programa";
      viaje_id?: string;
      usos_maximos?: number;
      vence?: string;
    }): Promise<Previa> => {
      const code = normalizarCodigo(a.codigo);
      if (!CODIGO_OK.test(code)) return { type: "denied", reason: MSG_CODIGO };
      const { data: existe } = await supabase.from("access_codes").select("id").eq("code", code).maybeSingle();
      if (existe) return { type: "denied", reason: "Ya existe un código con ese texto." };
      let evento = "(ninguno)";
      if (a.viaje_id) {
        const { data: t } = await supabase.from("trips").select("title").eq("id", a.viaje_id).maybeSingle();
        if (!t) return noEncontrado("ese evento");
        evento = t.title;
      }
      return aprobar(
        `Quien lo canjee, con su cuenta, queda habilitada al nivel «${contentAccessLabel(a.nivel)}».`,
        `Código ${code}`,
        [
          `Para: ${a.etiqueta?.trim() || "(sin etiqueta)"}`,
          `Evento: ${evento}`,
          `Usos máximos: ${a.usos_maximos ?? "sin tope"}`,
          `Vence: ${a.vence ? `el ${a.vence.split("-").reverse().join("/")} (fin del día)` : "no vence"}`,
        ]
      );
    },

    cambiar_estado_codigo: async (a: { id: string; activo: boolean }): Promise<Previa> => {
      const { data: c } = await supabase.from("access_codes").select("label, is_active, level").eq("id", a.id).maybeSingle();
      if (!c) return noEncontrado("ese código");
      if (c.is_active === a.activo) return { type: "denied", reason: `Ese código ya está ${a.activo ? "activo" : "apagado"}.` };
      return aprobar(
        a.activo
          ? "Vuelve a aceptar canjes."
          : "Se corta la entrada de gente NUEVA. Quienes ya lo canjearon conservan el acceso (se les quita persona por persona).",
        `Código «${c.label ?? "sin etiqueta"}» (${contentAccessLabel(c.level)})`,
        [`Estado: ${c.is_active ? "activo" : "apagado"} → ${a.activo ? "activo" : "apagado"}`]
      );
    },
  };
}
