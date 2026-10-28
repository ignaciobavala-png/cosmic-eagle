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

  const agent = buildAgent({
    supabase,
    userId: user.id,
    conversationId: typeof body.conversationId === "string" ? body.conversationId.slice(0, 64) : null,
  });

  return createAgentUIStreamResponse({
    agent,
    uiMessages: body.messages,
    abortSignal: request.signal,
  });
}
