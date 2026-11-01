import { createAgentUIStreamResponse } from "ai";
import { createClient } from "@/lib/supabase/server";
import { buildAgent } from "@/lib/ia/agent";

/**
 * Chat del agente del panel. El rol sale de LA SESION, en el servidor: nunca de
 * un header ni de algo que mande el cliente. Un request sin sesion de admin
 * muere aca antes de gastar un token.
 *
 * Dinamica por definicion (lee cookies) y sin cache. `maxDuration` cubre varios
 * pasos de herramientas + el razonamiento del modelo.
 */
export const maxDuration = 120;

/** Largo maximo de la conversacion que se acepta (mensajes). */
const MAX_MESSAGES = 60;

/** Largo maximo del mensaje nuevo, en caracteres. */
const MAX_CHARS = 4000;

/** Mensajes por persona y por dia. Ajustable con `IA_DAILY_LIMIT` sin tocar codigo. */
const DAILY_LIMIT = Number(process.env.IA_DAILY_LIMIT) || 100;

export async function POST(request: Request) {
  if (!process.env.DEEPSEEK_API_KEY) {
    return Response.json({ error: "El asistente no está configurado." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return Response.json({ error: "No autorizado" }, { status: 403 });

  let body: { messages?: unknown; conversationId?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Pedido inválido" }, { status: 400 });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
    return Response.json({ error: "Pedido inválido" }, { status: 400 });
  }

  // Largo del ultimo mensaje de la persona: un pegado enorme se paga entero.
  const last = body.messages[body.messages.length - 1] as { parts?: { type?: string; text?: string }[] };
  const typed = (last?.parts ?? []).reduce((n, p) => n + (p.type === "text" ? (p.text?.length ?? 0) : 0), 0);
  if (typed > MAX_CHARS) {
    return Response.json({ error: "El mensaje es demasiado largo." }, { status: 413 });
  }

  // Tope diario por persona (dia de Buenos Aires). Cuenta mensajes, no pasos.
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
  const { count } = await supabase
    .from("ai_agent_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("kind", "message")
    .gte("created_at", `${hoy}T00:00:00-03:00`);
  if ((count ?? 0) >= DAILY_LIMIT) {
    return Response.json(
      { error: `Llegaste al tope de ${DAILY_LIMIT} consultas por hoy. Mañana se renueva.` },
      { status: 429 }
    );
  }
  // Se anota ANTES de correr: un turno abortado tambien gasta.
  const conversationId = typeof body.conversationId === "string" ? body.conversationId.slice(0, 64) : null;
  await supabase.from("ai_agent_log").insert({
    user_id: user.id,
    conversation_id: conversationId,
    kind: "message",
    tool: "chat",
  });

  const agent = buildAgent({
    supabase,
    userId: user.id,
    conversationId,
  });

  return createAgentUIStreamResponse({
    agent,
    uiMessages: body.messages,
    abortSignal: request.signal,
  });
}
