-- Se descarta el editor de bloques de "Envio material" (29/10): los 2
-- documentos que habia y sus 6 imagenes se borraron a mano. La tabla queda
-- solo con el HTML subido, que pasa a ser obligatorio.
alter table public.materiales
  drop column blocks,
  drop column eyebrow,
  drop column cover_url,
  drop column back_cover_url,
  alter column html set not null;

-- Ya no hace falta filtrar por `html is not null`.
create or replace function public.shared_material(p_token text)
returns table (title text, html text)
language sql stable security definer set search_path = ''
as $$
  select m.title, m.html
  from public.materiales m
  where p_token is not null and m.share_token = p_token;
$$;
