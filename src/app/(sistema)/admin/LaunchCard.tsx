"use client";

import { useActionState, useState } from "react";
import { Rocket } from "lucide-react";
import { setSiteLaunched, type LaunchState } from "./launch-actions";

/**
 * El botón de la salida oficial. `launched` viene del servidor; el cambio tarda
 * hasta ~10 segundos en verse en el dominio (cache del proxy).
 */
export function LaunchCard({
  launched,
  maintenanceEnabled,
}: {
  launched: boolean;
  /** `MAINTENANCE_MODE=on`: si no, el dominio ya está abierto y no hay nada que activar. */
  maintenanceEnabled: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState<LaunchState>(
    async () => {
      const next = await setSiteLaunched(!launched);
      if (!next.error) setConfirming(false);
      return next;
    },
    { error: null }
  );

  const live = launched || !maintenanceEnabled;

  return (
    <section
      className={`rounded-2xl p-6 mb-8 border ${
        live
          ? "glass-card border-primary-fixed-dim/30"
          : "bg-primary-container/10 border-primary-container/60"
      }`}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.05em] text-on-surface-variant mb-1">
            Salida oficial
          </p>
          <h2 className="font-display text-2xl text-primary-fixed-dim mb-2">
            {live ? "El sitio está publicado" : "El sitio todavía no está publicado"}
          </h2>
          <p className="text-sm text-on-surface-variant max-w-xl">
            {live
              ? "Cualquier persona que entre a cosmiceaglejourney.com ve el sitio completo."
              : "Quien entra a cosmiceaglejourney.com ve la pantalla “Evolucionando hacia nuestra mejor versión”. Al activar la salida, el sitio completo queda visible para todos."}
          </p>
        </div>

        {maintenanceEnabled &&
          (confirming ? (
            <form action={action} className="flex flex-col gap-3 md:items-end shrink-0">
              <p className="text-sm text-on-surface md:text-right max-w-xs">
                {launched
                  ? "¿Volver a mostrar la pantalla de construcción?"
                  : "¿Publicar el sitio ahora? Se ve en un par de segundos."}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={pending}
                  className="px-5 py-2.5 rounded-lg text-sm text-on-surface-variant border border-outline-variant hover:text-on-surface transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary-container text-[#05125A] hover:brightness-105 disabled:opacity-60 transition"
                >
                  {pending ? "Un momento…" : launched ? "Sí, ocultar" : "Sí, publicar"}
                </button>
              </div>
            </form>
          ) : launched ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="shrink-0 px-5 py-2.5 rounded-lg text-sm text-on-surface-variant border border-outline-variant hover:text-on-surface transition-colors"
            >
              Volver a construcción
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-7 py-4 rounded-lg text-base font-semibold bg-primary-container text-[#05125A] hover:brightness-105 transition"
            >
              <Rocket size={20} aria-hidden />
              Activar salida oficial
            </button>
          ))}
      </div>

      {state.error && (
        <p role="alert" className="mt-4 text-sm text-error">
          {state.error}
        </p>
      )}
    </section>
  );
}
