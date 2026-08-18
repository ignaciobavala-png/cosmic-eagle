# Mapa de contenido — propuesta de Sofía reconciliada con el sitio

Fecha: 2026-07-30. Fuente: texto de Sofía (diseñadora/creadora del proyecto) con su
propuesta de secciones. **Es un inventario de contenido que ella ya tiene escrito,
no un requerimiento cerrado de arquitectura de información.**

## Cómo leer su propuesta

Su texto mezcla tres cosas distintas:

1. **Un inventario de material existente** (el libro, la ciencia almática, protocolos,
   recursos) que todavía no tiene dónde vivir. No está pidiendo 6 secciones: está
   buscando casa para contenido que ya escribió.
2. **Una tesis de producto**, al final del texto, que sí es un requerimiento: la web
   tiene que responder cinco preguntas.
3. **Una lista explícita de lo que NO va ahora** (academia, blog, comunidad, niveles,
   libro completo, base de terapeutas, recursos descargables, investigación extensa).
   Eso libera la mitad del trabajo aparente.

### Las cinco preguntas (criterio de éxito de la v1)

1. ¿Qué es Cosmic Eagle?
2. ¿Qué tipo de experiencias ofrecen?
3. ¿Es seguro para mí?
4. ¿Cómo me preparo y qué pasa después?
5. ¿Cómo postulo?

Si esas cinco quedan bien respondidas, la página cumple su función. Todo el
conocimiento profundo se publica progresivamente (eso además mantiene la web viva y
ayuda al SEO).

## Mapeo a las rutas del sitio

| Sección de Sofía | Dónde vive | Estado |
|---|---|---|
| 1. Cosmic Eagle (quiénes somos, Estela, metodología, FAQ) | `/nosotros` | placeholder — falta texto de la clienta |
| 2. Experiencias (ceremonias, retiros, calendario, cómo postular) | `/viajes`, `/viajes/[id]`, `/viajes/[id]/solicitar` | **ya construido** |
| 3. Preparación e Integración | `/preparacion` | **única ruta nueva a construir** |
| 4. Biblioteca | `/contenidos` (categoría del hub) | **hub construido** (2026-08-18) — falta el contenido |
| 5. Ciencia Almática | `/contenidos` (categoría del hub) | **hub construido** (2026-08-18) — falta el contenido |
| 6. Testimonios | `/contenidos` (categoría) + bloque ya existente en la home | componente ya existe |

Nav resultante: **Inicio · Nosotros · Experiencias · Preparación · Contenidos · Mi Cuenta**.
Cinco links públicos, que entran en el header actual sin rediseñarlo y mapean casi 1:1
con las cinco preguntas. Ese es el argumento para presentarle el recorte a Sofía: no se
le quitan secciones, se le da una nav donde cada link responde una de *sus* preguntas.

(Nota: "Inicio" no figura como link en `NAV_LINKS` — al home se llega tocando el logo.)

## Decisiones tomadas

- **Ceremonias y retiros son ambos `trips`**, diferenciados por un campo `type`. No son
  dos secciones: son un filtro en el listado. Confirmado con el cliente 2026-07-30.
  **Implementado 2026-08-05** (migración `20260805191705_trip_type.sql`): enum
  `trip_type` con `retiro`/`ceremonia`, filtro `?tipo=` en `/viajes`, y desplegable en el
  link "Viajes" del navbar.
- **"Calendario" no es una vista nueva**: es el mismo listado de `/viajes` ordenado por fecha.
- **"Cómo postular" no es una página**: es un bloque de 3 pasos arriba del listado.
- **`/contenidos` es un hub de categorías**, no varios links de nav. Deja la nav en cinco
  y le da a Ciencia Almática lugar para crecer sin tocar la navegación. Confirmado 2026-07-30.
- **`/preparacion` es una sola página larga con índice lateral y anclas**
  (`#alimentacion`, `#contraindicaciones`, `#microdosis`…), no diez subpáginas. Además es
  la página que el formulario de solicitud y el consentimiento pueden linkear como
  lectura previa — resuelve dos pendientes con una pieza.
- ~~**Biblioteca y Ciencia Almática no llevan backend todavía**~~ **REVERTIDO 2026-08-18**: se
  construyó la tabla `articles` + CRUD en `/admin/contenidos` (ver `docs/CONTENIDOS.md`). Lo
  que cambió el criterio no es la cantidad de material sino el requerimiento: la clienta tiene
  que poder cargar textos e imágenes **sin tocar código ni deployar**, y un archivo de
  constantes obliga a un deploy por cada corrección.

## Contenido que hay que pedirle a Sofía / Estela

Es el camino crítico real — nada de esto se puede inventar (ver "No hacer" en CLAUDE.md).

- Texto de "quiénes somos", bio de Estela, metodología y FAQ.
- Los 5 bloques de Preparación y los 4 de Integración.
- Los ~20 recursos de Biblioteca, con categoría y link.
- Los ~10 conceptos de Ciencia Almática.
- Testimonios reales (video y escritos) con autorización de uso.
- La lista de opciones de "temas específicos" del formulario de salud (ver `docs/FORMULARIOS.md`).

## Segunda etapa (la propia Sofía lo difiere)

El Camino Evolutivo (niveles), Academia Cosmic Eagle, biblioteca completa, blog,
comunidad, eventos, formación, base de terapeutas, todos los capítulos del libro,
recursos descargables, protocolos completos, investigación científica extensa.
