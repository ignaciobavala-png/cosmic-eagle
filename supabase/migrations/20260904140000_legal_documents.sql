-- Privacidad y Terminos de Servicio: los dos documentos legales, editables
-- desde /admin/legales.
--
-- Por que ahora: los dos eran links APAGADOS en el footer (ver FOOTER_COLUMNS
-- en src/lib/constants.ts). Y el de Privacidad ya no es solo un hueco de
-- navegacion: el embudo pide datos de salud —tres preguntas en el filtro corto
-- y un formulario extenso despues del pago— y no habia ninguna pagina que
-- explique que se hace con eso. Pedir un diagnostico psiquiatrico sin decir
-- quien lo va a leer es el problema, no el link roto.
--
-- ─── Por que NO es como `faqs`, `articles` ni `testimonials` ────────────────
--
-- En esas tres la CANTIDAD la decide la clienta, asi que el panel crea y borra
-- filas. Aca la cantidad la decide el CODIGO: hay exactamente dos documentos
-- porque hay exactamente dos rutas (/privacidad y /terminos). Es el criterio de
-- `site_content` —el codigo declara que existe, la tabla guarda el contenido—,
-- y por eso:
--
--   * el `slug` es la clave primaria, y son los dos que siembra esta migracion;
--   * `authenticated` NO tiene insert ni delete, ni siquiera siendo admin. Un
--     documento nuevo es una ruta nueva, o sea codigo y migracion. Sin esto, la
--     clienta podria borrar /privacidad desde el panel y dejar 404 el link del
--     footer, que es justo lo que esto viene a arreglar.
--
-- ─── Por que no hay borrador ni despublicado ────────────────────────────────
--
-- Una pregunta frecuente despublicada desaparece y no pasa nada. Un aviso de
-- privacidad despublicado deja al sitio pidiendo datos de salud sin decir que
-- hace con ellos. Estos documentos estan siempre publicados; lo que se marca es
-- otra cosa: si el texto ya paso por revision legal (`is_provisional`).

create table public.legal_documents (
  -- Coincide con el segmento de la URL publica. Los dos que existen los siembra
  -- esta migracion; agregar uno es codigo + migracion, no una fila desde el panel.
  slug text primary key,
  title text not null,
  -- Texto plano con las mismas reglas que el cuerpo de `articles`, y se renderiza
  -- con el mismo `ArticleBody`: `## ` titulo, `### ` subtitulo, `- ` lista,
  -- `> ` cita, linea en blanco = parrafo. Nada de HTML del formulario: no hay
  -- sanitizador en el proyecto y seria un XSS almacenado.
  body text not null,
  -- El texto sembrado es un BORRADOR nuestro, no un documento revisado por
  -- alguien que sepa de leyes. Mientras esto sea true la pagina publica lo dice
  -- en un aviso arriba de todo. Lo destilda la organizacion cuando aprueba el
  -- texto final — de ahi que sea `default true`.
  is_provisional boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint legal_documents_slug_format check (slug ~ '^[a-z][a-z0-9-]{1,40}$'),
  constraint legal_documents_title_not_blank check (btrim(title) <> ''),
  constraint legal_documents_body_not_blank check (btrim(body) <> '')
);

alter table public.legal_documents enable row level security;

-- Publico y sin filtro: son documentos que tienen que poder leerse SIEMPRE, con
-- o sin sesion, y no hay estado despublicado que esconder.
create policy legal_documents_select_public on public.legal_documents
  for select
  to anon, authenticated
  using (true);

create policy legal_documents_update_admin on public.legal_documents
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Grants por columna. El `revoke` a nivel tabla va PRIMERO: sin eso el grant por
-- columna no hace nada — Postgres avisa por WARNING y sigue
-- (ver 20260731210000_fix_profiles_is_admin_grant.sql).
--
-- Ojo: el revoke alcanza tambien al admin, que es `authenticated` como todos.
-- Se le devuelve solo lo editable; `slug` queda inmutable a proposito (es la
-- URL publica y el link del footer) y `updated_by` no se puede falsear.
revoke insert, update, delete on public.legal_documents from anon, authenticated;
grant update (title, body, is_provisional) on public.legal_documents to authenticated;

create or replace function private.touch_legal_document()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $fn$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$fn$;

create trigger legal_documents_touch
  before insert or update on public.legal_documents
  for each row
  execute function private.touch_legal_document();
