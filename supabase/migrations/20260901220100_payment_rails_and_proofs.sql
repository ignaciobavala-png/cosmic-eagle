-- El escalón del pago sube a la plataforma. Sigue sin haber pasarela.
--
-- Contexto (2026-09-01, charla de Ignacio con Sofía; ver docs/PAGOS.md):
-- el cobro se hace por transferencia y por tarjeta fuera de la web, y Estela
-- confirma A MANO mirando el comprobante, igual que en la tiquetera de Manso
-- Club. Eso no es un provisorio a la espera de la pasarela: es el mecanismo.
-- Lo que hoy pasa por WhatsApp —"te paso los datos", "acá va el comprobante"—
-- es lo que entra acá.
--
-- Tres piezas:
--   payment_methods   los rieles de cobro, editables desde /admin/pagos
--   payment_proofs    los comprobantes que sube el postulante
--   bucket comprobantes  PRIVADO, a diferencia de los otros tres del proyecto
--
-- Lo que NO entra: la integración con Encuadrado, la moneda por viaje y la
-- elección automática del riel según procedencia. Está todo en el plan y
-- depende de respuestas de Sofía que no tenemos.

-- ---------------------------------------------------------------------------
-- 1. Los rieles de cobro
-- ---------------------------------------------------------------------------
--
-- Por qué una tabla y no slots de `site_content`, que ya existe y ya tiene
-- panel: los datos bancarios reales (IBAN, titular, RUT) son de personas, y
-- `site_content` se lee con el cliente público, o sea que `anon` puede
-- listarla. Acá el SELECT arranca en `authenticated`. Es la misma razón por la
-- que esos números no están en el repo (docs/PAGOS.md).
--
-- `instructions` es texto libre y multilínea a propósito: los rieles no tienen
-- la misma forma (un IBAN + BIC no se parece a una cuenta vista chilena ni a un
-- link de tarjeta), y modelar campos por riel obliga a una migración cada vez
-- que aparece uno nuevo.

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),

  -- Lo que lee el viajero: "Transferencia en euros (Santander)".
  label text not null,
  -- A quién le toca: "Si estás en Europa o Estados Unidos". Es una guía, no un
  -- filtro — la web todavía no sabe de dónde es la persona (no hay país en
  -- `applications`), así que se muestran todos los rieles activos y elige ella.
  audience text,
  instructions text not null,
  -- Informativa: se imprime al lado del monto. No convierte nada.
  currency text,
  -- Para un riel que se paga por link (Encuadrado, cuando exista). Vacío en los
  -- rieles de transferencia.
  link_url text,

  sort_order integer not null default 0,
  is_active boolean not null default false,

  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

alter table public.payment_methods enable row level security;

create policy payment_methods_admin_all on public.payment_methods
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- `anon` no tiene nada que hacer acá: sin sesión no hay pago que instruir.
revoke all on public.payment_methods from anon;

-- Cualquier persona con sesión ve los rieles activos. La pantalla de estado los
-- muestra sólo a quien tiene la solicitud aprobada, pero eso es UI: acotarlo en
-- la policy exigiría un definer más (leer `applications`) para proteger un dato
-- que de todos modos hay que entregarle a quien va a pagar.
create policy payment_methods_select_active on public.payment_methods
  for select
  to authenticated
  using (is_active);

create or replace function private.touch_payment_method()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger payment_methods_touch
  before insert or update on public.payment_methods
  for each row
  execute function private.touch_payment_method();

-- Los dos rieles que hay hoy, INACTIVOS y sin datos: los números reales los
-- carga Estela desde el panel y no viajan en el repo. Quedan sembrados para que
-- la pantalla exista y para no tener que adivinar la forma más adelante.
insert into public.payment_methods (label, audience, instructions, currency, sort_order, is_active)
values
  (
    'Transferencia en euros',
    'Si estás en Europa o Estados Unidos',
    'Completar los datos desde el panel (Pagos).',
    'EUR',
    1,
    false
  ),
  (
    'Pago con tarjeta',
    'Desde cualquier país, con recargo por comisión',
    'Completar los datos desde el panel (Pagos).',
    'USD',
    2,
    false
  );

-- ---------------------------------------------------------------------------
-- 2. El comprobante
-- ---------------------------------------------------------------------------
--
-- Tabla hija y no columnas en `applications`, por dos razones:
--
--   a) La misma de la migración de dos etapas: cada aporte del postulante es un
--      INSERT nuevo. Con columnas haría falta abrirle UPDATE sobre la fila que
--      guarda sus respuestas del filtro, que hoy son inmutables para todos.
--   b) Son varios por solicitud, no uno: el flyer promete seña del 50% y saldo.
--      Una fila por comprobante deja el historial sin inventar campos.
--
-- La fila NO guarda monto ni fecha de pago declarados. Lo que vale es lo que
-- Estela ve en el banco; pedirle al viajero que tipee el monto sólo agrega un
-- dato que hay que desconfiar. `note` es texto libre por si quiere aclarar algo
-- ("primera mitad", "transferí desde la cuenta de mi hermano").

create table public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null
    references public.applications (id) on delete cascade,
  -- Ruta dentro del bucket `comprobantes`, NO una URL: el bucket es privado y
  -- el link se firma en el momento de mostrarlo.
  storage_path text not null,
  note text,
  created_at timestamptz not null default now()
);

create index payment_proofs_application_id_idx
  on public.payment_proofs (application_id);

alter table public.payment_proofs enable row level security;

create policy payment_proofs_admin_all on public.payment_proofs
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Mismo gate que la etapa 2: sólo sobre una solicitud propia y ya aprobada.
-- Antes de aprobar no hay nada que pagar, así que tampoco hay comprobante.
create policy payment_proofs_insert_own on public.payment_proofs
  for insert
  to authenticated
  with check (private.owns_approved_application(application_id));

-- Un comprobante no se edita: se sube otro. El delete queda para el admin, que
-- es lo único que la RLS deja pasar.
revoke update on public.payment_proofs from authenticated;
revoke all on public.payment_proofs from anon;

-- ---------------------------------------------------------------------------
-- 3. El bucket, privado
-- ---------------------------------------------------------------------------
--
-- Los otros tres buckets del proyecto son públicos porque sirven imágenes de la
-- web. Un comprobante bancario no: lleva nombre, número de cuenta y a veces el
-- saldo de quien transfiere. Público significa "cualquiera con la URL lo abre",
-- y esas URLs son adivinables si se conoce el id. De ahí `public = false` y
-- links firmados desde el servidor.
--
-- PDF entra en los tipos permitidos: la mitad de los comprobantes de banco son
-- PDF. En un bucket privado no se puede servir inline a un anónimo, que es lo
-- que hacía peligroso admitir formatos ricos en los buckets públicos (por eso
-- ahí quedó afuera el SVG).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comprobantes',
  'comprobantes',
  false,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf']
)
on conflict (id) do nothing;

-- Convención de ruta: {user_id}/{application_id}/{archivo}. El primer segmento
-- es lo que chequea la policy, así no hace falta leer `applications` desde
-- storage. Que la solicitud esté aprobada lo valida la tabla, que es donde se
-- registra el comprobante: un archivo suelto sin fila no lo ve nadie.
create policy comprobantes_insert_own on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'comprobantes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy comprobantes_select_own on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'comprobantes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy comprobantes_admin_read on storage.objects
  for select
  to authenticated
  using (bucket_id = 'comprobantes' and (select private.is_admin()));

create policy comprobantes_admin_delete on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'comprobantes' and (select private.is_admin()));

-- ---------------------------------------------------------------------------
-- 4. La vista de estado suma el comprobante
-- ---------------------------------------------------------------------------
--
-- `create or replace view` sólo deja AGREGAR columnas al final, así que las dos
-- nuevas van al final aunque queden lejos de `payment_status`.
create or replace view public.my_applications
with (security_invoker = false)
as
select
  a.id,
  a.trip_id,
  a.status,
  a.payment_status,
  a.previous_ceremonies = 0 as is_first_time,
  exists (
    select 1 from public.health_form_first_time h where h.application_id = a.id
  ) as health_form_submitted,
  exists (
    select 1 from public.consents c where c.application_id = a.id
  ) as consent_submitted,
  a.created_at,
  a.reviewed_at,
  exists (
    select 1 from public.payment_proofs p where p.application_id = a.id
  ) as payment_proof_submitted,
  (
    select max(p.created_at) from public.payment_proofs p where p.application_id = a.id
  ) as payment_proof_at
from public.applications a
where a.user_id = (select auth.uid());

-- ---------------------------------------------------------------------------
-- 5. Aviso al panel
-- ---------------------------------------------------------------------------
--
-- Es un trigger y no código del server action por lo de siempre: quien inserta
-- el comprobante es el postulante, y no puede escribir en `admin_notifications`.
--
-- Este aviso es el que reemplaza al "te mando el comprobante por WhatsApp":
-- mientras no haya pasarela, es la única señal de que hay algo que verificar.
create or replace function private.notify_payment_proof()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  app record;
  trip_title text;
begin
  select a.full_name, a.trip_id into app
  from public.applications a
  where a.id = new.application_id;

  select t.title into trip_title
  from public.trips t
  where t.id = app.trip_id;

  insert into public.admin_notifications (
    kind, title, body, href, trip_id, application_id
  )
  values (
    'payment_proof'::public.admin_notification_kind,
    app.full_name || ' subió un comprobante de pago de ' || coalesce(trip_title, 'un viaje'),
    coalesce(nullif(new.note, '') || '. ', '')
      || 'Verificá el pago y marcalo desde la solicitud.',
    '/admin/solicitudes/' || new.application_id,
    app.trip_id,
    new.application_id
  );

  return null;
end;
$$;

revoke execute on function private.notify_payment_proof() from public, anon, authenticated;

create trigger payment_proofs_notify
  after insert on public.payment_proofs
  for each row
  execute function private.notify_payment_proof();
