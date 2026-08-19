# Formularios de Google originales de Estela

Relevado el 2026-07-30 abriendo los formularios en vivo. Son la fuente de verdad de lo
que hoy se le pide a un participante, y el modelo que la app replica.

**Re-verificado el 2026-08-19** contra los seis links que mandó Sofía: son exactamente los
mismos formularios, sin cambios de estructura. Esta vez quedaron anotados los títulos
reales y las URLs canónicas (los `forms.gle` son acortadores y podrían reapuntarse; las de
`docs.google.com` son las definitivas).

## Inventario: son 3 formularios × 2 idiomas, no 6 distintos

| Formulario | Idioma | Título real | Link corto | URL canónica |
|---|---|---|---|---|
| Salud (primera vez) | ES | *Formulario de Salud Cosmic Eagle Español* | `forms.gle/GWfBh5RMBSkpmnwB6` | `docs.google.com/forms/d/e/1FAIpQLSfWDtNH95c3_c5jmr_hBOt3ulhgV-wQedlfNunMZ91AcmoijA/viewform` |
| Salud (primera vez) | EN | *Health Form Cosmic Eagle* | `forms.gle/EZjdKVDYgkawEki47` | `docs.google.com/forms/d/e/1FAIpQLSc4zKGnB2jDQPSvr0cb33IL6goTbNFuLzUgj-kJfOYm6DP_eg/viewform` |
| Salud + intención (recurrente) | ES | *Formulario de Salud e Intención para viajer@s* | `forms.gle/xnQD2voYkNVMjHYU8` | `docs.google.com/forms/d/e/1FAIpQLSdn-gJauNDF-gLuUgp0o2f1R_frpepqvqLM9ugEmokKv4Tk0A/viewform` |
| Salud + intención (recurrente) | EN | *Travelers* | — | `docs.google.com/forms/d/e/1FAIpQLSevCJcrjicJxPx4_lBG8Y3TJVMrS3hoPnWvZucLcamh3F6iJA/viewform` |
| Consentimiento informado | ES | *Consentimiento Informado – Cosmic Eagle* | `forms.gle/pAidf8U3M9keg1L56` | `docs.google.com/forms/d/e/1FAIpQLSdQJaUhG3zV0LTjcTJ5n7fI-iFboIkO5p_OdqrrbVhhH4fTNA/viewform` |
| Consentimiento informado | EN | *Informed Consent Cosmic Eagle* | `forms.gle/yxAMebLde3xfDeq89` | `docs.google.com/forms/d/e/1FAIpQLSfBOG6atyq_gmh-NUSfaeOe-hXVbRzsi6zuTfiCWz-ce-pozw/viewform` |

> **"Travelers" NO es un formulario de facilitadores ni de sanadores.** Es la traducción
> al inglés de "Viajer@s": mismos 10 campos, mismo destinatario (participantes que ya
> ceremoniaron con Estela). No existe hoy ningún formulario para maestros o facilitadores.

## Qué pide cada uno

**Salud (ES/EN).** Cabecera: *"Este formulario tiene como objetivo cuidar tu proceso y
preparar la ceremonia de la mejor manera posible."* 8 datos personales (nombre, edad,
estatura, peso, país de origen, email, teléfono, ocupación) + 9 preguntas sí/no con
detalle condicional (condición de salud, estrés/angustia/ansiedad, trauma, consumo de
sustancias, alergias, práctica espiritual, primera vez con plantas, temas a trabajar,
miedos) + comentario libre final.

**Viajer@s / Travelers (ES/EN).** Versión corta para quien ya ceremonió: nombre, mail,
fecha de la próxima ceremonia, tratamiento médico o psiquiátrico nuevo desde la última
ceremonia (+ detalle), estrés/angustia/ansiedad actual (+ detalle), tema específico a
abordar, algo más a compartir, y **cuántas ceremonias hizo con Estela**.

**Consentimiento (ES/EN).** 5 bloques de texto legal (Viaje · Facilitador · Experiencia ·
Consideraciones · Confidencialidad), fecha, 4 confirmaciones tildables y el nombre
completo como firma digital. Menciona explícitamente la sesión de hongos psilocybe.

## Paridad con lo implementado

De los 6 links, **2 están plasmados en la web**: los dos en español de salud. El modelo
primerizo/recurrente de la app **coincide 1:1 con el de Estela**.

> **Ojo, esto cambió el 2026-08-19.** Los dos formularios ya no son alternativas: son
> etapas. El de Viajer@s pasó a ser el **filtro corto** que llenan todos (`ScreeningForm`,
> con el texto en neutro para que le sirva también a un primerizo) y el de salud es el
> **extenso**, posterior al pago (`HealthForm`). Ver `docs/FLUJO_INSCRIPCION.md`.

| Formulario | Estado |
|---|---|
| Salud ES | ✅ `HealthForm.tsx` (etapa 2), con los detalles condicionales (`<campo>_detail`). Ya no pide nombre, mail ni teléfono: los dio en el filtro |
| Viajer@s ES | ✅ `ScreeningForm.tsx` (etapa 1). "Ceremonias previas" admite 0 y "última ceremonia" se sacó: se postula a un viaje concreto |
| Salud EN / Travelers EN | ❌ la web es monolingüe, el i18n no está hecho |
| Consentimiento ES y EN | ❌ **no hay UI**; la tabla `consents` existe desde el principio |

- `HealthForm.tsx` (etapa 2) ↔ *Formulario de Salud*: nombre, edad, estatura, peso, país, email,
  teléfono, ocupación (el nombre, el mail y el teléfono los toma del filtro) + 9 preguntas sí/no con detalle condicional (condición de salud,
  estrés/ansiedad, traumas, consumo de sustancias, alergias, prácticas espirituales,
  primera vez con plantas, temas a trabajar, miedos) + comentario libre.
- `ScreeningForm.tsx` (etapa 1) ↔ *Viajer@s*: nombre, mail, teléfono, tratamiento
  médico o psiquiátrico en curso, estrés/ansiedad, tema específico a abordar, algo más a
  compartir, cantidad de ceremonias previas con Estela.
- El consentimiento calza con la tabla `consents` tal como está: 5 bloques de texto
  (La experiencia · Rol del facilitador · Efectos potenciales · Posibles resultados ·
  Confidencialidad), 4 confirmaciones y el nombre completo como firma → `confirmations`
  (jsonb) + `digital_signature` + `consent_version`. **No hay que tocar el schema.**

El campo "fecha de la próxima ceremonia" del original **se sacó** al pasar al filtro: en la
web es redundante, se postula a *un* viaje concreto y la fecha sale de `trips`.

## Diferencias pendientes de resolver

1. **"Temas específicos": hay una contradicción sin resolver.** El relevamiento del
   2026-07-30 (abriendo el formulario a mano) anotó que era **selección múltiple** con
   opciones predefinidas + detalle; la lectura automática del 2026-08-19 lo reporta como
   **sí/no + párrafo**, igual que en la app. La segunda pasa por un modelo que resume, así
   que no es literal y la primera pesa más. **Hay que abrir el formulario a mano y mirar
   ese campo**; si es multiple choice, pedirle la lista de opciones a Estela.
2. **El consentimiento es un paso aparte y condicionado.** Una de las 4 confirmaciones es
   "completé el formulario de salud": el flujo real es solicitud → consentimiento. La tabla
   ya lo soporta vía `application_first_time_id` / `application_returning_id`, así que lo
   que falta es una pantalla encadenada después de enviar la solicitud, no un form suelto.
3. **Bug latente con los recurrentes.** La app elige qué formulario mostrar según el
   historial de aprobaciones *en Supabase*. Toda la gente que ya ceremonió vía Google Forms
   tiene historial cero, así que se le mostraría el formulario de primera vez. Tres salidas
   posibles, hay que elegir una: importar el histórico del Sheet, dar al admin un toggle
   "viajer@ recurrente" en el perfil, o confiar en lo que responde el usuario (el propio
   formulario ya pregunta cuántas ceremonias hizo con Estela). **Sin decidir.**
4. **Doble fuente de verdad.** Mientras los Google Forms sigan circulando (Instagram,
   WhatsApp), entran solicitudes por dos canales y Estela revisa en dos lugares. Hace falta
   una fecha de corte y saber dónde están publicados esos links hoy. **Sin decidir.**
5. **El inglés no es opcional.** Estela ya opera bilingüe: el i18n es paridad con lo que
   hoy tiene, no un "nice to have". Los strings de mayor valor son los de estos formularios
   y el consentimiento — y ya están traducidos por ella, así que conviene **extraer el EN
   de los Google Forms** en vez de generarlo con API de traducción.

## Textos legales del consentimiento

Todavía **no están en el repo**. Lo relevado es un resumen del contenido, no la
transcripción textual, y los textos legales no se inventan ni se modifican (ver "No hacer"
en CLAUDE.md). Antes de construir la UI del consentimiento hay que obtener la
transcripción exacta de las versiones ES y EN — se puede extraer del HTML crudo de los
formularios, que trae las preguntas literales, o pedírsela a Estela.

Lo único literal que quedó capturado hasta ahora, del ES:

- *Viaje*: "El viaje tiene como objetivo acompañar al participante en una experiencia de
  expansión de conciencia a través de una sesión de hongos psilocybe con acompañamiento de
  los facilitadores."
- *Confidencialidad*: "Toda la información compartida durante las sesiones es estrictamente
  confidencial y será manejada conforme a las leyes vigentes de protección de datos
  personales."

El resto de los bloques (Facilitador, Experiencia, Consideraciones) sigue sin transcribir.
