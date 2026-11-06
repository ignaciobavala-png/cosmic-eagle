-- Textos editables de los correos de la app (editor de /admin/correos).
-- Una fila por campo editado; sin fila, el correo sale con el texto por defecto
-- del código (src/lib/email/templates.ts). Los textos no son secretos: los lee
-- cualquier sesión iniciada porque `submitApplication` manda el acuse de recibo
-- con la sesión de la persona que postula. Escribe sólo el admin.
create table public.email_templates (
  template_key text not null,
  field_key text not null,
  value text not null check (length(value) between 1 and 4000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  primary key (template_key, field_key)
);

alter table public.email_templates enable row level security;

create policy email_templates_select on public.email_templates
  for select to authenticated using (true);
create policy email_templates_insert_admin on public.email_templates
  for insert to authenticated with check ((select private.is_admin()));
create policy email_templates_update_admin on public.email_templates
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy email_templates_delete_admin on public.email_templates
  for delete to authenticated using ((select private.is_admin()));
