import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  EXPERIENCE_LEVELS,
  GENDER_LABELS,
  RELATIONSHIP_STATES,
  filterContacts,
  type Contact,
  MAX_RECIPIENTS,
} from "@/lib/crm";
import { loadContacts } from "@/lib/crm-data";
import { GENDERS } from "@/app/[locale]/cuenta/profile-fields";
import { CopyEmails } from "../suscriptores/CopyEmails";
import { DeleteContactButton } from "./DeleteContactButton";
import { SendEmailPanel } from "./SendEmailPanel";

// El envío de correos segmentados es una server action que se queda esperando
// ~600 ms por mail; sin esto Vercel la corta a los pocos segundos.
export const maxDuration = 60;

/**
 * CRM — primera version. Ver docs/CRM.md.
 *
 * No hay tabla de CRM: la tabla se arma en memoria cruzando `profiles` con las
 * dos tablas de solicitudes. Es viable porque el universo son las personas
 * registradas y hoy son decenas; si esto crece a miles hay que mover el cruce a
 * una vista con `security_invoker = true` (la RLS de applications_* ya deja leer
 * solo a admin, asi que la vista no abre nada nuevo).
 *
 * Ejes de filtro: estado, experiencia (nivel), pais, genero y viaje. El cargo
 * (healer, lider, influencer) no tiene de donde salir todavia. Desde el 14/10 el
 * grupo filtrado se puede eliminar de a uno y recibir un correo (SendEmailPanel).
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
  return new Date(iso).toLocaleDateString("es-CL", {
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
  searchParams: Promise<{
    estado?: string;
    nivel?: string;
    pais?: string;
    genero?: string;
    viaje?: string;
  }>;
}) {
  // Ya awaiteado: `query` y no `params` para no confundirlo con el params de la ruta.
  const query = await searchParams;
  const supabase = await createClient();

  const [contacts, { data: trips }] = await Promise.all([
    loadContacts(supabase),
    supabase.from("trips").select("id, title").order("start_date", { ascending: false }),
  ]);

  function countBy(predicate: (c: Contact) => boolean) {
    return contacts.filter(predicate).length;
  }

  const countries = [
    ...new Set(contacts.map((c) => c.country).filter((c): c is string => !!c)),
  ].sort();

  const activeState = query.estado ?? null;
  const activeLevel = query.nivel ?? null;
  const activeCountry = query.pais ?? null;
  const activeGender = query.genero ?? null;
  const activeTrip = query.viaje ?? null;

  const filtered = filterContacts(contacts, query);

  // Cómo se nombra el grupo en el redactor y en la confirmación.
  const groupParts = [
    activeState && RELATIONSHIP_STATES.find((s) => s.value === activeState)?.label,
    activeLevel && EXPERIENCE_LEVELS.find((l) => l.value === activeLevel)?.label,
    activeCountry,
    activeGender && GENDER_LABELS[activeGender as keyof typeof GENDER_LABELS],
    activeTrip && trips?.find((t) => t.id === activeTrip)?.title,
  ].filter(Boolean);
  const groupLabel = groupParts.length ? groupParts.join(" · ") : "todas las personas registradas";

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
        <FilterRow
          label="Género"
          param="genero"
          active={activeGender}
          current={query}
          options={GENDERS.map((g) => ({
            value: g,
            label: GENDER_LABELS[g],
            count: countBy((c) => c.gender === g),
          }))}
        />
        {trips && trips.length > 0 && (
          <FilterRow
            label="Viaje"
            param="viaje"
            active={activeTrip}
            current={query}
            options={trips
              .map((trip) => ({
                value: trip.id,
                label: trip.title,
                count: countBy((c) => c.tripIds.includes(trip.id)),
              }))
              .filter((opt) => opt.count > 0)}
          />
        )}
      </div>

      <div className="mb-8">
        <SendEmailPanel
          key={groupLabel}
          filters={query}
          count={filtered.filter((c) => c.email && !c.isAdmin).length}
          max={MAX_RECIPIENTS}
          groupLabel={groupLabel}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-on-surface-variant">
          No hay contactos que coincidan con este filtro.
        </p>
      ) : (
        <div className="glass-card overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[60rem] text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-left text-on-surface-variant">
                <th className="px-5 py-3 font-medium">Persona</th>
                <th className="px-5 py-3 font-medium">País</th>
                <th className="px-5 py-3 font-medium">Género</th>
                <th className="px-5 py-3 font-medium">Experiencia</th>
                <th className="px-5 py-3 font-medium">Ceremonias</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Registro</th>
                <th className="px-5 py-3 font-medium sr-only">Ficha</th>
                <th className="px-5 py-3 font-medium sr-only">Eliminar</th>
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
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-outline/40 font-display text-sm text-on-surface-variant"
                      >
                        {(contact.fullName?.trim()?.[0] ?? contact.email?.[0] ?? "?").toUpperCase()}
                      </span>
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
                    {GENDER_LABELS[contact.gender as keyof typeof GENDER_LABELS] ?? "—"}
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
                  <td className="px-5 py-4 text-right">
                    {!contact.isAdmin && (
                      <DeleteContactButton
                        id={contact.id}
                        name={contact.fullName ?? contact.email ?? "esta persona"}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs text-on-surface-variant/70">
        Los umbrales de Avanzado y Experto son provisorios. País y género los
        completa cada persona en su perfil; mientras no lo hizo, el país sale de
        su última solicitud. El cargo (healer, líder, influencer) todavía no se
        registra en ningún lado — ver docs/CRM.md.
      </p>
    </div>
  );
}
