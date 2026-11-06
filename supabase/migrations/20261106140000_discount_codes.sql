-- Códigos de descuento (pedido de la organización, 06/11/2026).
--
-- La organización los crea en /admin/descuentos y los puede asignar a una
-- persona registrada en particular (`user_id`) o dejarlos abiertos a quien tenga
-- el código. Al postular, el formulario pregunta por el código.
--
-- SEGURIDAD: el postulante nunca lee esta tabla (no hay policy de SELECT para él:
-- se podrían enumerar los códigos). Valida y consulta los suyos por dos funciones
-- `security definer`. Y el monto del descuento NO lo manda el navegador: un
-- trigger BEFORE INSERT en `applications` lo recalcula desde la tabla, así que
-- un POST a mano con `discount_amount` inventado se pisa a cero.

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and length(code) between 3 and 30),
  kind text not null check (kind in ('percent', 'amount')),
  value numeric not null check (value > 0),
  -- Persona a la que se asigna. Null = lo puede usar cualquiera que lo tenga.
  user_id uuid references auth.users (id) on delete cascade,
  -- Experiencia a la que aplica. Null = todas.
  trip_id uuid references public.trips (id) on delete cascade,
  max_uses integer check (max_uses is null or max_uses > 0),
  uses integer not null default 0,
  expires_on date,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint discount_percent_range check (kind <> 'percent' or value <= 100)
);

create index discount_codes_user_idx on public.discount_codes (user_id) where user_id is not null;

alter table public.discount_codes enable row level security;

create policy discount_codes_admin_all on public.discount_codes
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter table public.applications
  add column discount_code_id uuid references public.discount_codes (id) on delete set null,
  add column discount_amount numeric not null default 0 check (discount_amount >= 0);

-- Cuánto descuenta un código sobre un precio, y si le sirve a esta persona/viaje.
create or replace function private.discount_amount_for(
  p_code public.discount_codes,
  p_user uuid,
  p_trip uuid,
  p_price numeric
) returns numeric
language plpgsql
stable
set search_path = ''
as $$
begin
  if not p_code.is_active then return null; end if;
  if p_code.expires_on is not null and p_code.expires_on < current_date then return null; end if;
  if p_code.user_id is not null and p_code.user_id is distinct from p_user then return null; end if;
  if p_code.trip_id is not null and p_code.trip_id is distinct from p_trip then return null; end if;
  if p_code.max_uses is not null and p_code.uses >= p_code.max_uses then return null; end if;

  if p_code.kind = 'percent' then
    return round(p_price * p_code.value / 100, 2);
  end if;
  return least(p_code.value, p_price);
end;
$$;

-- Trigger: el descuento se calcula acá, nunca se confía en lo que manda el cliente.
create or replace function private.apply_discount()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code public.discount_codes;
  v_price numeric;
  v_amount numeric;
begin
  if new.discount_code_id is null then
    new.discount_amount := 0;
    return new;
  end if;

  select * into v_code from public.discount_codes where id = new.discount_code_id for update;
  select price into v_price from public.trips where id = new.trip_id;

  v_amount := case when v_code.id is null then null
                   else private.discount_amount_for(v_code, new.user_id, new.trip_id, coalesce(v_price, 0)) end;

  if v_amount is null then
    raise exception 'discount_invalid' using errcode = 'P0001';
  end if;

  new.discount_amount := v_amount;
  update public.discount_codes set uses = uses + 1 where id = v_code.id;
  return new;
end;
$$;

create trigger applications_apply_discount
  before insert on public.applications
  for each row execute function private.apply_discount();

-- El postulante valida el código que tipeó. Devuelve la fila sólo si le sirve.
create or replace function public.check_discount_code(p_code text, p_trip_id uuid)
returns table (id uuid, code text, kind text, value numeric, amount numeric)
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_code public.discount_codes;
  v_price numeric;
  v_amount numeric;
begin
  if auth.uid() is null then return; end if;
  select * into v_code from public.discount_codes where discount_codes.code = upper(trim(p_code));
  if v_code.id is null then return; end if;
  select price into v_price from public.trips where trips.id = p_trip_id;
  v_amount := private.discount_amount_for(v_code, auth.uid(), p_trip_id, coalesce(v_price, 0));
  if v_amount is null then return; end if;
  return query select v_code.id, v_code.code, v_code.kind, v_code.value, v_amount;
end;
$$;

-- Los códigos asignados a la persona que mira (para ofrecérselos en el formulario).
create or replace function public.my_discount_codes(p_trip_id uuid)
returns table (id uuid, code text, kind text, value numeric, amount numeric)
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_price numeric;
begin
  if auth.uid() is null then return; end if;
  select price into v_price from public.trips where trips.id = p_trip_id;
  return query
    select d.id, d.code, d.kind, d.value,
           private.discount_amount_for(d, auth.uid(), p_trip_id, coalesce(v_price, 0))
    from public.discount_codes d
    where d.user_id = auth.uid()
      and private.discount_amount_for(d, auth.uid(), p_trip_id, coalesce(v_price, 0)) is not null;
end;
$$;

revoke all on function public.check_discount_code(text, uuid) from public, anon;
revoke all on function public.my_discount_codes(uuid) from public, anon;
grant execute on function public.check_discount_code(text, uuid) to authenticated;
grant execute on function public.my_discount_codes(uuid) to authenticated;
revoke all on function private.discount_amount_for(public.discount_codes, uuid, uuid, numeric) from public, anon;
revoke all on function private.apply_discount() from public, anon;

-- La persona ve cuánto se le descontó (para el precio final en /cuenta).
create or replace view public.my_applications
with (security_invoker = false)
as
select
  a.id,
  a.trip_id,
  a.status,
  a.payment_status,
  a.previous_ceremonies = 0 as is_first_time,
  exists (select 1 from public.health_form_first_time h where h.application_id = a.id)
    as health_form_submitted,
  exists (select 1 from public.consents c where c.application_id = a.id) as consent_submitted,
  a.created_at,
  a.reviewed_at,
  exists (select 1 from public.payment_proofs p where p.application_id = a.id)
    as payment_proof_submitted,
  (select max(p.created_at) from public.payment_proofs p where p.application_id = a.id)
    as payment_proof_at,
  a.amount_paid,
  a.discount_amount
from public.applications a
where a.user_id = (select auth.uid());

-- La vista es de SOLO LECTURA (ver 20260902190000).
revoke insert, update, delete, truncate, references, trigger
  on public.my_applications from anon, authenticated;
revoke select on public.my_applications from anon;
grant select on public.my_applications to authenticated;
