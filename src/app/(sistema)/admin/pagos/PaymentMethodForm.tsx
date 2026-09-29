"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import type { PaymentMethodState } from "./actions";
import { deletePaymentMethod } from "./actions";

type Values = {
  label: string;
  audience: string | null;
  instructions: string;
  currency: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
};

const FIELD =
  "w-full rounded-lg border border-outline bg-surface-container px-4 py-2.5 text-on-surface outline-none focus:border-primary-fixed-dim";

/**
 * Alta y edicion de un riel de cobro. El mismo formulario para los dos casos:
 * el server action ya viene atado con el id cuando es edicion.
 *
 * El boton de borrar va en un `<form>` aparte y no adentro de este: dos submit
 * en el mismo formulario obligarian a mirar cual apreto la clienta.
 */
export function PaymentMethodForm({
  action,
  values,
  submitLabel,
  id,
}: {
  action: (
    state: PaymentMethodState,
    formData: FormData
  ) => Promise<PaymentMethodState>;
  values?: Values;
  submitLabel: string;
  id?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <div className="glass-card rounded-2xl p-6">
      <form action={formAction} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-on-surface-variant">
              Nombre del medio de pago
            </label>
            <input
              name="label"
              required
              defaultValue={values?.label ?? ""}
              placeholder="Transferencia en euros"
              className={FIELD}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-on-surface-variant">
              ¿Para quién es?
            </label>
            <input
              name="audience"
              defaultValue={values?.audience ?? ""}
              placeholder="Si estás en Europa o Estados Unidos"
              className={FIELD}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-on-surface-variant">
            Instrucciones y datos
          </label>
          <textarea
            name="instructions"
            rows={7}
            required
            defaultValue={values?.instructions ?? ""}
            placeholder={"Titular: ...\nIBAN: ...\nBIC: ...\nConcepto: tu nombre y el nombre del viaje"}
            className={`${FIELD} font-mono text-sm`}
          />
          <p className="mt-1.5 text-xs text-on-surface-variant">
            Se muestra tal cual, respetando los saltos de línea. Esto es lo único
            que ve quien va a pagar, así que conviene que diga también qué poner
            en el concepto.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm text-on-surface-variant">
              Moneda
            </label>
            <input
              name="currency"
              defaultValue={values?.currency ?? ""}
              placeholder="EUR"
              className={FIELD}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm text-on-surface-variant">
              Link de pago (opcional)
            </label>
            <input
              name="link_url"
              type="url"
              defaultValue={values?.link_url ?? ""}
              placeholder="https://..."
              className={FIELD}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div>
            <label className="mb-1.5 block text-sm text-on-surface-variant">
              Orden
            </label>
            <input
              name="sort_order"
              type="number"
              defaultValue={values?.sort_order ?? 0}
              className={`${FIELD} w-24`}
            />
          </div>

          <label className="flex items-center gap-2.5 pt-6 text-sm text-on-surface">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={values?.is_active ?? false}
              className="h-4 w-4 accent-[color:var(--color-primary-container)]"
            />
            Mostrárselo a los viajeros
          </label>
        </div>

        {state.error && (
          <p className="text-sm text-error" role="alert">
            {state.error}
          </p>
        )}
        {state.ok && !state.error && (
          <p className="text-sm text-primary-fixed-dim">Guardado.</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary-container px-5 py-2.5 font-medium tracking-[0.02em] text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-60"
        >
          {pending ? "Guardando..." : submitLabel}
        </button>
      </form>

      {id && (
        <form action={deletePaymentMethod.bind(null, id)} className="mt-5 border-t border-outline-variant/40 pt-4">
          <button
            type="submit"
            className="inline-flex items-center gap-2 text-sm text-on-surface-variant transition-colors hover:text-error"
          >
            <Trash2 size={15} />
            Eliminar este medio de pago
          </button>
        </form>
      )}
    </div>
  );
}
