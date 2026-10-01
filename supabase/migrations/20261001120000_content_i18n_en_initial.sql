-- Traducción inicial al inglés de todo el contenido de la base (01/10).
--
-- Llena las columnas `_en` y las filas `<key>.en` de site_content que creó
-- 20260930140000_content_i18n_en_columns. Lo pidió Ignacio: la clienta no
-- quiere cargar el inglés a mano. Traducción de Claude; lo sensible (salud,
-- dosis) conviene que lo lea alguien.
--
-- **Nunca pisa**: cada valor se escribe sólo si el inglés está vacío, así que
-- correrla de nuevo, o después de que Sofía corrigió algo, no cambia nada.
--
-- **Quedan afuera los legales** (`legal_documents`): son de la clienta, tienen
-- los cuatro corchetes sin definir y tratan datos de salud; en /en siguen
-- saliendo en castellano hasta que alguien los revise.

-- ── Textos de /admin/multimedia ──────────────────────────────────────────
-- El inglés de un slot es la fila `<key>.en`. Van también los slots que la
-- clienta nunca editó (su castellano sale del `fallback` del repo): sin fila
-- `.en` salían en castellano en /en. `on conflict do nothing`: si ya cargaron
-- un inglés a mano, no se pisa. `nosotros.hero.title` ("Cosmic Eagle
-- Journey") y `calendario.hero.title` ("_") no llevan traducción.
insert into public.site_content (key, value) values
  ('home.frase.left.en', $en$A journey toward human evolution$en$),
  ('home.frase.right.en', $en$and the wisdom of the soul.$en$),
  ('home.atmos.text.en', $en$We help you connect with your essential self.$en$),
  ('nosotros.hero.subtitle.en', $en$Beyond personal transformation$en$),
  ('nosotros.frase.en', $en$Human transformation$en$),
  ('nosotros.cierre.title.en', $en$A journey toward the
Human of Light$en$),
  ('contenidos.hero.title.en', $en$Content$en$),
  ('contenidos.hero.subtitle.en', $en$The texts you will find here are created to help you deepen your process, support integration and move forward on your path from certain fundamental foundations. Everyone who takes part in our activities is required to review the available content.$en$),
  ('calendario.hero.subtitle.en', $en$All open dates, at a glance.$en$),
  ('faqs.hero.title.en', $en$Frequently asked questions$en$),
  ('faqs.hero.subtitle.en', $en$What people usually ask us before setting out on the journey.$en$)
on conflict (key) do nothing;

-- ── Experiencias ─────────────────────────────────────────────────────────
-- Por el texto en castellano y no por id: el mismo título o descripción se
-- repite en varias fechas. `venue_type` ("Centro Tribu & Alma") es un nombre
-- propio y queda igual.
update public.trips t set title_en = coalesce(nullif(t.title_en, ''), m.en)
from (values
  ($es$Sesión en Santiago$es$, $en$Session in Santiago$en$),
  ($es$Sesión en Tulum$es$, $en$Session in Tulum$en$),
  ($es$Retiro en Los Vilos$es$, $en$Retreat in Los Vilos$en$),
  ($es$Retiro en Tulum$es$, $en$Retreat in Tulum$en$),
  ($es$5 de Diciembre 2026$es$, $en$December 5, 2026$en$),
  ($es$6 de Diciembre 2026$es$, $en$December 6, 2026$en$)
) as m(es, en)
where t.title = m.es;

update public.trips set description_en = coalesce(nullif(description_en, ''), $en$Immersed in a powerful natural setting, and together with a select group of travelers, we set out on a journey into the deepest structures and codes that shape our reality.

A week to expand your understanding of who and what we are, explore the nature of reality and of the Matrix, reconnect with your most intimate ancestral self and bring this knowledge into your human experience, expanding your ability to perceive, create and navigate reality.$en$)
where description like 'Inmersos en un entorno natural poderoso%';

update public.trips set terms_en = coalesce(nullif(terms_en, ''), $en$Registration requires an approved health form. 50% when booking and 50% up to 15 days before. The booking payment is non-refundable. No refunds within the 10 days before the gathering.$en$)
where terms = 'Inscripciones con formulario de salud aprobado. 50% al reservar y 50% hasta 15 días antes. El pago de reserva no es reembolsable. Sin devoluciones dentro de los 10 días previos al encuentro.';

-- Programa: cada item del `schedule` suma `activity_en` si no lo tiene.
update public.trips t set schedule = (
  select jsonb_agg(
    case
      when coalesce(item->>'activity_en', '') = '' and m.en is not null
        then item || jsonb_build_object('activity_en', m.en)
      else item
    end
    order by ord
  )
  from jsonb_array_elements(t.schedule) with ordinality as s(item, ord)
  left join (values
    ($es$Llegada al lugar$es$, $en$Arrival at the venue$en$),
    ($es$Introducción y técnicas de vuelo$es$, $en$Introduction and flight techniques$en$),
    ($es$Inicio del viaje$es$, $en$Journey begins$en$),
    ($es$Aterrizaje$es$, $en$Landing$en$),
    ($es$Integración y comida$es$, $en$Integration and meal$en$),
    ($es$Fin del encuentro$es$, $en$End of the gathering$en$)
  ) as m(es, en) on m.es = item->>'activity'
)
where jsonb_typeof(t.schedule) = 'array' and jsonb_array_length(t.schedule) > 0;

-- ── Medios de pago ───────────────────────────────────────────────────────
-- Las instrucciones tienen datos bancarios: se traducen sólo las etiquetas
-- sobre el texto que ya está en la base, para no copiar esos datos al repo.
update public.payment_methods p set
  label_en = coalesce(nullif(p.label_en, ''), m.label_en),
  audience_en = coalesce(nullif(p.audience_en, ''), m.audience_en)
from (values
  ($es$Transferencia bancaria en euros$es$, $en$Bank transfer in euros$en$, $en$If you are in Europe or the United States$en$),
  ($es$Transferencia a Mercado Pago$es$, $en$Transfer to Mercado Pago$en$, $en$If you are in Chile$en$)
) as m(es, label_en, audience_en)
where p.label = m.es;

update public.payment_methods set instructions_en = coalesce(nullif(instructions_en, ''),
  replace(replace(replace(replace(replace(replace(replace(replace(
    instructions,
    'Al hacer la transferencia, escribinos a ', 'Once you have made the transfer, email us at '),
    ' y subí el comprobante acá abajo.', ' and upload the receipt below.'),
    'Número de cuenta:', 'Account number:'),
    'Cuenta Vista', 'Cuenta Vista (demand account)'),
    'Banco:', 'Bank:'),
    'Dirección:', 'Address:'),
    'Titular:', 'Account holder:'),
    'Correo:', 'Email:'))
where label in ('Transferencia bancaria en euros', 'Transferencia a Mercado Pago');

-- FAQs. Se encuentran por la pregunta + el arranque de la respuesta, no por id:
-- hay preguntas repetidas (una versión para Sesiones y otra para Viajes).
update public.faqs f set
  question_en = coalesce(nullif(f.question_en, ''), t.q_en),
  answer_en = coalesce(nullif(f.answer_en, ''), t.a_en)
from (values
  ($es$¿Qué es un Viaje Cósmico?$es$, $es$Un Viaje Cósmico es una semana$es$,
   $en$What is a Cosmic Journey?$en$,
   $en$A Cosmic Journey is an immersive week that combines three Cosmic Sessions with days of integration, movement, breathwork, rest, conversation and other practices designed to support a deeper process of exploration and transformation.$en$),
  ($es$¿Qué es una Sesión Cósmica?$es$, $es$Una Sesión Cósmica es un viaje$es$,
   $en$What is a Cosmic Session?$en$,
   $en$A Cosmic Session is a full-day journey designed to support expanded states of consciousness, connection with the soul, energetic transformation and personal evolution. Each session is different and unfolds according to the individual and collective process of the group.$en$),
  ($es$¿Necesito experiencia previa para participar?$es$, $es$No necesariamente.$es$,
   $en$Do I need previous experience to take part?$en$,
   $en$Not necessarily. Some retreats are open to first-time participants, while others are designed for people who are already familiar with this work. Each application is reviewed individually.$en$),
  ($es$¿Cuánto dura una sesión?$es$, $es$Las sesiones generalmente$es$,
   $en$How long does a session last?$en$,
   $en$Sessions usually take place over a full day. We recommend keeping the evening free and avoiding important commitments immediately afterwards.$en$),
  ($es$¿Cuántas personas participan?$es$, $es$Las sesiones se realizan en grupos pequeños$es$,
   $en$How many people take part?$en$,
   $en$Sessions are held in small groups to create an intimate atmosphere and allow each participant to receive personal guidance and support throughout the experience.$en$),
  ($es$¿Cuántas Sesiones Cósmicas se incluyen?$es$, $es$Las experiencias de semana completa$es$,
   $en$How many Cosmic Sessions are included?$en$,
   $en$Week-long experiences usually include three Cosmic Sessions, with time for preparation and integration between them. The exact program may vary depending on the destination and the nature of each journey.$en$),
  ($es$¿Necesito experiencia previa?$es$, $es$No. Las sesiones están abiertas$es$,
   $en$Do I need previous experience?$en$,
   $en$No. Sessions are open both to first-time participants and to people with extensive experience. The work and the guidance are adapted to each person's process and level of experience.$en$),
  ($es$¿Cuántas personas participan?$es$, $es$Los grupos se mantienen$es$,
   $en$How many people take part?$en$,
   $en$Groups are intentionally kept small to preserve the intimacy of the experience and allow for personal attention throughout the journey.$en$),
  ($es$¿Qué sucede en los días de integración?$es$, $es$Los días de integración$es$,
   $en$What happens on the integration days?$en$,
   $en$Integration days are intentionally spacious and may include rest, movement, breathwork, nature, conversation and individual reflection.$en$),
  ($es$¿Puedo asistir a más de una sesión?$es$, $es$Sí. Algunas personas$es$,
   $en$Can I attend more than one session?$en$,
   $en$Yes. Some people take part only once, while others choose to continue in a longer process. The right pace depends on each person's experience, integration and individual path.$en$),
  ($es$¿Cómo debo prepararme?$es$, $es$Recomendamos preparar tu cuerpo y tu mente durante al menos cinco días$es$,
   $en$How should I prepare?$en$,
   $en$We recommend preparing your body and mind for at least five days before the session, with clean eating, rest and hydration, and by avoiding alcohol and other substances. You will receive detailed preparation guidelines before attending.$en$),
  ($es$¿Cómo debo prepararme?$es$, $es$Recomendamos preparar tu cuerpo y tu mente durante al menos una semana$es$,
   $en$How should I prepare?$en$,
   $en$We recommend preparing your body and mind for at least a week before arrival, with healthy eating, rest and hydration, and by avoiding alcohol and other substances. Detailed preparation guidelines and resources are provided before the retreat.$en$),
  ($es$¿Qué debo llevar?$es$, $es$Ropa cómoda$es$,
   $en$What should I bring?$en$,
   $en$Comfortable clothes, a water bottle, an eye mask, a blanket, a pillow and any personal or meaningful object you would like to have with you.$en$),
  ($es$¿Cómo se determinan las dosis?$es$, $es$No hay una dosis fija$es$,
   $en$How are doses determined?$en$,
   $en$There is no fixed dose for everyone. Each participant is approached individually according to their previous experience, sensitivity, emotional state and response during the journey. The process is gradual and personalized.$en$),
  ($es$¿Puedo participar si tomo medicamentos o recibo tratamiento médico o psicológico?$es$, $es$Depende del medicamento$es$,
   $en$Can I take part if I take medication or am receiving medical or psychological treatment?$en$,
   $en$It depends on the medication, the treatment and the health condition. All participants must complete a health form before being accepted. Please do not stop or change any prescribed medication without guidance from your treating physician.$en$),
  ($es$¿Qué pasa si experimento miedo o ansiedad durante una sesión?$es$, $es$El miedo o la ansiedad pueden surgir$es$,
   $en$What if I experience fear or anxiety during a session?$en$,
   $en$Fear or anxiety can sometimes arise during expanded states of consciousness. Our team remains present throughout the experience, offering personal guidance and support, allowing each participant to move through the process at their own pace.$en$),
  ($es$¿Puedo participar si tomo medicamentos o estoy en tratamiento?$es$, $es$Todos los participantes deben completar$es$,
   $en$Can I take part if I take medication or am in treatment?$en$,
   $en$All participants must complete a health form before being accepted. If you take medication or are under medical, psychiatric or psychological treatment, you must let us know during your application. Prescribed medication should never be stopped or changed without guidance from your treating physician.$en$),
  ($es$¿Quiénes no deberían participar?$es$, $es$Por razones de seguridad$es$,
   $en$Who should not take part?$en$,
   $en$For safety reasons, participation may not be appropriate for people with certain psychiatric conditions, active substance addictions, personality disorders, epilepsy, serious cardiovascular conditions or other relevant medical conditions. Each application is reviewed individually.$en$),
  ($es$¿Existen condiciones de salud que puedan impedir la participación?$es$, $es$Sí. Por razones de seguridad$es$,
   $en$Are there health conditions that may prevent participation?$en$,
   $en$Yes. For safety reasons, these experiences may not be suitable for people with certain psychiatric conditions, active substance addictions, personality disorders, epilepsy, serious cardiovascular conditions or other relevant medical conditions. Applications are reviewed individually.$en$),
  ($es$¿Cómo se determinan las dosis?$es$, $es$No existe una dosis única$es$,
   $en$How are doses determined?$en$,
   $en$There is no single dose that is right for everyone. Individual sensitivity can vary significantly, so the approach is personalized and gradual, taking into account previous experience, physical and emotional state, sensitivity and the way each person responds during the session.$en$),
  ($es$¿Qué está incluido?$es$, $es$Generalmente se incluyen$es$,
   $en$What is included?$en$,
   $en$Accommodation, meals, scheduled activities and practices, Cosmic Sessions and local transportation related to the retreat are generally included. Airport transfers are included when specified. Flights and personal expenses are not included.$en$),
  ($es$¿Qué pasa si siento miedo o ansiedad durante la experiencia?$es$, $es$Es natural que surja$es$,
   $en$What if I feel fear or anxiety during the experience?$en$,
   $en$It is natural for some fear or anxiety to arise when entering an expanded state of consciousness. Everyone responds differently, which is why the experience is approached gradually and individually.

Participants can start gradually and go deeper only according to how they feel and how they respond to the experience. Throughout the journey, our team remains present and attentive, offering personal guidance and support whenever needed. The intention is never to take anyone beyond what they feel ready to experience.$en$),
  ($es$¿Qué debo llevar?$es$, $es$Recibirás una guía de equipaje$es$,
   $en$What should I bring?$en$,
   $en$Before traveling you will receive a packing guide specific to the destination, with recommendations on clothing, personal items and everything that will be useful for the sessions and activities.$en$),
  ($es$¿Qué sucede después de la sesión?$es$, $es$Los días posteriores$es$,
   $en$What happens after the session?$en$,
   $en$The days after a session are an important part of the process. We recommend rest, introspection and making space to integrate the experience. You will receive an integration guide and additional resources to support this process.$en$),
  ($es$¿Todo lo compartido durante la sesión es confidencial?$es$, $es$Sí. Pedimos a todos$es$,
   $en$Is everything shared during the session confidential?$en$,
   $en$Yes. We ask everyone to respect the privacy of the group and the personal experiences shared during the session.$en$),
  ($es$¿Puedo llegar antes o quedarme después del retiro?$es$, $es$Sí. Para cada destino$es$,
   $en$Can I arrive early or stay after the retreat?$en$,
   $en$Yes. For each destination we provide recommended arrival and departure times, transportation information and accommodation suggestions if you would like to extend your stay.$en$),
  ($es$¿Cuál es la política de cancelación?$es$, $es$Las reservas y cancelaciones$es$,
   $en$What is the cancellation policy?$en$,
   $en$Bookings and cancellations are subject to the specific terms of each retreat. Please review our Cancellation Policy before confirming your participation.$en$),
  ($es$¿Qué sucede después del retiro?$es$, $es$La integración continúa$es$,
   $en$What happens after the retreat?$en$,
   $en$Integration continues after you return home. You will receive guidance and digital resources to help you bring the experience and what you learned into your everyday life.$en$),
  ($es$¿El retiro es confidencial?$es$, $es$Sí. Se espera$es$,
   $en$Is the retreat confidential?$en$,
   $en$Yes. Participants are expected to respect the privacy of the group. Personal experiences, conversations, photographs and information about other participants must not be shared without their consent.$en$)
) as t(q_es, a_prefix, q_en, a_en)
where f.question = t.q_es and f.answer like t.a_prefix || '%';
