"use client";

import { Fragment, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses, type UIMessage } from "ai";
import { Loader2, Mic, RotateCcw, Send, Square } from "lucide-react";

/**
 * Chat del asistente. Renderiza SOLO las partes `text` y un renglon por cada
 * herramienta que el agente uso: el razonamiento del modelo (`reasoning`) no se
 * muestra. Todo sale como texto de React — nunca HTML — aunque el modelo
 * devuelva markup.
 */
const SUGERENCIAS = [
  "¿Qué viajes y sesiones hay cargados y cuántos lugares quedan?",
  "¿Qué solicitudes están esperando revisión?",
  "¿Hay avisos sin leer en la campanita?",
  "¿En qué retiros y sesiones estuvo cada participante de la última sesión?",
  "¿Qué dice hoy el título de la home?",
];

const HERRAMIENTAS: Record<string, string> = {
  listar_viajes: "viajes y sesiones",
  listar_solicitudes: "solicitudes",
  resumen: "el resumen de cifras",
  consultar_crm: "el CRM",
  ver_participante: "la ficha de un participante",
  listar_textos_sitio: "textos del sitio",
  listar_avisos: "avisos",
  enviar_correo_equipo: "el envío de correo al equipo",
};

/** `**negrita**` dentro de una linea; lo demas, texto plano. */
function Inline({ text }: { text: string }) {
  const parts = text.split("**");
  const last = parts.length - 1;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 && i < last ? (
          <strong key={i} className="font-semibold text-on-surface">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{i % 2 === 1 ? `**${part}` : part}</Fragment>
        )
      )}
    </>
  );
}

/** Parrafos y listas simples (`- ` y `1. `); alcanza para lo que contesta el agente. */
function Prose({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const bullet = line.match(/^\s*[-*]\s+(.*)$/);
        const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
        if (bullet)
          return (
            <p key={i} className="pl-4 -indent-3">
              <span aria-hidden>• </span>
              <Inline text={bullet[1]} />
            </p>
          );
        if (numbered)
          return (
            <p key={i} className="pl-5 -indent-4">
              {numbered[1]}. <Inline text={numbered[2]} />
            </p>
          );
        return (
          <p key={i}>
            <Inline text={line.replace(/^#+\s*/, "")} />
          </p>
        );
      })}
    </div>
  );
}

function ToolLine({ part }: { part: { type: string; state?: string } }) {
  const name = part.type.replace(/^tool-/, "");
  const label = HERRAMIENTAS[name] ?? name;
  const done = part.state === "output-available";
  const failed = part.state === "output-error";
  return (
    <p className="flex items-center gap-2 text-xs text-on-surface-variant">
      {done || failed ? (
        <span aria-hidden>{failed ? "✕" : "✓"}</span>
      ) : (
        <Loader2 size={12} className="animate-spin" aria-hidden />
      )}
      {done ? "Consultó" : failed ? "No pudo consultar" : "Consultando"} {label}
    </p>
  );
}


type CorreoInput = { para?: string; asunto?: string; mensaje?: string };

/**
 * Borrador del correo al equipo: se muestra COMPLETO y no sale hasta que la
 * persona aprueba. Despues del clic el chat continua solo
 * (`sendAutomaticallyWhen`).
 */
function CorreoCard({
  part,
  onRespond,
}: {
  part: { state?: string; input?: CorreoInput; approval?: { id: string; approved?: boolean }; output?: { enviados?: string[]; fallidos?: string[]; error?: string } };
  onRespond: (id: string, approved: boolean) => void;
}) {
  const input = part.input ?? {};
  return (
    <div className="rounded-xl border border-primary-fixed-dim/40 bg-surface-container/40 p-3 text-xs space-y-2">
      <p className="font-semibold text-on-surface">Correo al equipo</p>
      <p>
        <span className="text-on-surface-variant">Para:</span> {input.para}
      </p>
      <p>
        <span className="text-on-surface-variant">Asunto:</span> {input.asunto}
      </p>
      <p className="whitespace-pre-wrap rounded-lg bg-black/10 p-2 text-on-surface">{input.mensaje}</p>

      {part.state === "approval-requested" && part.approval && (
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => onRespond(part.approval!.id, true)}
            className="rounded-lg bg-primary-container px-3 py-1.5 font-semibold text-on-primary hover:bg-primary-fixed transition-colors"
          >
            Aprobar y enviar
          </button>
          <button
            type="button"
            onClick={() => onRespond(part.approval!.id, false)}
            className="rounded-lg border border-outline-variant/60 px-3 py-1.5 text-on-surface-variant hover:text-on-surface"
          >
            Rechazar
          </button>
        </div>
      )}
      {part.state === "approval-responded" && <p className="text-on-surface-variant">Enviando…</p>}
      {part.state === "output-denied" && <p className="text-on-surface-variant">Rechazaste este correo: no se envió.</p>}
      {part.state === "output-available" &&
        (part.output?.error ? (
          <p className="text-error">{part.output.error}</p>
        ) : (
          <p className="text-on-surface-variant">
            {part.output?.enviados?.length ? `✓ Enviado a ${part.output.enviados.join(", ")}.` : ""}
            {part.output?.fallidos?.length ? ` ✕ No se pudo enviar a ${part.output.fallidos.join(", ")}.` : ""}
          </p>
        ))}
    </div>
  );
}

/** Tipos minimos de la Web Speech API (no vienen en lib.dom). */
type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

/**
 * Dictado por voz, gratis: usa el reconocimiento del navegador (Web Speech API).
 * El texto cae en el cuadro y NO se envia solo: hay que revisarlo, sobre todo los
 * nombres propios. Chrome manda el audio a Google para transcribirlo; en Firefox
 * no existe y el boton no aparece.
 */
function useDictation(onText: (text: string) => void) {
  const recRef = useRef<SpeechRec | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  // false en el servidor y en la hidratacion; despues, lo que diga el navegador.
  const supported = useSyncExternalStore(
    () => () => {},
    () => {
      const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
      return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);
    },
    () => false
  );

  useEffect(() => () => recRef.current?.stop(), []);

  function toggle(currentText: string) {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = "es-AR";
    rec.continuous = true;
    rec.interimResults = true;
    const base = currentText ? `${currentText.trimEnd()} ` : "";
    let finals = "";

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finals += r[0].transcript;
        else interim += r[0].transcript;
      }
      onText(`${base}${finals}${interim}`.trimStart());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setVoiceError("Permití el micrófono en el navegador para dictar.");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        setVoiceError("No se pudo escuchar. Probá de nuevo.");
      }
    };
    rec.onend = () => setListening(false);

    setVoiceError(null);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  return { supported, listening, voiceError, toggle };
}

function MessageView({
  message,
  onApproval,
}: {
  message: UIMessage;
  onApproval: (id: string, approved: boolean) => void;
}) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={`max-w-[92%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary-container/15 text-on-surface"
            : "glass-card text-on-surface-variant"
        }`}
      >
        <div className="space-y-2">
          {message.parts.map((part, i) => {
            if (part.type === "text") {
              return isUser ? (
                <p key={i} className="whitespace-pre-wrap">
                  {part.text}
                </p>
              ) : (
                <Prose key={i} text={part.text} />
              );
            }
            if (part.type === "tool-enviar_correo_equipo") {
              return <CorreoCard key={i} part={part as never} onRespond={onApproval} />;
            }
            if (part.type.startsWith("tool-")) {
              return <ToolLine key={i} part={part as { type: string; state?: string }} />;
            }
            return null; // `reasoning` y el resto no se muestran
          })}
        </div>
      </div>
    </div>
  );
}

export const SUGERENCIAS_IA = SUGERENCIAS;

/**
 * `variant="page"` es la pantalla completa de /admin/ia; `"bubble"` es el mismo
 * chat dentro de la burbuja flotante (sin marco propio: lo pone la burbuja).
 * `pagina` es la ruta donde esta la persona: el servidor la usa para explicar
 * ESA pantalla. `active` enfoca el cuadro cuando la burbuja se abre.
 */
export function ChatInterface({
  variant = "page",
  pagina,
  suggestions = SUGERENCIAS,
  active = true,
  onBusyChange,
}: {
  variant?: "page" | "bubble";
  pagina?: string;
  suggestions?: string[];
  active?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  // Une las llamadas de una misma charla en `ai_agent_log`.
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // El body se lee en cada envio: la burbuja sigue montada al navegar y la
  // pantalla cambia entre mensaje y mensaje.
  const bodyRef = useRef({ conversationId, pagina });
  useEffect(() => {
    bodyRef.current = { conversationId, pagina };
  }, [conversationId, pagina]);

  // `body` es una funcion que el transporte llama al ENVIAR, no al renderizar:
  // la regla de refs no lo distingue. Sin esto, la ruta y la charla quedarian
  // congeladas en el valor del primer render (y el reenvio tras aprobar un
  // correo no pasaria por `sendMessage`).
  /* eslint-disable react-hooks/refs */
  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/ia/chat",
        body: () => bodyRef.current,
      })
  );
  /* eslint-enable react-hooks/refs */

  const { messages, setMessages, sendMessage, status, stop, error, clearError, addToolApprovalResponse } = useChat({
    transport,
    // Tras aprobar o rechazar un correo, el chat sigue solo.
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  function newConversation() {
    stop();
    clearError();
    setMessages([]);
    setInput("");
    setConversationId(crypto.randomUUID());
  }

  // El servidor contesta con `{ error }` (tope diario, mensaje largo…): se muestra tal cual.
  const errorText = (() => {
    if (!error) return null;
    try {
      const parsed = JSON.parse(error.message) as { error?: string };
      if (parsed.error) return parsed.error;
    } catch {}
    return "No se pudo obtener la respuesta. Probá de nuevo en un momento.";
  })();

  const dictation = useDictation(setInput);

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  useEffect(() => {
    if (active && variant === "bubble") inputRef.current?.focus();
  }, [active, variant]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  function send(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    if (error) clearError();
    sendMessage({ text: value });
    setInput("");
  }

  return (
    <div
      className={
        variant === "bubble"
          ? "flex h-full min-h-0 flex-col"
          : "glass-card rounded-2xl flex flex-col h-[calc(100dvh-17rem)] min-h-[26rem]"
      }
    >
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4" aria-live="polite">
        {messages.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={newConversation}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <RotateCcw size={12} aria-hidden /> Nueva conversación
            </button>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-on-surface-variant">Probá con alguna de estas:</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-xl">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-outline-variant/60 px-3.5 py-1.5 text-xs text-on-surface-variant hover:text-on-surface hover:border-primary-fixed-dim/50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <MessageView
              key={m.id}
              message={m}
              onApproval={(id, approved) => addToolApprovalResponse({ id, approved })}
            />
          ))
        )}

        {status === "submitted" && (
          <p className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Loader2 size={12} className="animate-spin" aria-hidden /> Pensando…
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-error">
            {errorText}
          </p>
        )}
        {dictation.voiceError && (
          <p role="alert" className="text-xs text-error">
            {dictation.voiceError}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 border-t border-outline-variant/40 p-3"
      >
        <label htmlFor={variant === "bubble" ? "ia-input-bubble" : "ia-input"} className="sr-only">
          Mensaje para el asistente
        </label>
        <textarea
          id={variant === "bubble" ? "ia-input-bubble" : "ia-input"}
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Escribí tu consulta…"
          className="flex-1 resize-none rounded-lg border border-outline-variant/60 bg-transparent px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary-fixed-dim/60 focus:outline-none max-h-32"
        />
        {dictation.supported && (
          <button
            type="button"
            onClick={() => dictation.toggle(input)}
            aria-label={dictation.listening ? "Dejar de dictar" : "Dictar con la voz"}
            aria-pressed={dictation.listening}
            title="Dictado por voz (el navegador procesa el audio)"
            className={`rounded-lg border p-2.5 transition-colors ${
              dictation.listening
                ? "border-error text-error animate-pulse"
                : "border-outline-variant/60 text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Mic size={16} />
          </button>
        )}
        {busy ? (
          <button
            type="button"
            onClick={() => stop()}
            aria-label="Detener"
            className="rounded-lg border border-outline-variant/60 p-2.5 text-on-surface-variant hover:text-on-surface"
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="Enviar"
            className="rounded-lg bg-primary-container p-2.5 text-on-primary disabled:opacity-40 hover:bg-primary-fixed transition-colors"
          >
            <Send size={16} />
          </button>
        )}
      </form>
    </div>
  );
}
