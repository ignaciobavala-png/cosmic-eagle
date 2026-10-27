"use client";

import { useState, useTransition } from "react";
import { ARTICLE_CATEGORY_LIST } from "@/lib/article";
import { setArticleCategory } from "./actions";

/**
 * Cambia la categoría de un contenido desde el listado, sin abrir el editor:
 * sirve para reubicar uno que quedó en el tema equivocado. Guarda al elegir.
 */
export function CategorySelect({
  id,
  value,
}: {
  id: string;
  value: string;
}) {
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(value);
  const [failed, setFailed] = useState(false);

  function change(next: string) {
    const previous = current;
    setCurrent(next);
    setFailed(false);
    startTransition(async () => {
      const result = await setArticleCategory(id, next);
      if (result.error) {
        setCurrent(previous);
        setFailed(true);
      }
    });
  }

  return (
    <div>
      <select
        aria-label="Categoría"
        value={current}
        disabled={pending}
        onChange={(e) => change(e.target.value)}
        className="rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 py-1.5 text-sm text-on-surface disabled:opacity-50"
      >
        {ARTICLE_CATEGORY_LIST.map((category) => (
          <option key={category.value} value={category.value}>
            {category.label}
          </option>
        ))}
      </select>
      {failed && (
        <p className="mt-1 text-xs text-error">No se pudo cambiar.</p>
      )}
    </div>
  );
}
