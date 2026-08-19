-- El filtro corto pasa a ser el texto real de Sofía.
--
-- Contexto: docs/consulta-sofia-filtro-corto.txt preguntaba cuáles eran las 3
-- preguntas del paso 3 del flujo, porque no existían en ningún Google Form. El
-- 19/08/2026 Sofía mandó el texto completo: un encuadre + 3 preguntas abiertas.
-- Hasta hoy las columnas eran las del formulario "Viajer@s" (`new_treatment`,
-- `stress_anxiety`), puestas como provisorias.
--
-- Las 3 preguntas, textuales:
--   1. ¿Tienes o has tenido alguna enfermedad grave? (cardíaca, neurológica,
--      epilepsia, hepática, oncológica, autoinmune u otra)
--   2. ¿Estás o has estado en tratamiento psiquiátrico o psicológico? ¿Por qué
--      motivo y hace cuánto?
--   3. ¿Estás en algún tratamiento médico actualmente? ¿Qué medicamentos tomas,
--      con o sin receta? Incluye antidepresivos, ansiolíticos, analgésicos,
--      suplementos y hierbas.
--
-- Lo más importante que resolvió el mensaje NO es el texto: es que el encuadre
-- (adicciones, bipolaridad, depresión severa) es INFORMATIVO, no excluyente --
-- "nada de lo que nos cuentes cierra la puerta de entrada". Así que sigue sin
-- haber ningún rechazo automático: todas las solicitudes las lee Estela. Eso
-- confirma lo que ya hacía el código y cierra la duda de fondo de la consulta.
--
-- Forma: booleano + detalle, igual que el resto del proyecto. Las preguntas son
-- abiertas ("¿por qué motivo y hace cuánto?"), pero el sí/no es lo que le deja
-- al trigger marcar la solicitud como "requiere revisión manual" sin leer prosa.
-- El detalle es obligatorio en la app cuando la respuesta es sí.
--
-- Se reemplazan columnas en vez de agregar porque la tabla sigue en CERO filas.
-- `stress_anxiety` desaparece del filtro (no está en el texto de Sofía y la
-- pregunta 2 la cubre); sigue existiendo en el formulario extenso, que es de
-- donde salía.

alter table public.applications
  drop column new_treatment,
  drop column new_treatment_detail,
  drop column stress_anxiety,
  drop column stress_anxiety_detail;

alter table public.applications
  add column serious_illness boolean not null,
  add column serious_illness_detail text,
  add column mental_health_treatment boolean not null,
  add column mental_health_treatment_detail text,
  add column current_medication boolean not null,
  add column current_medication_detail text;

comment on column public.applications.serious_illness is
  'Pregunta 1 del filtro: enfermedad grave (cardíaca, neurológica, epilepsia, hepática, oncológica, autoinmune u otra).';
comment on column public.applications.mental_health_treatment is
  'Pregunta 2 del filtro: tratamiento psiquiátrico o psicológico, actual o pasado. El detalle lleva motivo y antigüedad.';
comment on column public.applications.current_medication is
  'Pregunta 3 del filtro: tratamiento médico actual. El detalle lleva los medicamentos, con o sin receta, más suplementos y hierbas.';

-- El aviso interno tiene que marcar las tres, no la que ya no existe.
-- Espejo en la UI: `needsManualReview` en admin/solicitudes/[id]/page.tsx.
create or replace function private.notify_new_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  trip_title text;
  flags text[] := '{}';
begin
  select t.title into trip_title
  from public.trips t
  where t.id = new.trip_id;

  if new.serious_illness then flags := flags || 'enfermedad grave'::text; end if;
  if new.mental_health_treatment then flags := flags || 'tratamiento psiquiátrico o psicológico'::text; end if;
  if new.current_medication then flags := flags || 'tratamiento médico en curso'::text; end if;

  insert into public.admin_notifications (
    kind, title, body, href, trip_id, application_id
  )
  values (
    case when array_length(flags, 1) is null
      then 'application_new'::public.admin_notification_kind
      else 'application_health_flag'::public.admin_notification_kind
    end,
    new.full_name || ' se postuló a ' || coalesce(trip_title, 'un viaje'),
    case when array_length(flags, 1) is null
      then 'Solicitud nueva, sin respuestas de salud que marcar.'
      else 'Requiere revisión manual: declara ' || array_to_string(flags, ', ') || '.'
    end,
    '/admin/solicitudes/' || new.id,
    new.trip_id,
    new.id
  );

  return null; -- after trigger: el valor de retorno se ignora
end;
$$;

revoke execute on function private.notify_new_application() from public, anon, authenticated;
