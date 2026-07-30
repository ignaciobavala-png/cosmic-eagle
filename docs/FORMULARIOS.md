# Formularios de Google originales de Estela

Relevado el 2026-07-30 abriendo los formularios en vivo. Son la fuente de verdad de lo
que hoy se le pide a un participante, y el modelo que la app replica.

## Inventario: son 3 formularios × 2 idiomas, no 6 distintos

| Formulario | Español | Inglés |
|---|---|---|
| Salud (primera vez) | `forms.gle/GWfBh5RMBSkpmnwB6` | `forms.gle/EZjdKVDYgkawEki47` |
| Salud + intención (recurrente) — "Viajer@s" / "Travelers" | `forms.gle/xnQD2voYkNVMjHYU8` | `docs.google.com/forms/d/e/1FAIpQLSevCJcrjicJxPx4_lBG8Y3TJVMrS3hoPnWvZucLcamh3F6iJA` |
| Consentimiento informado | `forms.gle/pAidf8U3M9keg1L56` | `forms.gle/yxAMebLde3xfDeq89` |

> **"Travelers" NO es un formulario de facilitadores ni de sanadores.** Es la traducción
> al inglés de "Viajer@s": mismos 10 campos, mismo destinatario (participantes que ya
> ceremoniaron con Estela). No existe hoy ningún formulario para maestros o facilitadores.

Verificados campo por campo: salud ES, Viajer@s ES, Travelers EN y consentimiento ES.
Los dos restantes en inglés son simétricos y no se abrieron.

## Paridad con lo implementado

El modelo primerizo/recurrente de la app **coincide 1:1 con el de Estela**.

- `FirstTimeForm.tsx` ↔ *Formulario de Salud*: nombre, edad, estatura, peso, país, email,
  teléfono, ocupación + 9 preguntas sí/no con detalle condicional (condición de salud,
  estrés/ansiedad, traumas, consumo de sustancias, alergias, prácticas espirituales,
  primera vez con plantas, temas a trabajar, miedos) + comentario libre.
- `ReturningForm.tsx` ↔ *Viajer@s*: nombre, mail, fecha de próxima ceremonia, tratamiento
  nuevo desde la última ceremonia, estrés/ansiedad, tema específico a abordar, algo más a
  compartir, cantidad de ceremonias previas con Estela.
- El consentimiento calza con la tabla `consents` tal como está: 5 bloques de texto
  (La experiencia · Rol del facilitador · Efectos potenciales · Posibles resultados ·
  Confidencialidad), 4 confirmaciones y el nombre completo como firma → `confirmations`
  (jsonb) + `digital_signature` + `consent_version`. **No hay que tocar el schema.**

## Diferencias pendientes de resolver

1. **"Temas específicos" es selección múltiple, no sí/no.** En el formulario real es una
   lista de opciones predefinidas + detalle; en la app es un checkbox. Es el único campo
   con desajuste de tipo. **Hay que pedirle la lista de opciones a Estela.**
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
