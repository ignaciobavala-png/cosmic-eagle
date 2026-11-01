import "server-only";
import { createHmac } from "node:crypto";
import { tool } from "ai";
import { z } from "zod";
import { sendEmail } from "@/lib/email/resend";
import { AvisoInterno } from "@/emails/AvisoInterno";
import { capitalizeName } from "@/lib/person-name";
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

  async function anotar(args: Record<string, unknown>, rows: number | null, error: string | null) {
    const { error: logError } = await supabase.from("ai_agent_log").insert({
      user_id: ctx.userId,
      conversation_id: ctx.conversationId,
      kind: "write",
      tool: "enviar_correo_equipo",
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
  };
}
