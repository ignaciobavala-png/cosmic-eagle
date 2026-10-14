"use client";

import { useTransition } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { moveArticle } from "./actions";

/**
 * Sube o baja un contenido en el orden del sitio. El orden de la tabla del
 * panel es el mismo que ve el público en /contenidos.
 */
export function MoveArticleButtons({
  id,
  isFirst,
  isLast,
}: {
  id: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const button =
    "rounded p-1.5 text-on-surface-variant transition-colors hover:text-primary-fixed-dim disabled:opacity-30 disabled:hover:text-on-surface-variant";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Subir"
        disabled={pending || isFirst}
        onClick={() => startTransition(() => moveArticle(id, "up"))}
        className={button}
      >
        <ArrowUp size={16} />
      </button>
      <button
        type="button"
        aria-label="Bajar"
        disabled={pending || isLast}
        onClick={() => startTransition(() => moveArticle(id, "down"))}
        className={button}
      >
        <ArrowDown size={16} />
      </button>
    </div>
  );
}
