import Link from "next/link";
import { CircleUser } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  EXPERIENCE_LEVELS,
  RELATIONSHIP_STATES,
  buildContacts,
  type Contact,
} from "@/lib/crm";
import { CopyEmails } from "../suscriptores/CopyEmails";

/**
 * CRM — primera version. Ver docs/CRM.md.
 *
 * No hay tabla de CRM: la tabla se arma en memoria cruzando `profiles` con las
 * dos tablas de solicitudes. Es viable porque el universo son las personas
 * registradas y hoy son decenas; si esto crece a miles hay que mover el cruce a
 * una vista con `security_invoker = true` (la RLS de applications_* ya deja leer
 * solo a admin, asi que la vista no abre nada nuevo).
 *
 * De los cuatro ejes que pidio la clienta solo estan los dos calculables:
 * experiencia y geografia. Genero y cargo no tienen de donde salir todavia.
 */

const STATE_CLASS: Record<string, string> = {
  viajero:
    "bg-secondary/20 text-secondary border-secondary/40",
  solicitante:
    "bg-primary-container/20 text-primary-fixed-dim border-primary-fixed-dim/40",
  potencial:
    "bg-outline-variant/30 text-on-surface-variant border-outline/40",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function FilterRow({
  label,
  options,
  param,
  active,
  current,
}: {
  label: string;
  options: { value: string; label: string; count: number }[];
  param: string;
  active: string | null;
  current: Record<string, string | undefined>;
}) {
  function hrefFor(value: string | null) {
    const next = new URLSearchParams();
    for (const [key, val] of Object.entries(current)) {
      if (val && key !== param) next.set(key, val);
    }
    if (value) next.set(param, value);
    const qs = next.toString();
    return qs ? `/admin/crm?${qs}` : "/admin/crm";
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-widest text-on-surface-variant/70 w-24 shrink-0">
        {label}
      </span>
      <Link
        href={hrefFor(null)}
        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
          active === null
            ? "border-primary-fixed-dim bg-primary-container/20 text-primary-fixed-dim"
            : "border-outline/40 text-on-surface-variant hover:text-on-surface"
        }`}
      >
        Todos
      </Link>
      {options.map((opt) => (
        <Link
          key={opt.value}
          href={hrefFor(opt.value)}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            active === opt.value
              ? "border-primary-fixed-dim bg-primary-container/20 text-primary-fixed-dim"
              : "border-outline/40 text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {opt.label}
          <span className="ml-1.5 opacity-60">{opt.count}</span>
        </Link>
      ))}
    </div>
  );
}

export default async function AdminCrmPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; nivel?: string; pais?: string }>;
}) {
  // Ya awaiteado: `query` y no `params` para no confundirlo con el params de la ruta.
  const query = await searchParams;
  const supabase = await createClient();

  const [{ data: profiles }, { data: applications }, { data: healthForms }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, is_admin, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("applications")
        .select("user_id, status, previous_ceremonies, created_at"),
      supabase
        .from("health_form_first_time")
        .select("country, created_at, applications(user_id)"),
    ]);

  const contacts = buildContacts({
    profiles: profiles ?? [],
    applications: applications ?? [],
    // El pais cuelga del formulario extenso; se aplana el join acá para que
    // `buildContacts` no dependa de la forma que devuelve PostgREST.
    healthForms: (healthForms ?? []).flatMap((h) =>
      h.applications
        ? [
            {
              user_id: h.applications.user_id,
              country: h.country,
              created_at: h.created_at,
            },
          ]
        : []
    ),
  });

  function countBy(predicate: (c: Contact) => boolean) {
    return contacts.filter(predicate).length;
  }

  const countries = [
    ...new Set(contacts.map((c) => c.country).filter((c): c is string => !!c)),
  ].sort();

  const activeState = query.estado ?? null;
  const activeLevel = query.nivel ?? null;
  const activeCountry = query.pais ?? null;

  const filtered = contacts.filter(
    (c) =>
      (!activeState || c.state === activeState) &&
      (!activeLevel || c.experience === activeLevel) &&
      (!activeCountry || c.country === activeCountry)
  );

  const emails = filtered
    .map((c) => c.email)
    .filter((e): e is string => !!e);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl sm:text-3xl text-primary-fixed-dim">
          CRM
        </h1>
        {emails.length > 0 && <CopyEmails emails={emails} />}
      </div>
      <p className="mb-8 text-sm text-on-surface-variant">
        Las {contacts.length} personas registradas, con su nivel de experiencia y
        su estado calculados a partir del historial de solicitudes.
      </p>

      <div className="glass-card mb-8 flex flex-col gap-3 rounded-2xl p-5">
        <FilterRow
          label="Estado"
          param="estado"
          active={activeState}
          current={query}
          options={RELATIONSHIP_STATES.map((s) => ({
            value: s.value,
            label: s.label,
            count: countBy((c) => c.state === s.value),
          }))}
        />
        <FilterRow
          label="Experiencia"
          param="nivel"
          active={activeLevel}
          current={query}
          options={EXPERIENCE_LEVELS.map((l) => ({
            value: l.value,
            label: l.label,
            count: countBy((c) => c.experience === l.value),
          }))}
        />
        {countries.length > 0 && (
          <FilterRow
            label="País"
            param="pais"
            active={activeCountry}
            current={query}
            options={countries.map((country) => ({
              value: country,
              label: country,
              count: countBy((c) => c.country === country),
            }))}
          />
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-on-surface-variant">
          No hay contactos que coincidan con este filtro.
        </p>
      ) : (
        <div className="glass-card overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[54rem] text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-left text-on-surface-variant">
                <th className="px-5 py-3 font-medium">Persona</th>
                <th className="px-5 py-3 font-medium">País</th>
                <th className="px-5 py-3 font-medium">Experiencia</th>
                <th className="px-5 py-3 font-medium">Ceremonias</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Registro</th>
                <th className="px-5 py-3 font-medium sr-only">Ficha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => (
                <tr
                  key={contact.id}
                  className="border-b border-outline-variant/40 last:border-0"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {contact.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={contact.avatarUrl}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <CircleUser
                          size={32}
                          className="shrink-0 text-on-surface-variant/50"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-on-surface">
                          {contact.fullName ?? "Sin nombre"}
                          {contact.isAdmin && (
                            <span className="ml-2 text-[10px] uppercase tracking-widest text-primary-fixed-dim">
                              admin
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-on-surface-variant">
                          {contact.email ?? "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant">
                    {contact.country ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant">
                    {EXPERIENCE_LEVELS.find(
                      (l) => l.value === contact.experience
                    )?.label ?? contact.experience}
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant">
                    {contact.ceremonies}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                        STATE_CLASS[contact.state] ?? ""
                      }`}
                    >
                      {RELATIONSHIP_STATES.find(
                        (s) => s.value === contact.state
                      )?.label ?? contact.state}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant">
                    {formatDate(contact.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/crm/${contact.id}`}
                      className="whitespace-nowrap text-xs text-on-surface-variant transition-colors hover:text-primary-fixed-dim"
                    >
                      Ficha de salud →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs text-on-surface-variant/70">
        Los umbrales de Avanzado y Experto son provisorios y el país solo lo
        tienen quienes completaron el formulario de primera vez. Género y cargo
        (healer, líder, influencer) todavía no se registran en ningún lado — ver
        docs/CRM.md.
      </p>
    </div>
  );
}
