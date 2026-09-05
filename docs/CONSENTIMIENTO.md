# Consentimiento informado

El último paso del embudo de inscripción, implementado el **2026-09-05**. Hasta
ese día la tabla `consents` existía desde el schema original (25/07) pero no
tenía pantalla: los textos legales son de la clienta y no estaban en el repo.

Ignacio pasó el link del formulario de Google que usan hoy y de ahí salió la
transcripción literal. **Los dos idiomas están abajo, textuales.**

| | |
|---|---|
| Formulario original (ES) | *Consentimiento Informado – Cosmic Eagle* — `docs.google.com/forms/d/e/1FAIpQLSdQJaUhG3zV0LTjcTJ5n7fI-iFboIkO5p_OdqrrbVhhH4fTNA/viewform` |
| Formulario original (EN) | *Informed Consent Cosmic Eagle* — `docs.google.com/forms/d/e/1FAIpQLSfBOG6atyq_gmh-NUSfaeOe-hXVbRzsi6zuTfiCWz-ce-pozw/viewform` |
| Ruta | `/viajes/[id]/consentimiento` |
| Texto en el código | `src/lib/consent.ts` (sólo ES) |
| Tabla | `public.consents` |
| Migración | `20260905160000_consents_flow.sql` |

## 1. Dónde entra en el flujo

```
… pago registrado → formulario de salud (sólo primerizas) → CONSENTIMIENTO → logística
```

Va **después** del formulario de salud y no antes, y no es una preferencia: una
de las cuatro confirmaciones dice *"He rellenado el formulario de salud
obligatorio"*. A una primeriza que todavía no lo mandó, la página la manda ahí
primero (`redirect` a `/viajes/[id]/salud`).

Lo firma **todo el mundo**, a diferencia del formulario de salud, que sólo
existe para las primerizas (no hay `health_form_returning`).

El portón es el mismo que el de la etapa 2: solicitud **aprobada** y pago
distinto de `pending` (o sea, seña o total registrados por Estela).

## 2. Qué se guarda

Sin migración de columnas: el schema del 25/07 ya calzaba.

| Columna | Qué lleva |
|---|---|
| `confirmations` (jsonb) | las cuatro, **con su etiqueta literal**: `[{id, label, accepted:true}]` |
| `digital_signature` | el nombre completo tipeado |
| `consent_version` | la versión del texto que se aceptó (`CONSENT_VERSION`) |
| `date` | la fecha de la firma, **la del servidor** |
| `user_id`, `trip_id` | los pone el trigger, derivados de la solicitud |

**Se guarda el texto, no sólo el tildado.** Si la clienta cambia una frase, un
consentimiento firmado tiene que seguir diciendo lo que decía cuando se firmó —
por eso viaja la etiqueta completa de cada confirmación y la versión del texto.
El panel de admin lista las etiquetas **guardadas**, no las del código.

**La fecha la pone el servidor.** El formulario de Google la pide escrita a
mano; una fecha declarada por quien firma no sirve como registro.

## 3. Seguridad (migración `20260905160000`)

La tabla se escribió cuando no había pantalla y su permiso había quedado más
flojo que el del resto del embudo. Lo que cambió:

1. **El insert exige la solicitud propia y aprobada.** Antes alcanzaba con
   `auth.uid() = user_id`: cualquier persona logueada podía firmar apuntando al
   `application_id` de otra, o al suyo sin estar aprobada. Ahora lleva
   `private.owns_approved_application(application_id)`, el mismo guard del
   formulario de salud.
2. **`user_id` y `trip_id` los pone la base**, con un trigger `security
   definer` que los lee de la solicitud e ignora lo que mande el formulario.
   Eran redundantes con `application_id` y podían quedar colgados del viaje
   equivocado sin que ninguna policy lo notara.
3. **Un consentimiento firmado es inmutable.** Se revocó UPDATE y DELETE a
   `authenticated`, **que incluye al admin**: un registro legal no se edita
   desde el panel, y si hay que corregirlo se firma de nuevo. `service_role`
   conserva todo para una intervención manual.

**Ojo con el orden trigger/policy** (verificado con `set role`, no deducido): un
trigger BEFORE corre **antes** de que se evalúe el `with check`, así que la RLS
ve la fila ya corregida. Un insert con el `user_id` de otra persona sobre una
solicitud propia **pasa**, porque el trigger lo reescribe primero. O sea que
acá el `auth.uid() = user_id` de la policy no es lo que sostiene la seguridad:
lo que la sostiene es `owns_approved_application`.

## 4. Diferencias con el formulario de Google

1. **Las cuatro confirmaciones son obligatorias.** En Google son un grupo de
   casillas "requerido", que ahí significa *al menos una*. El bloque se llama
   "Confirmaciones requeridas" y cada una afirma algo distinto e
   imprescindible: tres de cuatro no es un consentimiento informado.
2. **No se pide la fecha** (la pone el servidor, ver arriba).
3. **No se pide de nuevo el nombre como dato**: la firma es el nombre, y el
   campo viene precargado con el de la cuenta (editable). No se valida contra el
   perfil a propósito: los dos los escribió la misma persona y compararlos sólo
   trabaría a quien tenga un tipeo distinto.
4. **Sólo está el español.** El inglés está transcripto acá abajo y entra
   cuando entre el i18n; no hay que volver a extraerlo.

## 5. Lo que falta

- **Que Estela y Sofía confirmen que este es el texto vigente.** Se extrajo del
  formulario que está publicado hoy, no de un documento que ellas hayan mandado.
- **Un PDF o una copia por mail de lo firmado.** Hoy el registro vive en la base
  y se ve en el panel; la persona que firma no se lleva ningún comprobante.
- **Apagar el formulario de Google** cuando el embudo de la web sea el canal
  único (es la misma decisión pendiente de `docs/FORMULARIOS.md` §4).

---

## Transcripción — español (la implementada)

> **Consentimiento Informado – Cosmic Eagle**
>
> Por favor lee atentamente cada sección antes de completar el formulario.

**Viaje** — El viaje tiene como objetivo acompañar al participante en una
experiencia de expansión de conciencia a través de una sesión de hongos
psilocybe con acompañamiento de los facilitadores. Esta sesión está orientada a
la introspección y crecimiento personal, se realiza en un ambiente seguro y con
intenciones claras para el bienestar del participante.

**Facilitador** — El facilitador brindará un entorno seguro, apoyo emocional y
acompañamiento durante el proceso. Este acompañamiento incluirá la observación
de la seguridad física del participante, apoyo para la integración de la
experiencia y contención en todo momento. Sin embargo, el facilitador no será
responsable de los efectos específicos de la experiencia que el participante
pueda experimentar.

**Experiencia** — El participante reconoce que la experiencia puede involucrar
cambios en la percepción, emociones, pensamientos y en la sensación de
identidad. Esta experiencia puede ser intensa y provocar estados de conciencia
ampliados. El participante comprende que el proceso puede activar recuerdos,
emociones o pensamientos profundos que pueden ser difíciles de procesar en el
momento.

**Consideraciones**

- La experiencia puede facilitar el autoconocimiento, la sanación emocional, el
  desarrollo personal y la expansión de conciencia. No se garantiza un resultado
  específico.
- La experiencia puede incluir ansiedad, desorientación, miedo, y en ocasiones
  pueden traer a la conciencia experiencias pasadas dolorosas o reprimidas.
  Estos estados pueden generar incomodidad emocional.

**Confidencialidad** — Toda la información compartida durante las sesiones es
estrictamente confidencial y será manejada conforme a las leyes vigentes de
protección de datos personales. El facilitador se compromete a no compartir
ninguna información sin el consentimiento expreso del participante.

**Consentimiento** — Declaro que he leído y comprendido los términos y
condiciones expuestos en este consentimiento informado. Confirmo que participo
en esta experiencia de manera voluntaria y que tengo la capacidad legal para dar
mi consentimiento. He tenido la oportunidad de hacer preguntas y aclarar dudas,
y me siento informado sobre el proceso y los riesgos involucrados.

**Confirmaciones requeridas**

1. He leído y comprendido todos los términos de este consentimiento
2. Participo de manera voluntaria y tengo capacidad legal para consentir
3. He podido hacer preguntas y me siento informado/a sobre el proceso y los riesgos
4. He rellenado el formulario de salud obligatorio

**Escribe tu nombre completo como firma digital** — *Al escribir tu nombre
confirmas tu consentimiento.*

---

## Transcripción — inglés (todavía sin implementar)

> **Informed Consent Cosmic Eagle**
>
> Please read each section carefully before completing the form.

**Journey** — The journey aims to accompany the participant in a
consciousness-expanding experience through a psilocybe mushroom session with
facilitator support. This session is oriented toward introspection and personal
growth, takes place in a safe environment with clear intentions for the
participant's wellbeing.

**Facilitator** — The facilitator will provide a safe environment, emotional
support, and accompaniment throughout the process. This includes monitoring the
participant's physical safety, supporting the integration of the experience, and
providing containment at all times. However, the facilitator will not be
responsible for the specific effects of the experience that the participant may
undergo.

**Experience** — The participant acknowledges that the experience may involve
changes in perception, emotions, thoughts, and sense of identity. This
experience can be intense and may induce expanded states of consciousness. The
participant understands that the process may activate memories, emotions, or
deep thoughts that can be difficult to process in the moment.

**Considerations**

- The experience may facilitate self-knowledge, emotional healing, personal
  development, and expansion of consciousness. No specific outcome is
  guaranteed.
- The experience may include anxiety, disorientation, fear, and may at times
  bring painful or repressed past experiences into consciousness. These states
  may cause emotional discomfort.

**Confidentiality** — All information shared during the sessions is strictly
confidential and will be handled in accordance with applicable personal data
protection laws. The facilitator commits to not sharing any information without
the participant's express consent.

**Consent** — I declare that I have read and understood the terms and conditions
set out in this informed consent. I confirm that I am participating in this
experience voluntarily and that I have the legal capacity to give my consent. I
have had the opportunity to ask questions and clarify any doubts, and I feel
informed about the process and the risks involved.

**Required confirmations**

1. I have read and understood all the terms of this informed consent
2. I am participating voluntarily and have the legal capacity to consent
3. I have been able to ask questions and feel informed about the process and risks
4. I have completed the mandatory health form

**Type your full name as your digital signature** — *By typing your name you
confirm your consent.*
