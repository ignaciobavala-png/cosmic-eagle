# El recorrido del viajero — el eje que une backend, diseño y contenido

Fecha: 2026-07-30.

El proyecto avanzó en tres patas paralelas y sin secuencia: el **backend** (Ignacio, ya
construido), el **diseño** (Julia, entregado hoy) y la **arquitectura de contenido**
(Sofía, todavía cerrándose). Cada pata es coherente consigo misma pero ninguna es el
eje. Este documento propone el eje: el recorrido real del negocio de Estela. Todo lo
demás — rutas, componentes, textos — se justifica por dónde cae en este recorrido.

## 1. El negocio, en una línea

Estela no vende cupos en un viaje. **Selecciona y prepara** a la persona correcta para
una ceremonia con plantas de poder, y se hace responsable de ella durante y después.

Esto tiene una consecuencia que ordena todo el producto: el **gate de salud no es un
trámite administrativo, es el corazón del servicio**. Por eso la aprobación es manual y
obligatoria (`CONTEXT.md` §4), por eso hay dos formularios distintos según historial, y
por eso el consentimiento es un paso separado y posterior. Una web que optimice para
"convertir rápido" trabaja *en contra* del negocio. La web tiene que **filtrar bien**:
que llegue menos gente al formulario, pero la correcta y ya informada.

De ahí que las cinco preguntas de Sofía tengan el orden que tienen: la tercera es
"¿es seguro para mí?" y la quinta es "¿cómo postulo?". Postular es lo último.

## 2. El recorrido, paso a paso

| # | Momento | Pregunta del usuario | Dónde vive | Estado |
|---|---|---|---|---|
| 1 | Descubrimiento | ¿Qué es esto? | `/` | diseño ✅ · código parcial |
| 2 | Confianza | ¿Quiénes son? ¿Puedo confiar? | `/nosotros` | diseño ✅ · contenido ✅ · código ❌ |
| 3 | Autoevaluación | ¿Es seguro **para mí**? ¿Cómo me preparo? | `/preparacion` | **nada de las tres patas** |
| 4 | Profundización | Quiero entender más antes de decidir | `/contenidos` | contenido ❌ · diseño ❌ · código ❌ |
| 5 | Elección | ¿Qué viaje y cuándo? | `/viajes`, `/viajes/[id]` | backend ✅ · diseño ✅ · rediseño pendiente |
| 6 | Registro | — | `/cuenta` | backend ✅ · diseño ❌ |
| 7 | Solicitud | ¿Cómo postulo? | `/viajes/[id]/solicitar` | backend ✅ · diseño ❌ |
| 8 | Espera | ¿En qué estado estoy? | `/cuenta` | backend ✅ · diseño ❌ |
| 9 | Aprobación → consentimiento | ¿Qué firmo? | *(sin ruta)* | tabla `consents` existe, **sin UI** |
| 10 | Viajero | ¿Qué llevo? ¿Qué pasa el día 1? | `/cuenta` + `/preparacion` | parcial |
| 11 | Post-viaje | ¿Cómo integro lo que viví? | `/preparacion#integracion` | **nada** |

**Lo que se lee en la tabla**: el backend cubre bien los pasos 5–8, que son el motor
transaccional. Julia cubre bien los pasos 1–2 y 5, que son la seducción. **El hueco real
es el paso 3** — y es exactamente donde el negocio se juega el filtro. Y el paso 9, el
consentimiento, no lo cubre nadie.

Dicho de otro modo: hoy el sitio puede enamorar y puede procesar, pero no puede
**preparar**. `/preparacion` no es una sección más de la lista de Sofía: es la pieza que
convierte el sitio en el negocio de Estela.

## 3. La tensión que hay que resolver con Julia y Sofía

- **`/preparacion` no está en el diseño.** Casi seguro no estaba en el brief de Julia, no
  que lo haya descartado. Es la ruta nueva a construir.
- **`CONTENIDOS` está en el nav de Julia pero no tiene mockup**, y en la home de Julia
  tampoco hay sección de contenidos (nuestro `ContentSection.tsx` no tiene equivalente).
- **El CTA principal del diseño dice "UNIRME AL CÍRCULO"** y en la home hay un botón
  "ACCESO COMUNIDAD". Pero comunidad está **explícitamente fuera de alcance**
  (`CONTEXT.md` §6: solo comunicación admin → usuario en esta fase). Ese botón promete
  algo que el producto no tiene. Hay que redefinirlo — probablemente apunte a registro o
  a postular — o se genera una expectativa que la plataforma no cumple.
- **El footer de Julia incluye "Blog"**, que Sofía difirió explícitamente a segunda etapa.

## 4. Vocabulario visual de Julia — las piezas reutilizables

Esta es la parte que permite construir `/preparacion` y `/contenidos` **sin inventar
diseño y sin contradecir a Julia**. Sus tres páginas no son tres diseños: son la misma
media docena de primitivas recombinadas. Extraídas del mockup:

| # | Primitiva | Dónde aparece | Anatomía |
|---|---|---|---|
| P1 | **Hero de página** | las 3 páginas | banner full-bleed + título serif centrado + subtítulo + 1–2 CTAs (sólido dorado / ghost) + scroll hint uppercase con chevron |
| P2 | **Card documento** | home (esencia), nosotros (propósito, metodología) | card glass con eyebrow uppercase dorado, título en dos líneas (blanco + dorado) y párrafos largos |
| P3 | **Par asimétrico texto/imagen** | nosotros ×2 | card de texto a un lado, imagen recortada (óvalo o rounded) al otro, **alternando el lado** en cada bloque |
| P4 | **Grilla de 3 cards con portada** | home, viajes | badge superpuesto + título serif + descripción + pie con label y acción circular ↗ |
| P5 | **Cierre centrado** | nosotros ("Nuestra Visión") | símbolo de estrella de 4 puntas + título dorado + párrafo angosto + CTA sólido |
| P6 | **Banda de llamado** | viajes ("¿Sentís el llamado?") | imagen de fondo + título grande + **un solo** CTA claro |
| P7 | **Header de sección con dividers** | home (Voces de Luz) | título centrado + subtítulo uppercase flanqueado por líneas |
| P8 | **Carrusel de óvalos** | home (Portales) | 3 imágenes en óvalo, la central al frente, laterales atenuadas |

### `/preparacion` compuesta con ese vocabulario

Sin una sola decisión de diseño nueva:

```
P1  Hero            → "Preparación e Integración" (reusa BANNER_HERO_NOSOTROS)
    Índice lateral pegajoso con anclas (#alimentacion, #contraindicaciones, …)
P3  Bloque ×5       → los 5 bloques de Preparación, alternando lado imagen/texto
P7  Divider         → separador "INTEGRACIÓN"
P3  Bloque ×4       → los 4 bloques de Integración
P5  Cierre          → "¿Listo para postular?" con CTA a /viajes
```

El único elemento nuevo es el **índice lateral con anclas**, y se resuelve con P7 +
tipografía `label-sm` ya existente. Las imágenes de los bloques son lo único que hay que
pedirle a Julia — y hasta que lleguen se puede lanzar con los assets que ya mandó.

### `/contenidos` compuesta con ese vocabulario

```
P1  Hero            → "Contenidos"
P4  Grilla ×3       → Biblioteca · Ciencia Almática · Testimonios (como categorías)
P6  Banda           → cierre hacia /viajes
```

**El argumento para Julia**: no le pedimos rediseñar nada ni le corregimos el trabajo.
Le mostramos que su sistema visual es tan consistente que **genera** las páginas que
faltaban, y le pedimos validar dos composiciones y un puñado de imágenes. Su lenguaje
cubre todo el recorrido; lo que faltaba era el recorrido, no el diseño.

**El argumento para Sofía**: sus seis secciones entran completas, cada link del nav
responde una de sus cinco preguntas, y `/preparacion` — la pieza que en su texto
justificaba la pregunta 4 — queda construida y con lugar para crecer.

## 5. Orden de trabajo que se desprende

> **Estado al 2026-07-31**: hechos los pasos 1, 2 y 3. `/viajes` quedó con el
> hero P1, la grilla P4 (compartida con la home) y la banda P6 al pie, así que
> **P6 ya está construida** (`ui/CallBand.tsx`). De la home falta rediseñar
> `AboutSection`, `EbookSection` y `TestimonialsSection` — esta última es la que
> pide P7, la única primitiva que sigue sin construirse. Faltan los pasos 5 y 6.


1. **Fondo global + navbar + footer** — el chrome de Julia, que toca todas las páginas.
   Resolver antes qué hace "UNIRME AL CÍRCULO".
2. **`/nosotros`** — es la de mejor relación esfuerzo/valor: hoy es placeholder, tiene
   diseño completo y contenido real ya escrito. Además ejercita P1, P2, P3 y P5, o sea
   que deja construidas las primitivas que `/preparacion` necesita.
3. **`/viajes` + cards** — reemplazar el diseño actual por P1 + P4. Requiere agregar
   `image_url` a `trips`.
4. **Home** — recomponer con P8 (carrusel) y P4 (grilla de retiros).
5. **`/preparacion`** — ya con todas las primitivas construidas, es composición pura.
   Bloqueada por el contenido de Sofía/Estela.
6. **Consentimiento** (paso 9 del recorrido) — bloqueado por los textos legales de Estela.

Los pasos 1–4 no dependen de nadie más: se pueden hacer ya. Los pasos 5–6 son de camino
crítico y dependen de contenido que hay que pedir **ahora**, en paralelo.
