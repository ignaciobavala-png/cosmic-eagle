"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { TemplateDef } from "@/lib/email/templates";
import { renderEmailPreview, saveEmailCopy, type SaveCopyState } from "../actions";

const fieldClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary-fixed-dim focus:outline-none";

export function EmailEditor({
  def,
  overrides,
  previews,
}: {
  def: TemplateDef;
  overrides: Record<string, string>;
  previews: { id: string; titulo: string }[];
}) {
  const initial = Object.fromEntries(
    def.fields.map((f) => [f.key, overrides[f.key] ?? f.default])
  );
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [saved, setSaved] = useState<Record<string, string>>(initial);
  const [previewId, setPreviewId] = useState(previews[0]?.id ?? "");
  const [html, setHtml] = useState("");
  const [result, setResult] = useState<SaveCopyState | null>(null);
  const [pending, startTransition] = useTransition();
  const lastFocus = useRef<{ key: string; el: HTMLInputElement | HTMLTextAreaElement } | null>(
    null
  );

  const dirty = def.fields.some((f) => values[f.key] !== saved[f.key]);

  // Vista previa con lo que se está escribiendo, un instante después de dejar de tipear.
  useEffect(() => {
    if (!previewId) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const out = await renderEmailPreview(previewId, values);
      if (!cancelled) setHtml(out);
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [previewId, values]);

  function insertVar(name: string) {
    const target = lastFocus.current;
    if (!target) return;
    const { key, el } = target;
    const start = el.selectionStart ?? values[key].length;
    const end = el.selectionEnd ?? start;
    const next = values[key].slice(0, start) + `{${name}}` + values[key].slice(end);
    setValues((v) => ({ ...v, [key]: next }));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + name.length + 2;
      el.setSelectionRange(pos, pos);
    });
  }

  function save() {
    setResult(null);
    startTransition(async () => {
      const res = await saveEmailCopy(def.key, values);
      setResult(res);
      if (res.ok) setSaved(values);
    });
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,34rem)]">
      <div>
        <div className="glass-card mb-6 rounded-2xl p-5">
          <p className="text-sm text-on-surface">
            Datos que se completan solos. Toca uno para ponerlo donde esté el cursor:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {def.vars.map((v) => (
              <button
                key={v.name}
                type="button"
                title={`${v.label}. Ejemplo: ${v.sample}`}
                onClick={() => insertVar(v.name)}
                className="rounded-full border border-primary-fixed-dim/40 px-3 py-1 text-xs text-primary-fixed-dim hover:bg-primary-container/20"
              >
                {`{${v.name}}`}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-on-surface-variant">
            Para poner algo en <strong>negrita</strong> escríbelo entre dobles
            asteriscos: <code>**así**</code>. Los saltos de línea se respetan.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {def.fields.map((f) => {
            const changed = values[f.key] !== f.default;
            return (
              <div key={f.key}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <label htmlFor={`f-${f.key}`} className="text-sm font-medium text-on-surface">
                    {f.label}
                    {changed && (
                      <span className="ml-2 text-[10px] uppercase tracking-widest text-primary-fixed-dim">
                        editado
                      </span>
                    )}
                  </label>
                  {changed && (
                    <button
                      type="button"
                      onClick={() => setValues((v) => ({ ...v, [f.key]: f.default }))}
                      className="text-xs text-on-surface-variant hover:text-on-surface"
                    >
                      Restaurar
                    </button>
                  )}
                </div>
                {f.hint && <p className="mb-1 text-xs text-on-surface-variant">{f.hint}</p>}
                {f.multiline ? (
                  <textarea
                    id={`f-${f.key}`}
                    value={values[f.key]}
                    rows={4}
                    maxLength={4000}
                    onFocus={(e) => (lastFocus.current = { key: f.key, el: e.currentTarget })}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className={fieldClass}
                  />
                ) : (
                  <input
                    id={`f-${f.key}`}
                    value={values[f.key]}
                    maxLength={300}
                    onFocus={(e) => (lastFocus.current = { key: f.key, el: e.currentTarget })}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className={fieldClass}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-4 border-t border-outline-variant bg-surface/90 py-4 backdrop-blur">
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="rounded-lg bg-primary-container px-5 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-40"
          >
            {pending ? "Guardando…" : "Guardar cambios"}
          </button>
          {dirty && !pending && (
            <span className="text-xs text-on-surface-variant">Hay cambios sin guardar.</span>
          )}
          {result && (
            <p
              role={result.ok ? "status" : "alert"}
              className={`text-sm ${result.ok ? "text-secondary" : "text-error"}`}
            >
              {result.message}
            </p>
          )}
        </div>
      </div>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg text-on-surface">Vista previa</h2>
          {previews.length > 1 && (
            <select
              value={previewId}
              onChange={(e) => setPreviewId(e.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1 text-xs text-on-surface"
              aria-label="Variante del correo"
            >
              {previews.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titulo}
                </option>
              ))}
            </select>
          )}
        </div>
        <iframe
          title="Vista previa del correo"
          srcDoc={html}
          sandbox=""
          className="h-[44rem] w-full rounded-2xl border border-outline-variant bg-white"
        />
        <p className="mt-2 text-xs text-on-surface-variant">
          Con datos de ejemplo ({def.vars.map((v) => `${v.name}: ${v.sample}`).join(" · ")}).
        </p>
      </aside>
    </div>
  );
}
