"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, History, Loader2, Trash2 } from "lucide-react";
import type { UIMessage } from "ai";
import { createClient } from "@/lib/supabase/client";

/**
 * Piezas del chat del asistente. Todo sale como texto de React, nunca HTML:
 * aunque el modelo devuelva markup, no se interpreta.
 */

export const HERRAMIENTAS: Record<string, string> = {
  listar_viajes: "viajes y sesiones",
  listar_solicitudes: "solicitudes",
  resumen: "el resumen de cifras",
  consultar_crm: "el CRM",
  ver_participante: "la ficha de un participante",
  listar_textos_sitio: "textos del sitio",
  listar_avisos: "avisos",
  listar_articulos: "los artículos",
  listar_faqs: "las preguntas frecuentes",
  listar_testimonios: "los testimonios",
  listar_correos: "los correos enviados",
  listar_codigos_acceso: "los códigos de acceso",
  listar_materiales: "el material enviado",
  contar_suscriptores: "los suscriptores",
  listar_medios_cobro: "los medios de cobro",
  enviar_correo_equipo: "el envío de correo al equipo",
  crear_viaje: "la creación del viaje",
  crear_articulo: "la creación del artículo",
  ver_testimonio: "un testimonio completo",
  crear_testimonio: "la carga del testimonio",
  crear_articulos_desde_testimonios: "la copia de testimonios a artículos",
};

const CAMPOS: Record<string, string> = {
  tipo: "tipo",
  estado: "estado",
  cuando: "cuándo",
  texto: "texto",
  nombre: "nombre",
  pais: "país",
  genero: "género",
  nivel: "nivel",
  pago: "pago",
  categoria: "categoría",
  solo_fallidos: "solo fallidos",
  solo_no_leidos: "solo sin leer",
  solo_borradores: "solo borradores",
  solo_activos: "solo activos",
};

// ---------- Texto del asistente ----------

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

const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isSeparator = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

/** Parrafos, listas simples (`- ` y `1. `) y tablas (`| a | b |`). */
export function Prose({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Tabla: encabezado + separador + filas.
    if (isTableRow(line) && lines[i + 1] && isSeparator(lines[i + 1])) {
      const head = cells(line);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && isTableRow(lines[j])) rows.push(cells(lines[j++]));
      blocks.push(
        <div key={i} className="overflow-x-auto rounded-lg border border-outline-variant/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/20 text-on-surface">
              <tr>
                {head.map((h, k) => (
                  <th key={k} className="px-2.5 py-1.5 font-semibold whitespace-nowrap">
                    <Inline text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, k) => (
                <tr key={k} className="border-t border-outline-variant/30">
                  {r.map((c, m) => (
                    <td key={m} className="px-2.5 py-1.5 align-top">
                      <Inline text={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      i = j - 1;
      continue;
    }

    if (!line.trim()) {
      blocks.push(<div key={i} className="h-1" />);
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    if (bullet)
      blocks.push(
        <p key={i} className="pl-4 -indent-3">
          <span aria-hidden>• </span>
          <Inline text={bullet[1]} />
        </p>
      );
    else if (numbered)
      blocks.push(
        <p key={i} className="pl-5 -indent-4">
          {numbered[1]}. <Inline text={numbered[2]} />
        </p>
      );
    else
      blocks.push(
        <p key={i}>
          <Inline text={line.replace(/^#+\s*/, "")} />
        </p>
      );
  }

  return <div className="space-y-1.5">{blocks}</div>;
}

// ---------- Rastro de herramientas ----------

/** "(estado: pendiente, país: Chile)": lo que se pidio, en una linea corta. */
function resumenArgs(input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const parts = Object.entries(input as Record<string, unknown>)
    .filter(([, v]) => (typeof v === "string" && v.trim()) || typeof v === "number" || v === true)
    .map(([k, v]) => (v === true ? (CAMPOS[k] ?? k) : `${CAMPOS[k] ?? k}: ${String(v).slice(0, 40)}`));
  return parts.length ? ` (${parts.join(", ")})` : "";
}

export function ToolLine({ part }: { part: { type: string; state?: string; input?: unknown } }) {
  const name = part.type.replace(/^tool-/, "");
  const label = HERRAMIENTAS[name] ?? name;
  const done = part.state === "output-available";
  const failed = part.state === "output-error";
  return (
    <p className="flex items-start gap-2 text-xs text-on-surface-variant">
      {done || failed ? (
        <span aria-hidden>{failed ? "✕" : "✓"}</span>
      ) : (
        <Loader2 size={12} className="mt-0.5 shrink-0 animate-spin" aria-hidden />
      )}
      <span>
        {done ? "Consultó" : failed ? "No pudo consultar" : "Consultando"} {label}
        <span className="opacity-70">{resumenArgs(part.input)}</span>
      </span>
    </p>
  );
}

// ---------- Copiar ----------

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-on-surface-variant/80 hover:text-on-surface transition-colors"
    >
      {copied ? <Check size={11} aria-hidden /> : <Copy size={11} aria-hidden />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

// ---------- Tarjetas de aprobación ----------

type ToolPart = {
  type: string;
  state?: string;
  input?: Record<string, unknown>;
  approval?: { id: string; approved?: boolean; requestReason?: string };
  output?: Record<string, unknown> & { error?: string; editar_en?: string };
};

type Campo = [label: string, value: unknown];

const TIPO_VIAJE: Record<string, string> = { retiro: "Retiro (Viaje Cósmico)", ceremonia: "Sesión Cósmica" };
const ACCESO: Record<string, string> = { publico: "Abierto", miembros: "Con cuenta", programa: "Del programa" };

/**
 * Cada herramienta de escritura muestra lo que va a hacer COMPLETO, y no hace
 * nada hasta que la persona aprueba.
 */
const TARJETAS: Record<
  string,
  {
    titulo: string;
    aprobar: string;
    nota?: (input: Record<string, unknown>) => string | null;
    campos: (input: Record<string, unknown>) => Campo[];
    cuerpo?: (input: Record<string, unknown>) => string | null;
    rechazado: string;
    ok: (output: ToolPart["output"]) => string;
  }
> = {
  enviar_correo_equipo: {
    titulo: "Correo al equipo",
    aprobar: "Aprobar y enviar",
    campos: (i) => [
      ["Para", i.para],
      ["Asunto", i.asunto],
    ],
    cuerpo: (i) => (typeof i.mensaje === "string" ? i.mensaje : null),
    rechazado: "Rechazaste este correo: no se envió.",
    ok: (o) => {
      const enviados = (o?.enviados as string[] | undefined) ?? [];
      const fallidos = (o?.fallidos as string[] | undefined) ?? [];
      return `${enviados.length ? `✓ Enviado a ${enviados.join(", ")}.` : ""}${fallidos.length ? ` ✕ No se pudo enviar a ${fallidos.join(", ")}.` : ""}`;
    },
  },
  crear_viaje: {
    titulo: "Nuevo viaje o sesión",
    aprobar: "Aprobar y crear",
    nota: () => "Se crea como BORRADOR: no se ve en el sitio hasta que lo abran desde Experiencias.",
    campos: (i) => [
      ["Tipo", TIPO_VIAJE[String(i.tipo)] ?? i.tipo],
      ["Nombre", i.titulo || "(se arma solo)"],
      ["Lugar", [i.ciudad, i.pais].filter(Boolean).join(", ")],
      ["Fechas", i.fecha_inicio === i.fecha_fin ? i.fecha_inicio : `${i.fecha_inicio} → ${i.fecha_fin}`],
      ["Cupo", i.cupo],
      ["Precio", i.precio_usd !== undefined ? `USD ${i.precio_usd}` : null],
      ["Seña", i.sena_usd !== undefined ? `USD ${i.sena_usd}` : null],
    ],
    cuerpo: (i) => (typeof i.descripcion === "string" ? i.descripcion : null),
    rechazado: "Rechazaste crear este viaje: no se creó.",
    ok: () => "✓ Creado como borrador.",
  },
  crear_testimonio: {
    titulo: "Nuevo testimonio",
    aprobar: "Aprobar y cargar",
    nota: () => "Se carga como BORRADOR: no se muestra en el sitio hasta que lo publiquen desde Testimonios.",
    campos: (i) => [
      ["Sección", i.seccion],
      ["Autor", i.autor],
      ["Lugar", i.lugar],
    ],
    cuerpo: (i) => [i.cita, i.relato].filter((t) => typeof t === "string" && t).join("\n\n") || null,
    rechazado: "Rechazaste cargar este testimonio: no se cargó.",
    ok: () => "✓ Cargado como borrador.",
  },
  crear_articulos_desde_testimonios: {
    titulo: "Copiar testimonios a Contenidos",
    aprobar: "Aprobar y copiar",
    nota: () => "Se crean como BORRADOR, categoría Testimonios. El texto se copia completo desde el servidor. Después hay que publicarlos desde Contenidos.",
    campos: (i) => [["Cantidad", Array.isArray(i.ids) ? i.ids.length : null]],
    rechazado: "Rechazaste esta copia: no se creó nada.",
    ok: (o) => {
      const creados = (o?.creados as string[] | undefined) ?? [];
      const salteados = (o?.salteados as string[] | undefined) ?? [];
      const fallidos = (o?.fallidos as string[] | undefined) ?? [];
      return [
        creados.length ? `✓ Creados ${creados.length} borradores: ${creados.join(", ")}.` : "",
        salteados.length ? `Salteados: ${salteados.join(", ")}.` : "",
        fallidos.length ? `✕ Fallaron: ${fallidos.join(" · ")}.` : "",
      ]
        .filter(Boolean)
        .join(" ");
    },
  },
  crear_articulo: {
    titulo: "Nuevo artículo",
    aprobar: "Aprobar y crear",
    nota: (i) =>
      i.estado === "published"
        ? "Se PUBLICA ya en el sitio."
        : "Se crea como borrador: no se ve hasta que lo publiquen desde Contenidos.",
    campos: (i) => [
      ["Título", i.titulo],
      ["Categoría", i.categoria],
      ["Acceso", ACCESO[String(i.acceso ?? "publico")] ?? i.acceso],
      ["Extracto", i.extracto],
    ],
    cuerpo: (i) => (typeof i.texto === "string" ? i.texto : null),
    rechazado: "Rechazaste crear este artículo: no se creó.",
    ok: () => "✓ Creado.",
  },
};

export function esHerramientaDeEscritura(type: string) {
  return type.replace(/^tool-/, "") in TARJETAS;
}

export function ApprovalCard({
  part,
  onRespond,
}: {
  part: ToolPart;
  onRespond: (id: string, approved: boolean) => void;
}) {
  const cfg = TARJETAS[part.type.replace(/^tool-/, "")];
  const [expandido, setExpandido] = useState(false);
  if (!cfg) return null;

  const input = part.input ?? {};
  const cuerpo = cfg.cuerpo?.(input) ?? null;
  const largo = (cuerpo?.length ?? 0) > 420;
  const nota = cfg.nota?.(input);

  return (
    <div className="space-y-2 rounded-xl border border-primary-fixed-dim/40 bg-surface-container/40 p-3 text-xs">
      <p className="font-semibold text-on-surface">{cfg.titulo}</p>
      {nota && <p className="rounded-md bg-primary-container/10 px-2 py-1 text-primary-fixed-dim">{nota}</p>}
      {part.approval?.requestReason && (
        <p className="rounded-md bg-black/10 px-2 py-1 text-on-surface">{part.approval.requestReason}</p>
      )}

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {cfg.campos(input)
          .filter(([, v]) => v !== undefined && v !== null && v !== "")
          .map(([label, value]) => (
            <Fragment key={label}>
              <dt className="text-on-surface-variant">{label}</dt>
              <dd className="text-on-surface">{String(value)}</dd>
            </Fragment>
          ))}
      </dl>

      {cuerpo && (
        <div>
          <p className="whitespace-pre-wrap rounded-lg bg-black/10 p-2 text-on-surface">
            {largo && !expandido ? `${cuerpo.slice(0, 420)}…` : cuerpo}
          </p>
          {largo && (
            <button
              type="button"
              onClick={() => setExpandido((v) => !v)}
              className="mt-1 text-primary-fixed-dim hover:underline"
            >
              {expandido ? "Ver menos" : "Ver el texto completo"}
            </button>
          )}
        </div>
      )}

      {part.state === "approval-requested" && part.approval && (
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => onRespond(part.approval!.id, true)}
            className="rounded-lg bg-primary-container px-3 py-1.5 font-semibold text-on-primary transition-colors hover:bg-primary-fixed"
          >
            {cfg.aprobar}
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
      {part.state === "approval-responded" && <p className="text-on-surface-variant">Procesando…</p>}
      {part.state === "output-denied" && <p className="text-on-surface-variant">{cfg.rechazado}</p>}
      {part.state === "output-available" &&
        (part.output?.error ? (
          <p className="text-error">{part.output.error}</p>
        ) : (
          <p className="text-on-surface-variant">
            {cfg.ok(part.output)}
            {part.output?.editar_en && (
              <>
                {" "}
                <Link href={part.output.editar_en} className="text-primary-fixed-dim underline">
                  Completarlo en el panel
                </Link>
              </>
            )}
          </p>
        ))}
    </div>
  );
}

// ---------- Historial ----------

type Fila = { id: string; title: string; page: string | null; updated_at: string };

/**
 * Las conversaciones de esta persona (RLS: solo las suyas), leidas desde el
 * browser. Retomar una carga sus mensajes tal cual quedaron.
 */
export function HistoryMenu({
  currentId,
  onLoad,
  onDeleted,
}: {
  currentId: string;
  onLoad: (id: string, messages: UIMessage[]) => void;
  onDeleted: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Fila[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    createClient()
      .from("ai_conversations")
      .select("id, title, page, updated_at")
      .order("updated_at", { ascending: false })
      .limit(30)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) setError("No se pudo cargar el historial.");
        else {
          setError(null);
          setRows(data);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function load(id: string) {
    const { data, error: err } = await createClient().from("ai_conversations").select("messages").eq("id", id).single();
    if (err || !data) return setError("No se pudo abrir esa conversación.");
    onLoad(id, data.messages as unknown as UIMessage[]);
    setOpen(false);
  }

  async function remove(id: string) {
    const { error: err } = await createClient().from("ai_conversations").delete().eq("id", id);
    if (err) return setError("No se pudo borrar.");
    setRows((prev) => prev?.filter((r) => r.id !== id) ?? prev);
    onDeleted(id);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-on-surface-variant transition-colors hover:text-on-surface"
      >
        <History size={12} aria-hidden /> Historial
      </button>

      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 max-h-72 w-[min(20rem,80vw)] overflow-y-auto rounded-xl border border-outline-variant/60 bg-surface-container-low p-1.5 shadow-xl shadow-black/40">
          {error && <p className="px-2 py-1.5 text-xs text-error">{error}</p>}
          {rows === null && !error && <p className="px-2 py-1.5 text-xs text-on-surface-variant">Cargando…</p>}
          {rows?.length === 0 && <p className="px-2 py-1.5 text-xs text-on-surface-variant">Todavía no hay conversaciones guardadas.</p>}
          {rows?.map((r) => (
            <div
              key={r.id}
              className={`group flex items-center gap-1 rounded-lg ${r.id === currentId ? "bg-primary-container/10" : "hover:bg-primary-container/5"}`}
            >
              <button type="button" onClick={() => load(r.id)} className="min-w-0 flex-1 px-2.5 py-2 text-left">
                <span className="block truncate text-xs text-on-surface">{r.title}</span>
                <span className="block text-[11px] text-on-surface-variant">
                  {new Date(r.updated_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </button>
              <button
                type="button"
                onClick={() => remove(r.id)}
                aria-label={`Borrar la conversación "${r.title}"`}
                className="rounded-md p-1.5 text-on-surface-variant/70 hover:text-error"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
