-- Tercer nivel en las FAQs: el grupo dentro de cada juego.
--
-- Sale del diseno aprobado que mando Sofia el 04/09 (el chip verde
-- "Sobre la experiencia" arriba de las preguntas) y del texto que mando el
-- mismo dia: los dos juegos vienen partidos en cuatro grupos cada uno
-- ("La experiencia", "Preparacion", "Salud y seguridad", "Integracion y
-- confidencialidad"), y en Viajes uno de ellos es distinto ("Viaje y
-- logistica").
--
-- Es texto libre y NO un enum: los grupos no coinciden entre los dos juegos,
-- son un titulo de seccion y no una taxonomia, y si ella agrega uno no deberia
-- necesitar una migracion. Nulo = la pregunta va suelta, sin chip.
alter table public.faqs
  add column group_label text,
  add constraint faqs_group_label_not_blank
    check (group_label is null or btrim(group_label) <> '');

comment on column public.faqs.group_label is
  'Titulo del grupo dentro del juego (el chip verde del diseno del 04/09). Texto libre, nulo = sin grupo.';

-- El orden de lectura es: juego -> grupo -> orden manual. Reemplaza al indice
-- anterior, que no conocia el grupo.
drop index if exists public.faqs_placement_idx;
create index faqs_placement_idx
  on public.faqs (placement, is_published, group_label, sort_order, created_at);

-- La columna nueva tiene que entrar en los grants por columna, o el panel no la
-- puede escribir: `authenticated` no tiene insert/update a nivel tabla.
grant insert (group_label), update (group_label) on public.faqs to authenticated;
