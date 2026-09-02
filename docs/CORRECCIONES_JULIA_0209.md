# Correcciones de Julia — 2 de septiembre de 2026

Fuente: `docs/entregas/2026-09-02-julia-correcciones/` (`correcciones_web_2_sept.txt`
+ `calendariodeviajes_design.png`). Las referencias de diseño son el mockup
aprobado `docs/entregas/2026-09-02-julia/HOMEPAGE/homepage_correccion.html` y
`.../NOSOTROS/nosotros_corregida.html`.

Este documento cruza cada corrección contra el código actual: qué pide, qué hace
hoy la web y qué hay que tocar. El orden es de más barato a más caro.

## Estado (02/09, sin pushear)

**Los 15 puntos están implementados**, verificados en Chrome real a 1440×900 y
390×844. Lo único que queda abierto es el destino del link "Contacta soporte"
del modal, que Julia todavía no definió: se dejó sin linkear, con el mismo
criterio que los links apagados del footer.

Dos cosas que aparecieron al hacerlo y no estaban en la lista de ella:

- **La cascada de `Reveal` nunca funcionó.** `RevealItem` emitía siempre un
  `delay` en su transición, y cuando el padre orquesta con `staggerChildren`
  Framer implementa el escalón *como* ese delay: un `delay: 0` escrito a mano lo
  pisaba y los hijos entraban todos juntos. Los bloques que se veían escalonados
  lo lograban con retardos escritos uno por uno, no por el stagger. Medido:
  antes los siete elementos de la secuencia de palabras cruzaban a opacidad
  plena **en el mismo milisegundo** (777ms los siete); ahora escalonan de a
  185ms en escritorio y 330ms en mobile. De paso corrige la frase manifiesto de
  la home, cuya segunda línea entra ahora 168ms después de la primera, que es el
  `transition-delay: 0.15s` del mockup.
- **El gate no podía interceptar desde el burbujeo.** `next/link` maneja el
  click en su propio handler: cuando el evento llega al contenedor ya viene con
  `defaultPrevented` en true y la navegación del router ya arrancó. Va en la
  fase de captura, con `stopPropagation`.

## A. Tipografía y botones (transversal)

1. **Los links del navbar van en Domine.** Hoy `Header.tsx` los deja en
   `text-label-sm` sin `font-display`, así que heredan Montserrat del `body`.
   Alcanza con agregar la clase en el `<Link>` de escritorio, en el drawer y en
   el link de cuenta.
2. **"Unirme al círculo" es una píldora dorada con texto azul y Domine.** Hoy es
   un `CtaLink` con `rounded-xl` (8px) y `text-on-primary`. En el mockup
   (`.navbar-cta`) es `border-radius:50px`, degradé `135deg #f9d78f → #b3964b`,
   Domine bold 12px, `letter-spacing:1px`, color `#05125a`.
3. **Ese mismo botón se replica en tres lugares más**: "Explorar experiencias"
   (relato de la home), "Ir más profundo" de Nuestro propósito y "Ir más
   profundo" de Tecnología del Alma. En el mockup son `.about-btn-ghost`,
   `.proposito-btn` y `.tec-btn`: el **mismo** botón, sólo cambia el padding.
   → Conviene una variante nueva en `CtaLink` (`variant="pill"`) y usarla en los
   cuatro lugares, en vez de cuatro clases sueltas.
4. **Los indicadores de scroll van en Domine y más separados de la flecha.** Hoy
   `ImmersiveHero` escribe su propio hint (sin `font-display`, `gap-1`) y
   `ScrollHintButton` usa Domine pero con `gap-1`. El mockup: Domine 13px,
   `letter-spacing:3px`, `gap:8px`. Aplica a la home y a las tres pantallas de
   `/nosotros`.

## B. Navbar — el desplegable de Experiencias

Hoy es la caja oscura genérica (`bg-[#05060a]/95`, todo en Montserrat). El
mockup (`.dropdown-experiences`) lo quiere azul de la paleta:
`rgba(5,18,90,0.95)`, borde `rgba(249,215,143,0.2)`, radio 12px, ancho 320px,
**título en Domine dorado** y **descripción en Montserrat** a
`rgba(249,215,143,0.7)`. Cambio acotado a `Header.tsx`.

## C. Home

5. **La frase manifiesto tiene los colores invertidos.** El mockup pone la
   primera línea en crema (`--crema-claro`) y la segunda en dorado itálico;
   `page.tsx` hace exactamente lo contrario. Es un swap de dos clases.
6. **Falta el indicador de scroll de la sección About.** Después del botón
   "Explorar experiencias" el mockup anima por fade-in una flecha
   (`.scroll-ind`, `#aboutScrollInd`) que baja a la sección siguiente. No existe
   en el código.
7. **La cartelera arranca CERRADA y se abre con "Explorar experiencias".**
   ⚠️ **Esto revierte los tres últimos commits de `main`**, que justamente
   sacaron el botón y dejaron el calendario a la vista. Es la única corrección
   que contradice una decisión tomada acá: hay que confirmarla antes de tocarla.
   En el mockup es `toggleCartelera()` sobre `.cartelera-wrap` (max-height 0 →
   900px, 0.7s) y el botón desaparece mientras está abierta.
8. **El carrusel del calendario**, tres cosas (ver `calendariodeviajes_design.png`):
   - **Autoplay en desktop**, pausado al pasar el mouse
     (`.carousel-inner-scroll.playing`, `scrollLeft 22s linear infinite`, las
     tarjetas duplicadas y `translateX(-50%)`). En mobile se queda como está:
     arrastre manual.
   - **Fundido dorado en los bordes**: `mask-image` horizontal, transparente en
     el 0–8% y en el 92–100%. Hoy la fila no tiene máscara.
   - **Tarjeta distinta a la nuestra**: portada de alto fijo (150px), los dos
     tags juntos **debajo** de la portada (no superpuestos), el de tipo con
     degradé dorado y el de lugar en azul translúcido con borde, descripción a 4
     líneas, y el pie con "FECHA" en Domine dorado + flecha ↗ redonda. Hoy
     `TripCard tone="light"` pone los tags encima de la imagen y usa otro pie.
9. **Voces de Luz no se implementó según el diseño.** Hoy son tres tarjetas de
   vidrio en grilla. El mockup pide: título "Voces de Luz", subtítulo
   "LO QUE DICEN NUESTROS VIAJEROS" **entre dos líneas doradas**, un **carrusel
   arrastrable de nueve tarjetas** y, al pie de la pantalla, un **placeholder de
   imagen** integrado con un degradé de azules (`.testi-bottom-img`, con máscara
   de arriba). El contenido sigue saliendo de la tabla `testimonials`.
   → El placeholder de imagen implica un **slot nuevo de Multimedia**.
10. **Tecnología del Alma en mobile: la imagen se oculta por completo.** Hoy la
    imagen se apila arriba del texto en mobile. En el mockup `.tec-image` es
    `display:none` abajo de 768px.
11. **Los cuadros de texto sobre los banners entran por opacidad + movimiento
    sutil de abajo hacia arriba.** Afecta a `MediaStatement` (frase atmosférica
    y cierre), que hoy no anima.

## D. `/nosotros`

12. Los indicadores de scroll: mismo arreglo que el punto 4.
13. **La secuencia "liberar / recordar / reconectar / encarnar" corre demasiado
    rápido en mobile.** En el mockup los siete delays (0.1s → 1.2s) son los
    mismos en las dos versiones, pero en mobile las palabras se apilan en
    columna y entran casi juntas. Hay que estirar delays y duración abajo de
    768px.
14. **Última pantalla en mobile**: los dos botones ("Explorar experiencias" e
    "Ir más profundo") no quedan centrados con el texto, los márgenes laterales
    son muy chicos y el texto pasa de dos líneas. Pide achicar la tipografía en
    mobile para que entren en dos líneas. Los botones, además, tienen que usar
    el botón del punto 3.

## E. Gate de sesión

15. **Si alguien sin sesión toca una experiencia, se abre la tarjeta "¿Quieres
    seguir explorando?"**. El diseño ya está en el repo
    (`docs/entregas/2026-09-02-julia/tarjetas/`). Hoy la tarjeta linkea directo
    al detalle del viaje, que es público. Falta portar el modal y decidir el
    destino del link "Contacta soporte", que en el mockup es `#`.

## Lo que hay que preguntarle

- El destino real de **"Contacta soporte"** en el modal (¿mail?, ¿página de
  contacto?). Hoy el texto está sin linkear.
- El **placeholder de imagen** de Voces de Luz: quedó como slot editable
  (`home.voces.image`) con el asset viejo de fondo, que es oscuro y casi no se
  lee. Conviene que mande una foto atmosférica pensada para esa franja.
- El tag de tipo de la tarjeta va con **texto blanco sobre el degradé dorado**,
  que es lo que dice su mockup pero queda en contraste bajo. Se respetó su
  diseño; si molesta, el reemplazo es el mismo oro oscuro que ya usa "FECHA".

## Resuelto sobre la marcha

- **El punto 7** (cartelera oculta) contradecía los tres últimos commits de
  `main`, que la habían dejado a la vista. Ignacio confirmó el 02/09: gana Julia
  — el carrusel vive en la home pero cerrado, y lo despliega el botón.
