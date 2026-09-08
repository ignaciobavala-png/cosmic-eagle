-- Niveles de acceso a la biblioteca de contenidos (docs/BIBLIOTECA.md §1.4).
--
-- Pedido de la organizacion (08/09/2026): que el panel pueda habilitar a los
-- inscriptos a un viaje a ver la documentacion, que exista un codigo de acceso,
-- y que en /contenidos se pueda elegir que ve una persona sin sesion.
--
-- Tres piezas:
--   articles.access_level   que nivel pide cada texto
--   content_grants          a quien se le habilito, quien lo habilito y hasta cuando
--   access_codes            los codigos, uno por viaje/tanda
--
-- DECISIONES QUE NO HAY QUE "SIMPLIFICAR"
--
-- 1. **Canjear un codigo no es una forma de entrar.** El canje exige sesion y
--    lo unico que hace es escribir una fila en `content_grants` para esa cuenta.
--    Concilia el modal dorado de Julia (video del 02/09) con la recomendacion de
--    Sofia (§3 del doc: el acceso se gestiona desde la cuenta, "evita que
--    circulen links sueltos"). Un codigo que fuera login alternativo no se
--    puede revocar ni limitar, y anula la marca de agua personalizada de §1.6.
--
-- 2. **El gate vive en la RLS, no en la pagina.** Es el mismo criterio con el
--    que `articles` filtra los borradores desde el 18/08: si el filtro lo hace
--    cada ruta, la primera ruta nueva que se olvide filtra el texto entero.
--
-- 3. **Pero las portadas de lo bloqueado SI son publicas**: §1.4 pide que quien
--    no tiene acceso vea las cinco categorias y las portadas, y el video de
--    Julia muestra candados, no ausencia. Eso no se puede hacer con una sola
--    policy —o la fila sale o no sale—, y por eso existe la vista
--    `articles_public`, que expone metadatos SIN el cuerpo.

-- ---------------------------------------------------------------------------
-- 1. La escala
-- ---------------------------------------------------------------------------
--
-- **El orden de declaracion es el orden de comparacion**: Postgres ordena un
-- enum por como se declaro, asi que `publico < miembros < programa` y las
-- policies pueden escribir `access_level <= private.content_level()`. Si algun
-- dia se suma un nivel, va en su lugar de la escala (`add value ... before`),
-- no al final.

create type public.content_access_level as enum ('publico', 'miembros', 'programa');

comment on type public.content_access_level is
  'Escala de acceso a contenidos: publico (sin sesion) < miembros (con cuenta) < programa (habilitado por el equipo o por codigo).';

-- ---------------------------------------------------------------------------
-- 2. El nivel de cada texto
-- ---------------------------------------------------------------------------
--
-- El default es `miembros` y no `publico` a proposito: un articulo cargado sin
-- pensar en el nivel queda dentro del muro, no afuera. Equivocarse hacia
-- adentro se corrige con un click; hacia afuera es contenido del programa
-- publicado sin querer.

alter table public.articles
  add column access_level public.content_access_level not null default 'miembros';

-- Los dos ensayos que ya estan publicados (Preparacion e Integracion) son
-- justamente los "textos generales de muestra" de §1.4: quedan publicos.
update public.articles set access_level = 'publico' where category = 'preparacion';

-- Una columna nueva no se puede escribir desde el panel si no entra en los
-- grants por columna (paso con `faqs.group_label` el 04/09).
grant insert (access_level), update (access_level) on public.articles to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Los codigos
-- ---------------------------------------------------------------------------
--
-- Uno por viaje o por tanda, no uno por persona (decision de Ignacio, 08/09):
-- Estela genera el codigo de la experiencia y se lo pasa al grupo. El control
-- no lo da el secreto del codigo sino el tope de usos, el vencimiento y el
-- boton de desactivar.
--
-- `trip_id` es informativo: dice de que viaje salio el codigo para poder
-- desactivarlo cuando el grupo termino. NO condiciona nada — un codigo no exige
-- estar inscripto a ese viaje, porque tambien se usa para gente que ceremonio
-- por fuera de la plataforma (los recurrentes de Google Forms).

create table public.access_codes (
  id uuid primary key default gen_random_uuid(),

  -- Se guarda normalizado en mayusculas y sin espacios; el canje normaliza
  -- igual antes de comparar, asi que quien lo escribe puede tipearlo como
  -- quiera. El CHECK es la ultima linea de defensa.
  code text not null unique,
  -- Que nivel otorga. `publico` no tiene sentido en un codigo: no habilita nada.
  level public.content_access_level not null default 'programa',
  -- Para el panel: "Viaje a Tulum, noviembre 2026".
  label text,
  trip_id uuid references public.trips (id) on delete set null,

  -- Nulo = sin tope. El uso se cuenta por las filas de `content_grants` que
  -- apuntan a este codigo, no con un contador denormalizado que se desincroniza.
  max_uses integer,
  expires_at timestamptz,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,

  constraint access_codes_code_format check (code ~ '^[A-Z0-9][A-Z0-9-]{3,31}$'),
  constraint access_codes_level_not_public check (level <> 'publico'),
  constraint access_codes_max_uses_positive check (max_uses is null or max_uses > 0)
);

alter table public.access_codes enable row level security;

-- **Nadie que no sea admin lee esta tabla.** Poder listarla es poder canjear
-- cualquier codigo. El canje no la lee: lo hace `redeem_access_code`, que corre
-- como definer y solo devuelve si el codigo sirve o no.
create policy access_codes_admin_all on public.access_codes
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

revoke all on public.access_codes from anon;
revoke insert, update on public.access_codes from authenticated;
grant insert (code, level, label, trip_id, max_uses, expires_at, is_active)
  on public.access_codes to authenticated;
grant update (code, level, label, trip_id, max_uses, expires_at, is_active)
  on public.access_codes to authenticated;

create or replace function private.stamp_access_code()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.code := upper(btrim(new.code));

  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
  end if;

  return new;
end;
$$;

create trigger access_codes_stamp
  before insert or update on public.access_codes
  for each row
  execute function private.stamp_access_code();

-- ---------------------------------------------------------------------------
-- 4. Las habilitaciones
-- ---------------------------------------------------------------------------
--
-- Una fila por habilitacion, y se revoca marcando `revoked_at` en vez de
-- borrarla: quien habilito a quien y cuando es justamente lo que hay que poder
-- mirar despues. Por eso tampoco es una columna en `profiles`.

create table public.content_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  level public.content_access_level not null default 'programa',

  -- De donde salio. Un canje deja el codigo apuntado para poder revocar de una
  -- todo lo que entro con un codigo filtrado.
  access_code_id uuid references public.access_codes (id) on delete set null,
  -- Nota del equipo: "ceremonio con Estela en 2024, fuera de la plataforma".
  note text,

  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz,
  revoked_at timestamptz,

  constraint content_grants_level_not_public check (level <> 'publico')
);

-- La consulta caliente es "que niveles vigentes tiene esta persona", y corre en
-- cada lectura de un articulo.
create index content_grants_user_idx
  on public.content_grants (user_id, level desc)
  where revoked_at is null;

alter table public.content_grants enable row level security;

create policy content_grants_select_own on public.content_grants
  for select
  to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()));

create policy content_grants_admin_write on public.content_grants
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

revoke all on public.content_grants from anon;
-- Nadie se auto-habilita: el insert del panel lo hace el admin y el del canje
-- lo hace la funcion definer de abajo. `granted_by` y `granted_at` los sella el
-- trigger, asi que no entran en el grant ni para el admin.
revoke insert, update, delete on public.content_grants from authenticated;
grant insert (user_id, level, note, expires_at) on public.content_grants to authenticated;
grant update (note, expires_at, revoked_at) on public.content_grants to authenticated;

create or replace function private.stamp_content_grant()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.granted_at := now();
    new.granted_by := coalesce(new.granted_by, auth.uid());
  end if;

  return new;
end;
$$;

create trigger content_grants_stamp
  before insert or update on public.content_grants
  for each row
  execute function private.stamp_content_grant();

-- ---------------------------------------------------------------------------
-- 5. El nivel efectivo de quien esta mirando
-- ---------------------------------------------------------------------------
--
-- Definer por lo mismo que `is_admin()`: la policy de `articles` la evalua
-- tambien `anon`, que no tiene ningun grant sobre `content_grants`.
--
-- Sin sesion: `publico`. Con sesion: `miembros` (§1.4 — "persona con cuenta:
-- la biblioteca completa"), y sube a `programa` con una habilitacion vigente.
-- El admin ve todo, o no podria revisar lo que publica.

create or replace function private.content_level()
returns public.content_access_level
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  uid uuid := (select auth.uid());
  granted public.content_access_level;
begin
  if uid is null then
    return 'publico';
  end if;

  if (select private.is_admin()) then
    return 'programa';
  end if;

  -- `max()` no existe para enums; el orden del enum si, asi que alcanza con
  -- ordenar descendente y tomar la primera.
  select g.level into granted
    from public.content_grants g
   where g.user_id = uid
     and g.revoked_at is null
     and (g.expires_at is null or g.expires_at > now())
   order by g.level desc
   limit 1;

  return coalesce(granted, 'miembros');
end;
$$;

revoke execute on function private.content_level() from public;
grant execute on function private.content_level() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. El muro, en la policy
-- ---------------------------------------------------------------------------

drop policy articles_select_published on public.articles;

create policy articles_select_published on public.articles
  for select
  to anon, authenticated
  using (
    status = 'published'
    and access_level <= (select private.content_level())
  );

-- ---------------------------------------------------------------------------
-- 7. La vista de portadas
-- ---------------------------------------------------------------------------
--
-- Metadatos de TODO lo publicado, con el nivel que pide cada texto, para poder
-- dibujar la tarjeta con candado. **No expone `body`**, que es lo unico que el
-- muro protege de verdad.
--
-- Es `security_invoker = false` (corre como su dueño y no evalua la RLS de
-- `articles`) a proposito, igual que `my_applications`. El advisor `lint 0010`
-- la va a marcar por eso.
--
-- OJO: una vista definer tambien ESCRIBE como su dueño, asi que solo se otorga
-- SELECT. Sin ese cuidado seria un puente para escribir `articles` sin RLS.

create view public.articles_public
with (security_invoker = false) as
select
  a.id,
  a.slug,
  a.title,
  a.excerpt,
  a.cover_url,
  a.category,
  a.access_level,
  a.published_at
from public.articles a
where a.status = 'published';

revoke all on public.articles_public from anon, authenticated;
grant select on public.articles_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. El canje
-- ---------------------------------------------------------------------------
--
-- Definer porque quien canjea no tiene —ni tiene que tener— SELECT sobre
-- `access_codes` ni INSERT sobre `content_grants`.
--
-- Devuelve un texto con el resultado en vez de lanzar: la pantalla necesita
-- distinguir "no existe" de "vencido" para poder decir algo util, y un
-- `raise` obligaria a parsear el mensaje de error.

create or replace function public.redeem_access_code(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  c public.access_codes%rowtype;
  used integer;
begin
  if uid is null then
    return 'sin_sesion';
  end if;

  select * into c
    from public.access_codes
   where code = upper(btrim(p_code));

  -- Un codigo desactivado responde igual que uno inexistente: decir "existe
  -- pero esta cerrado" le confirma a quien prueba codigos que acerto uno.
  if not found or not c.is_active then
    return 'invalido';
  end if;

  if c.expires_at is not null and c.expires_at <= now() then
    return 'vencido';
  end if;

  select count(*) into used
    from public.content_grants g
   where g.access_code_id = c.id
     and g.revoked_at is null;

  -- Quien ya lo canjeo no consume un uso nuevo ni recibe un aviso de error.
  if exists (
    select 1 from public.content_grants g
     where g.access_code_id = c.id
       and g.user_id = uid
       and g.revoked_at is null
  ) then
    return 'ok';
  end if;

  if c.max_uses is not null and used >= c.max_uses then
    return 'agotado';
  end if;

  insert into public.content_grants (user_id, level, access_code_id, note, expires_at, granted_by)
  values (uid, c.level, c.id, 'Canje del codigo ' || c.code, c.expires_at, c.created_by);

  return 'ok';
end;
$$;

revoke execute on function public.redeem_access_code(text) from public, anon;
grant execute on function public.redeem_access_code(text) to authenticated;
