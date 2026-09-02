# Preguntas frecuentes

Ruta pública `/faqs`, panel en `/admin/faqs`. Migración
`20260902140000_faqs.sql`.

## 1. Por qué existe

Dos motivos, y ninguno es "hacía falta una sección más":

1. **Había un link muerto en el código aprobado de Julia.** El bloque "Salud y
   Seguridad" de `/viajes` termina diciendo *"para información sobre
   preparación, qué llevar, integración, dosis, miedo y ansiedad, y otros
   aspectos prácticos, por favor visita nuestras FAQs"* — y no había adónde ir.
2. **El texto ya estaba escrito.** Sofía mandó **dos juegos** de FAQs, uno por
   tipo de experiencia, en los anexos de `web-cosmic-journey-ES.md` (15/08).

## 2. El texto se perdió — hay que pedirlo de nuevo

`web-cosmic-journey-ES.md` **no está en el repo y ya no está en el disco**:
vivía en `~/Descargas`, que quedó vacía. Es la segunda vez que pasa — los tres
HTML del rediseño de Julia desaparecieron igual, y están anotados como
"desaparecieron de Descargas" en CLAUDE.md (sesión del 27/08 ter).

En `docs/` quedaron **citas sueltas**, no el texto: `FLUJO_INSCRIPCION.md` cita
cuatro o cinco líneas de las FAQs (la preparación previa, "todos deben completar
un formulario de salud antes de ser aceptados", "cada postulación se revisa de
forma individual", la remisión a la Política de Cancelación).

Con el mismo archivo se perdió **el anexo de Privacidad y Confidencialidad**,
que era lo que iba a llenar `/privacidad`. Esa ruta sigue sin existir y su link
del footer sigue apagado.

**Regla que sale de esto: lo que mandan las clientas se copia a una carpeta que
no se limpie sola, y si es texto, al repo.**

## 3. Por eso la tabla sale vacía

La migración **no siembra nada**. El copy es de la clienta y no se inventa (ver
"No hacer" en CLAUDE.md). Con la tabla vacía la página no queda en blanco: dice
que la sección está en preparación e invita a escribir.

## 4. Decisiones

- **Es tabla, no `site_content` ni constantes.** Mismo criterio que `articles` y
  `testimonials`, y por la misma razón: la **cantidad** de preguntas la decide la
  clienta. En `site_content` el código declara cuántos slots hay; en constantes,
  cada pregunta nueva sería un deploy.
- **Lo despublicado no sale de la base**: la policy pública es
  `using (is_published)` y el admin ve todo por una segunda policy. A propósito
  distinto de `trips`, donde el filtro de borradores lo hace cada página y hay
  que acordarse en cada ruta nueva.
- **Tres bloques** (`faq_placement`): Generales, Sesiones Cósmicas y Viajes
  Cósmicos. Los dos últimos son los dos juegos de Sofía; el primero es para lo
  que no es de un tipo ni del otro. Una pregunta vive en un bloque solo: los dos
  juegos tienen **respuestas distintas para preguntas parecidas** (la preparación
  previa son cinco días en Sesiones y una semana en Viajes), así que no es una
  relación muchos a muchos.
- **Un bloque sin preguntas no se dibuja**, igual que los testimonios.
- **La respuesta es texto plano** con la misma regla del cuerpo de los artículos:
  línea en blanco = párrafo. Sale como texto dentro de `<p>`. Nada de HTML del
  formulario: no hay sanitizador en el proyecto y sería un XSS almacenado.
- **El acordeón es `<details>` nativo, sin estado de React.** No necesita JS,
  anda con el teclado, y el Ctrl+F del navegador encuentra el texto de una
  respuesta cerrada y la abre solo. Un acordeón propio pierde las tres cosas.
- **El hero es editable** desde `/admin/multimedia` (grupo "Preguntas
  frecuentes": imagen, título, bajada y el tilde de mostrar el texto encima).
- La página es **estática con ISR de una hora**; los server actions del panel
  hacen `revalidatePath("/faqs")`, o una pregunta nueva tardaría hasta una hora.

## 5. El reveal NO se ata a la sección — y acá es obligatorio

En el resto del sitio el elemento observado por `Reveal` es la **sección**
(`docs/…`, sesión del 27/08 ter). Acá **no**, y no es un descuido:

> El ratio de intersección máximo alcanzable es *alto de pantalla / alto del
> elemento observado*. Una sección más alta que unas pocas pantallas nunca llega
> al umbral, y con `once` eso es irreversible: el contenido no aparece **nunca**.

En esta página **el alto lo decide la clienta** —carga las preguntas que
quiera—, así que no puede haber un umbral atado a ella. Se observa sólo el
encabezado de cada bloque, que mide lo mismo siempre, y **la lista de preguntas
está visible desde el arranque**.

Medido en el browser a 390×844 con cuatro preguntas: la sección alcanzaba 1,03
de ratio y el encabezado 18,35 — o sea 83 veces el margen del umbral de 0,22.
Con 200 preguntas el encabezado sigue disparando igual.

## 6. De paso: los anclajes caían debajo del navbar

Bug preexistente de **todo el sitio**, no de esta página: desde que el navbar
pasó a ser una banda opaca (20/08), cualquier anclaje dejaba el arranque de la
sección 84px **debajo** de él. Afectaba a `#sesiones` y `#viajes` del
desplegable, que son la navegación principal a Experiencias, y al "Explorar" de
cada hero.

Se arregló con `scroll-padding-top` en `html` (`globals.css`), con la misma
altura que el `pt-16 lg:pt-21` que llevan todos los `main`. Verificado: antes el
top de `#sesiones` quedaba en 0 con un navbar de 84px; ahora queda en 84.

## 7. Lo que falta

1. **El texto.** Pedirle a Sofía que reenvíe `web-cosmic-journey-ES.md`, o al
   menos los dos anexos: FAQs y Privacidad.
2. **`/privacidad`**, que depende del mismo archivo. El link del footer sigue
   apagado.
3. **La Política de Cancelación**, a la que las FAQs de Viajes remiten y que
   **no estaba** en los anexos ni cuando los teníamos. Hay que pedirla aparte.
