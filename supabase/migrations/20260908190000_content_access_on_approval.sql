-- La habilitacion a los contenidos sale sola de la aprobacion.
--
-- Correccion del mismo dia a 20260908160000: el panel pedia elegir nivel y
-- escribir una nota para habilitar a alguien, y ese formulario **no se va a
-- llenar**. El dato ya lo tiene el sistema — quien esta inscripto a un viaje es
-- quien tiene una solicitud aprobada, que es la decision que Estela ya toma en
-- /admin/solicitudes.
--
-- La decision de "siempre a mano" (08/09) NO se revierte: lo que sigue siendo a
-- mano es **aprobar**. Lo que se elimina es el segundo paso, que repetia una
-- decision ya tomada.
--
-- **El umbral es la aprobacion, no el pago.** Quien fue aceptada necesita el
-- material de preparacion ANTES de viajar: es justamente lo que promete el
-- correo [6]. Si algun dia se quiere mover al pago, es el `if` de abajo.

alter table public.content_grants
  add column application_id uuid references public.applications (id) on delete set null;

-- Una habilitacion por solicitud. El indice es lo que hace idempotente al
-- trigger: sin el, cada ida y vuelta de estado agregaria una fila.
create unique index content_grants_application_idx
  on public.content_grants (application_id)
  where application_id is not null;

grant insert (application_id) on public.content_grants to authenticated;

-- Definer: la fila la escribe el trigger, no quien hace el update. Asi funciona
-- por cualquier camino (panel, SQL, un backfill) sin depender de quien corre.
create or replace function private.grant_content_on_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'approved'
     and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    -- `do nothing` y no `do update`: si la habilitacion se revoco a mano, la
    -- decision de Estela gana. Volver a pasar por "aprobada" no la resucita.
    insert into public.content_grants (user_id, level, application_id, note, granted_by)
    values (new.user_id, 'programa', new.id, 'Solicitud aprobada', new.reviewed_by)
    on conflict (application_id) where application_id is not null do nothing;
  end if;

  return new;
end;
$$;

revoke execute on function private.grant_content_on_approval() from public, anon, authenticated;

create trigger applications_grant_content
  after insert or update of status on public.applications
  for each row
  execute function private.grant_content_on_approval();

-- Las solicitudes ya aprobadas antes de este cambio. En produccion no habia
-- ninguna (verificado antes de correrlo), pero la base de otra persona si.
insert into public.content_grants (user_id, level, application_id, note, granted_by)
select a.user_id, 'programa', a.id, 'Solicitud aprobada', a.reviewed_by
  from public.applications a
 where a.status = 'approved'
on conflict (application_id) where application_id is not null do nothing;
