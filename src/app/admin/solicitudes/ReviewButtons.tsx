"use client";

import { useTransition } from "react";
import { reviewApplication, type ApplicationTable } from "./actions";
import type { Enums } from "@/lib/supabase/types";

const OPTIONS: { status: Enums<"application_status">; label: string; className: string }[] = [
  {
    status: "approved",
    label: "Aprobar",
    className: "bg-secondary/20 text-secondary border-secondary/40 hover:bg-secondary/30",
  },
  {
    status: "rejected",
    label: "Rechazar",
    className: "bg-error/20 text-error border-error/40 hover:bg-error/30",
  },
  {
    status: "expired",
    label: "Marcar como expirada",
    className: "bg-outline-variant/30 text-on-surface-variant border-outline/40 hover:bg-outline-variant/50",
  },
];

export function ReviewButtons({
  table,
  id,
  currentStatus,
}: {
  table: ApplicationTable;
  id: string;
  currentStatus: Enums<"application_status">;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-3">
      {OPTIONS.filter((opt) => opt.status !== currentStatus).map((opt) => (
        <button
          key={opt.status}
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await reviewApplication(table, id, opt.status);
            })
          }
          className={`px-4 py-2.5 rounded-lg text-sm font-medium tracking-[0.02em] border transition-colors disabled:opacity-60 ${opt.className}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
