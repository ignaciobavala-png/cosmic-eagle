-- Testimonios en dos idiomas y con relato completo (29/09).
--
-- Llegaron los testimonios de "Nuestros Sanadores": relatos de 3.000 a 6.000
-- caracteres, en castellano y en inglés. La tarjeta del carrusel sigue
-- mostrando `quote` (la cita corta, tope de 250 en el panel); el relato entero
-- va en `body` y se abre con "Leer testimonio completo". Sin `body`, la
-- tarjeta queda como siempre.
--
-- El inglés sigue el patrón de docs/I18N.md §6: columnas `_en` nulables, y si
-- están vacías la página cae al castellano.

alter table public.testimonials
  add column quote_en text,
  add column author_location_en text,
  add column body text,
  add column body_en text;

-- La trampa del "revoke update": el panel escribe con `authenticated`, y una
-- columna que no está en el grant no se puede escribir aunque la policy deje.
grant insert (quote_en, author_location_en, body, body_en)
  on public.testimonials to authenticated;
grant update (quote_en, author_location_en, body, body_en)
  on public.testimonials to authenticated;
