import { createClient } from "@/lib/supabase/server";
import { PaymentMethodForm } from "./PaymentMethodForm";
import { createPaymentMethod, savePaymentMethod } from "./actions";

/**
 * Los medios de cobro que se le muestran a quien ya tiene la solicitud
 * aprobada, en la pantalla de estado y en el mail.
 *
 * Esta seccion existe porque los datos bancarios NO pueden vivir en el repo
 * (docs/PAGOS.md): son cuentas de personas reales y el repo esta en GitHub. La
 * migracion siembra los dos rieles vacios e inactivos; los numeros los carga
 * Estela desde acá.
 */
export default async function AdminPagosPage() {
  const supabase = await createClient();

  const { data: methods } = await supabase
    .from("payment_methods")
    .select("*")
    .order("sort_order", { ascending: true });

  const activos = methods?.filter((m) => m.is_active).length ?? 0;

  return (
    <div>
      <h1 className="mb-3 font-display text-2xl text-primary-fixed-dim sm:text-3xl">
        Pagos
      </h1>

      <p className="mb-3 max-w-2xl text-sm text-on-surface-variant">
        Los datos que ve una persona cuando su solicitud queda aprobada. Se
        muestran todos los que estén marcados como visibles y elige ella el que
        le sirva, así que conviene que cada uno diga a quién le corresponde.
      </p>
      <p className="mb-8 max-w-2xl text-sm text-on-surface-variant">
        El pago sigue confirmándose a mano: cuando suba el comprobante te va a
        llegar un aviso, y desde la solicitud lo marcás como pagado.
      </p>

      {activos === 0 && (
        <div className="glass-card mb-8 rounded-xl border-error/40 px-5 py-4">
          <p className="text-sm font-medium text-error">
            Ahora mismo no hay ningún medio de pago visible. A quien apruebes le
            va a decir que le vas a escribir con los datos, en vez de mostrárselos.
          </p>
        </div>
      )}

      <div className="max-w-2xl space-y-8">
        {methods?.map((method) => (
          <PaymentMethodForm
            key={method.id}
            id={method.id}
            action={savePaymentMethod.bind(null, method.id)}
            values={method}
            submitLabel="Guardar cambios"
          />
        ))}

        <div>
          <h2 className="mb-3 font-display text-xl text-primary-fixed-dim">
            Agregar otro medio de pago
          </h2>
          <PaymentMethodForm action={createPaymentMethod} submitLabel="Agregar" />
        </div>
      </div>
    </div>
  );
}
