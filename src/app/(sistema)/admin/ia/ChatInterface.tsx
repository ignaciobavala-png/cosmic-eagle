"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Loader2, Send, Square } from "lucide-react";

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
  ver_participante: "la ficha de un participante",
  listar_textos_sitio: "textos del sitio",
  listar_avisos: "avisos",
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

function MessageView({ message }: { message: UIMessage }) {
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

export function ChatInterface() {
  // Une las llamadas de una misma charla en `ai_agent_log`.
  const [conversationId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop, error, clearError } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ia/chat",
      body: { conversationId },
    }),
  });

  const busy = status === "submitted" || status === "streaming";

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
    <div className="glass-card rounded-2xl flex flex-col h-[calc(100dvh-17rem)] min-h-[26rem]">
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4" aria-live="polite">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-on-surface-variant">Probá con alguna de estas:</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-xl">
              {SUGERENCIAS.map((s) => (
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
          messages.map((m) => <MessageView key={m.id} message={m} />)
        )}

        {status === "submitted" && (
          <p className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Loader2 size={12} className="animate-spin" aria-hidden /> Pensando…
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-error">
            No se pudo obtener la respuesta. Probá de nuevo en un momento.
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
        <label htmlFor="ia-input" className="sr-only">
          Mensaje para el asistente
        </label>
        <textarea
          id="ia-input"
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
