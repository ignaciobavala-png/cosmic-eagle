"use client";

import { useTransition } from "react";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

const buttonClass =
  "text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors disabled:opacity-50";

export function MarkReadButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => markNotificationRead(id))}
      className={buttonClass}
    >
      {pending ? "Marcando…" : "Marcar leída"}
    </button>
  );
}

export function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => markAllNotificationsRead())}
      className={`${buttonClass} underline`}
    >
      {pending ? "Marcando…" : "Marcar todas como leídas"}
    </button>
  );
}
