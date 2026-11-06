import { createClient } from "@/lib/supabase/server";
import { loadContacts } from "@/lib/crm-data";
import { DiscountForm } from "./DiscountForm";
import { DiscountRowActions } from "./DiscountRowActions";

/**
 * Códigos de descuento (06/11/2026). Los crea la organización, los puede asignar
 * a una persona registrada y al postular el formulario pregunta por el código.
 */
export default async function AdminDescuentosPage() {
  const supabase = await createClient();
  const [{ data: codes }, { data: trips }, contacts] = await Promise.all([
    supabase.from("discount_codes").select("*").order("created_at", { ascending: false }),
    supabase.from("trips").select("id, title").order("start_date", { ascending: false }),
    loadContacts(supabase),
  ]);

  const people = contacts
    .filter((c) => !c.isAdmin)
    .map((c) => ({ id: c.id, label: `${c.fullName ?? "Sin nombre"} · ${c.email ?? "sin correo"}` }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const byId = new Map(contacts.map((c) => [c.id, c]));
  const tripById = new Map((trips ?? []).map((t) => [t.id, t.title]));

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl text-primary-fixed-dim sm:text-3xl">Descuentos</h1>
      <p className="mb-8 max-w-2xl text-sm text-on-surface-variant">
        Crea códigos de descuento y, si quieres, asígnalos a una persona en particular. Al
        postular a una experiencia, el formulario pregunta por el código (y si la persona
        tiene uno asignado, se lo ofrece). El descuento queda guardado en su solicitud y
        se resta del total que paga.
      </p>

      <DiscountForm people={people} trips={trips ?? []} />

      <h2 className="mb-3 mt-10 font-display text-lg text-on-surface">Códigos creados</h2>
      {!codes || codes.length === 0 ? (
        <p className="text-sm text-on-surface-variant">Todavía no hay códigos.</p>
      ) : (
        <div className="glass-card overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-left text-on-surface-variant">
                <th className="px-5 py-3 font-medium">Código</th>
                <th className="px-5 py-3 font-medium">Descuento</th>
                <th className="px-5 py-3 font-medium">Asignado a</th>
                <th className="px-5 py-3 font-medium">Válido para</th>
                <th className="px-5 py-3 font-medium">Usos</th>
                <th className="px-5 py-3 font-medium">Vence</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {codes.map((d) => {
                const owner = d.user_id ? byId.get(d.user_id) : null;
                const vencido = d.expires_on && d.expires_on < new Date().toISOString().slice(0, 10);
                const agotado = d.max_uses !== null && d.uses >= d.max_uses;
                return (
                  <tr key={d.id} className="border-b border-outline-variant/40 last:border-0">
                    <td className="px-5 py-4">
                      <p className="font-mono font-medium text-on-surface">{d.code}</p>
                      {d.note && <p className="text-xs text-on-surface-variant">{d.note}</p>}
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant">
                      {d.kind === "percent" ? `${d.value}%` : `${d.value} fijo`}
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant">
                      {d.user_id ? (owner?.fullName ?? owner?.email ?? "Persona eliminada") : "Cualquiera"}
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant">
                      {d.trip_id ? (tripById.get(d.trip_id) ?? "—") : "Todas"}
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant">
                      {d.uses}
                      {d.max_uses !== null ? ` / ${d.max_uses}` : ""}
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant">{d.expires_on ?? "—"}</td>
                    <td className="px-5 py-4 text-xs">
                      {!d.is_active ? "Desactivado" : vencido ? "Vencido" : agotado ? "Agotado" : "Activo"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <DiscountRowActions id={d.id} active={d.is_active} code={d.code} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
