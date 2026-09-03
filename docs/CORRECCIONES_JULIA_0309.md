# Correcciones de Julia — 03/09/2026

Entrega original copiada al repo el mismo día en
`docs/entregas/2026-09-03-julia/`: el pedido en texto
(`correcciones_web_3_sept.txt`), las dos capturas de testimonios (estado actual
vs. deseado, convertidas a WebP — los PNG originales de 2,2 MB quedaron en
`~/Escritorio/things/cosmic-eagle-material/entregas-julia/2026-09-03-correcciones/`)
y la carpeta **SECCION TECNOLOGIA DEL ALMA** con la v3 del fix mobile (HTML
autocontenido + design system + notas de implementación).

Es la aplicación de la regla que ya costó tres documentos: `~/Descargas` se
vacía sola.

## 1. Estado

| # | Pedido | Estado |
|---|---|---|
| 1 | Frase manifiesto en **2 líneas** en escritorio | hecho |
| 2 | La cartelera **se cierra** si se vuelve a tocar "Explorar experiencias" | hecho |
| 3 | El carrusel de la cartelera **más lento** | hecho (40s → 70s) |
| 4 | Descripción de la tarjeta a **3 líneas** con puntos suspensivos | hecho |
| 5 | **Título opcional** en el panel de experiencias | hecho |
| 6 | Sesiones de un día con **repetición de fechas** y elección del usuario | **NO** — ver §3 |
| 7 | Testimonios: **una pantalla**, título bold, filetes más largos, tarjetas rectangulares, imagen al pie visible también en mobile | hecho |
| 8 | Testimonios: la **línea negra** detrás de la barra de scroll | hecho |
| 9 | Testimonios: **250 caracteres** como máximo en el panel | hecho |
| 10 | Tecnología del Alma: **fix mobile v3** (caja al 100%, tipografía en `clamp`, filete de 80px) | hecho |
| 11 | Tecnología del Alma: título en **dos líneas** ("Tecnología Humana y / Ciencia del Alma") | hecho |
| 12 | `/nosotros`: los **dos botones del cierre** (píldora dorada + píldora de vidrio azul al 50%) | hecho |

## 2. Lo que no es obvio de cada uno

**La línea negra del scroll era global, no de testimonios.** `globals.css` tenía
`* { scrollbar-color: #e3c37d #0e0e0b }` — el riel en el negro de la paleta
vieja, detrás del pulgar dorado. Ahora el riel va **transparente** y toma el
fondo de la sección, sea el azul, el dorado de la cartelera o la crema.

**El botón de la cartelera alterna con un evento, no con el hash.** El
disparador ("Explorar experiencias") vive 400vh más arriba, dentro del sticky
del relato, y el panel se abría por `hashchange`. Al segundo click el hash ya
apuntaba ahí, así que no pasaba nada. Ahora el botón despacha un evento
cancelable (`COLLAPSIBLE_TOGGLE`, en `Collapsible.tsx`) y el panel alterna; el
salto lo hace el panel **sólo al abrir**. Si no hay ningún panel escuchando, el
evento vuelve sin cancelar y el botón se comporta como el ancla que es.

**El título de una experiencia es opcional pero nunca queda vacío.** La columna
es `NOT NULL` y el nombre se usa en el asunto de cada correo, en el panel, en la
pantalla del postulante y en el `<title>` de la página. Si la clienta lo deja en
blanco, el action lo **deriva** del tipo y la ciudad ("Sesión Cósmica en
Santiago"): describe sin inventar copy. **A confirmar con Julia**, porque su
pedido literal es no poner título.

**La tarjeta de testimonio es de alto fijo (225px) y más ancha que los 300px del
mockup.** El mockup se dibujó con placeholders de una línea; con 250 caracteres
reales, 300px de ancho no alcanzan para las seis líneas que entran en ese alto.
Quedó en 320px (mobile) / 360px (escritorio) — más rectangular, que es justo lo
que pide la corrección. El `line-clamp` es la red para los testimonios viejos:
**uno de los tres sembrados en la migración tiene 274 caracteres** y se recorta
con puntos suspensivos. No se editó: el texto es de la clienta.

**El tope de 250 no está en la base**, sólo en el formulario (`maxLength`) y en
el server action (`TESTIMONIAL_MAX_CHARS`, en `src/lib/testimonials.ts`). Un
CHECK en Postgres habría fallado con esa fila de 274.

**La sección de testimonios suma la altura del navbar a su padding de mobile.**
Mide una pantalla justa y la banda opaca le tapaba el título.

**El fix v3 de Tecnología es sólo mobile.** En escritorio no cambia nada salvo
el título de dos líneas, que es el mismo HTML en los dos. El `<br>` es fijo, no
un wrap por ancho: es decisión de diseño de la v2. El cuerpo va **negro puro**
en mobile y gris `#333` en escritorio, que es spec explícita de Julia.

**Los dos botones del cierre son la misma píldora con distinto relleno.** El
"liquid glass" entró como variante `glass` de `CtaLink`, no como clases sueltas:
el mismo par va a aparecer en otras pantallas. Ojo con pisar el fondo de una
variante desde `className` — dos degradés arbitrarios sobre la misma propiedad
los resuelve el orden de la hoja generada, no el orden en que se escriben.

## 3. Lo único que quedó afuera: la repetición de fechas

> *"las sesiones duran un solo día. actualmente el panel de control ofrece
> «fecha inicio» y «fecha fin». en su lugar, el panel debe dar la opción de
> agregar repetición de evento... el usuario ve las 3 opciones y selecciona el
> casillero de la fecha a la cual quiere solicitar inscripción."*

No es un ajuste de diseño: cambia el modelo de datos y el embudo de inscripción.
Hoy una sesión es **una fila de `trips` con una fecha**, y una solicitud apunta a
esa fila (`applications.trip_id`, con un índice único parcial que impide dos
solicitudes activas por viaje). Con repetición hacen falta, como mínimo:

- una tabla hija de fechas (`trip_dates`) o N filas de `trips` hermanadas;
- que la solicitud registre **a qué fecha** se postula, y que el índice único
  pase a ser por fecha y no por viaje;
- cupo por fecha, no por viaje;
- el correo [7] "Datos finales" y el programa por jornada, que hoy derivan de
  `start_date`.

Además **choca con una pregunta abierta desde el 06/08** que sigue sin
respuesta: si una Sesión es siempre de un día, el formulario debería pedir una
sola fecha más hora de inicio y fin. Ese cambio y este son el mismo trabajo y
conviene hacerlos juntos, una vez confirmado con Estela y Sofía.

## 4. Verificado

`tsc`, lint (los 2 errores de `multimedia/SlotEditor.tsx` son previos), build de
producción, los **17 tests públicos** y los **18 del panel** en verde, y medición
en Chrome real a 1440×900 y 390×844 sobre el build de producción:

- la frase manifiesto entra en **2 líneas exactas** en escritorio;
- "Voces de Luz" mide **exactamente una pantalla** (900/900 y 844/844), las
  tarjetas son 300–360 × 225 y la imagen del pie **se ve y termina con la
  pantalla** en los dos anchos (en mobile antes quedaba en cero);
- Tecnología del Alma entra en una pantalla en mobile (844/844), con el título en
  dos líneas y el cuerpo en negro;
- la cartelera va 0 → 876 → 0 px con dos clicks del mismo botón.

**Ojo al verificar en local**: si el servidor de producción quedó levantado de un
build anterior, sirve el HTML nuevo con el CSS viejo y las mediciones dan
cualquier cosa (una sección de 100svh midiendo 2415px). Hay que matarlo por
puerto (`fuser -k 3000/tcp`) — un `pkill -f "next start"` se lleva puesto al
propio shell, porque su línea de comando también contiene el patrón.

**Sin verificar end-to-end**: cargar una experiencia sin título desde el panel y
ver el nombre derivado, y cargar un testimonio de más de 250 caracteres para ver
el aviso.

## 5. Estado al cerrar la sesión (03/09, 18:50)

Las once correcciones están **mergeadas a `main` y en producción** (commits
`3214773` y `66134dc`), verificadas contra el sitio en vivo.

**Esperando respuesta de Julia** por tres cosas:

1. ~~**El desplegable de «Experiencias»**~~ — **CERRADO el mismo día**, ver §6.
2. **El título derivado de las experiencias** ("Sesión Cósmica en Santiago"
   cuando la clienta lo deja vacío): su pedido literal es no poner título, pero
   la columna es `NOT NULL` y el nombre se usa en el asunto de cada correo, en
   el panel y en el `<title>`.
3. **La repetición de fechas de las sesiones** (§3), que además necesita a
   Estela: es la misma decisión que la pregunta abierta desde el 06/08 sobre si
   una Sesión es siempre de un día.

De la entrega de Julia del 02/09 seguían abiertas, y siguen: el destino real de
"Contacta soporte", una foto pensada para la franja de Voces de Luz, y el tag de
tipo con texto blanco sobre dorado.

## 6. El desplegable de «Experiencias» — cerrado el 03/09

Sofía lo vio "medio cuadrado". Se auditó, se propusieron tres versiones (el
comparador con el navbar real y el hover funcionando quedó en
`~/Escritorio/desplegable-experiencias.html`, fuera del repo) y **Julia eligió la
opción 1 con un 30% menos de opacidad, "para darle menos peso al contenedor"**.
Mergeado a `main` y en producción.

**El hallazgo de la auditoría**: lo cuadrado venía de su propio mockup aprobado
(`.dropdown-experiences` de `homepage_correccion.html`) — fondo plano, radio
12px y dos bloques de texto sin ningún indicio de ser links, en un sitio donde
todo lo demás es degradé. No era una desviación nuestra.

Lo que quedó en el código:

- fondo en degradé de la familia del navbar y el footer, radio 18px, filete
  dorado con el rombo de cuatro puntas centrado bajo el link, separador entre
  los ítems y flecha que avanza en el hover;
- las opacidades que pidió Julia: `0.16 / 0.55 / 0.56` (eran `0.32 / 0.97 /
  0.98`). Fueron dos vueltas el mismo día — primero un 30% menos "para darle
  menos peso al contenedor" y después otro tanto, "que no parezca una caja
  sólida";
- **y tres correcciones a su propia spec, de las que nos habíamos apartado**: el
  panel va CENTRADO bajo el link (`left:50%`; teníamos `left-0`, colgando de una
  esquina), entra con 6px de desplazamiento además del fundido, y toma el copy
  de su mockup — el nuestro decía "Encuentros ceremoniales de un dia", sin
  tilde. `TRIP_TYPES[].description` sólo lo consume este desplegable.

**Ojo con la transparencia, que trae un caso que antes no existía.** El navbar
es fijo, así que el panel se abre sobre lo que haya debajo. Con la franja crema
de "Tecnología del Alma" atrás, el panel al 68% se aclaraba entero y la
descripción dorada al 70% se caía a ~2:1. Se arregla oscureciendo **lo de
atrás** (`backdrop-brightness-[0.45]`) y no subiendo la opacidad del panel, que
es justo lo que ella pidió bajar: el contenedor sigue liviano y deja ver el
fondo. Medido sobre la crema, que es el peor caso del sitio: descripción
**4,80:1** y título **7,99:1** (sobre el hero, 6,52:1 y 12,34:1). Si algún día se saca ese filtro, hay que
devolver la opacidad.

Verificado: `tsc`, lint, build, los 17 tests públicos, y el panel abierto sobre
los cuatro fondos que puede tocar (el hero de la home, `/viajes`, `/contenidos`
y la franja crema).
