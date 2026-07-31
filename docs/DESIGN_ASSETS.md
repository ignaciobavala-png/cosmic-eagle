# Assets de diseño — entrega de Julia (2026-07-30)

Carpeta original: `~/Descargas/frontend_eagle/ELEMENTOS, IMAGENES, ETC/`
**No está en el repo** (35 MB de PNG). Este documento es el mapeo de esa carpeta al código.

## Convención de la entrega

Una carpeta por página (`HOMEPAGE`, `NOSOTROS`, `VIAJES`), cada una con la misma tríada:

| Carpeta | Qué es | Cómo se usa |
|---|---|---|
| `EXAMPLE_<PAGINA>.png` | Mockup completo de la página | Referencia de layout end-to-end |
| `MICRO_SECCIONES/` (en VIAJES: `MICRO_SECTIONS/`) | El mockup cortado por sección, `<SECCION>_<PAGINA>.png` | Spec visual de cada bloque; el nombre **no siempre coincide** con el título visible (ver tabla de la home) |
| `ASSETS/` | Imágenes reales para producción | Lo que efectivamente va al código |

Assets globales en la raíz: `BACKGROUND.png` (1440×1080), `Footer.png` (1440×270), `LOGO.png` (1207×433, sin recortar — `public/logo.png` es este mismo con el alpha recortado), `PALETA Y TIPOGRAFÍAS` (+ `.png`).

El archivo `PALETA Y TIPOGRAFÍAS` es **exactamente el design system "Aetheric Mysticism" ya aplicado** en `globals.css`: mismos hex, Domine/Literata, radios 4–8 px, base 8 px, márgenes 64/20 px, container 1200 px. No hay nada nuevo que aplicar ahí.

## Chrome compartido (todas las páginas)

**Navbar**: logo lockup horizontal a la izquierda + `NOSOTROS · VIAJES · CONTENIDOS` (uppercase, tracking amplio) + CTA sólido dorado **"UNIRME AL CÍRCULO →"** a la derecha. Barra con fondo propio más oscuro que la página y borde inferior tenue. No hay link "Inicio" (coincide con lo que ya tenemos).

**Footer**: 4 columnas — logo | `EXPLORAR` (Retiros, E-book, Blog, Nosotros) | `LEGAL` (Privacidad, Términos de Servicio, Contacto, Soporte) | `SINTONIZA` (input de newsletter con botón de envío).

**Fondo**: gradiente vertical de página completa, azul celeste profundo arriba → casi negro abajo, con campo de estrellas encima. **No** es el `#131410` plano con blobs que tenemos hoy en `body::before`.

## HOMEPAGE (`EXAMPLE_Homepage.png`, 1440×4795)

| Orden | Micro-sección | Título visible | Componente actual | Assets |
|---|---|---|---|---|
| 1 | `NAVIGATION_HOMEPAGE` | — | `Header.tsx` | `LOGO.png` |
| 2 | `HERO_HOMEPAGE` | "WHEN THE SOUL IS READY, THE PATH APPEARS" + "Experiencias privadas de transformación y retiros en entornos exclusivos." + CTAs `EXPLORAR EXPERIENCIAS` (sólido) / `ACCESO COMUNIDAD` (ghost) + scroll hint `DESCUBRIR ⌄` | `HeroSection.tsx` | `BANNER_HERO_HOMEPAGE.png` (1536×768) |
| 3 | `ABOUT_US_1_HOMEPAGE` | **"Portales de transformación"** — carrusel de 3 imágenes en óvalo/arco, la central al frente y las laterales atenuadas detrás | *no existe* | `CARRUSEL_IMAGEN_1/2/3.png` |
| 4 | `ABOUT_US_2_HOMEPAGE` | "NUESTRA ESENCIA / Un camino de **Evolución Consciente**" — card glass grande a la izquierda + ícono de geometría sagrada (luna triple) a la derecha | `AboutSection.tsx` | `ICONO_ABOUTSECTION.png` (500×500) |
| 5 | `EXPERIENCIAS_HOMEPAGE` | **"Próximos Retiros"** + link `VER CALENDARIO COMPLETO →` — grilla de 3 cards de viaje | `RetreatsSection.tsx` (hoy es bento de 2) | portadas desde `trips` |
| 6 | `TESTIMONIALS_HOMEPAGE` | "Voces de Luz / LO QUE DICEN NUESTROS VIAJEROS" (con dividers a los lados) — 3 cards con avatar circular de inicial | `TestimonialsSection.tsx` | — |
| 7 | `Ebook_HOMEPAGE` | "LANZAMIENTO EXCLUSIVO / Comprende tu propio sistema energético" + maqueta del libro *Tecnología Humana — El manual del despertar* + 3 features con check + CTA `OBTENER E-BOOK` | `EbookSection.tsx` | — |

**Ojo con los nombres**: `ABOUT_US_1` es el carrusel y `EXPERIENCIAS` es la grilla de retiros. Los nombres de archivo no corresponden a los títulos.

**Card de viaje** (se repite en home y en `/viajes`): imagen de portada arriba con badge de ubicación superpuesto (`IBIZA, ESPAÑA` / `SEDONA, USA` / `TULUM, MÉXICO`), título serif, descripción corta, y pie con label `FECHA` + rango + botón circular de flecha ↗.

**No hay sección "Contenidos" en la home**, aunque `CONTENIDOS` sí está en el nav. Nuestro `ContentSection.tsx` no tiene equivalente en el diseño.

## NOSOTROS (`EXAMPLE_NOSOTROS.png`, 1440×3365)

| Orden | Micro-sección | Contenido | Assets |
|---|---|---|---|
| 1 | `NAVIGATION_NOSOTROS` | igual al resto | — |
| 2 | `HERO_NOSOTROS` | "Un espacio de luz y amor." + "+10 años acompañando transformaciones" + scroll hint `CONOCENOS ⌄` | `BANNER_HERO_NOSOTROS.png` (3072×2124) |
| 3 | `PROPOSITO_NOSOTROS` | Imagen ovalada a la izquierda + card glass "Un camino de **Evolución Consciente**" a la derecha | `IMAGE_NOSOTROS_PT2.png` (928×1232) |
| 4 | `METODOLOGIA_NOSOTROS` | Card de texto largo a la izquierda + imagen a la derecha. **Copy real de la clienta**, incluye la explicación sobre psilocibina | `IMAGE_NOSOTROS_PT3.png` (1612×948) |
| 5 | `NUESTRA_VISION_NOSOTROS` | Bloque centrado con estrella de 4 puntas, texto sobre "Niños de Luz" y CTA `EXPLORAR VIAJES` | — |

Es la página con más contenido real ya escrito: el mockup no usa texto de relleno.

## VIAJES (`EXAMPLE_VIAJES.png`, 1440×2309)

| Orden | Micro-sección | Contenido | Assets |
|---|---|---|---|
| 1 | `NAVIGATION_VIAJES` | igual al resto | — |
| 2 | `HERO_VIAJES` | "Retiros & Ceremonias" + "Descubrí el viaje ideal para vos" + CTAs `EXPLORAR DESTINOS` (sólido) / `NUESTRA METODOLOGÍA` (ghost) + `EXPLORAR ⌄`. Fondo: portal circular | `BANNER_HERO_VIAJES.png` (2912×1632) |
| 3 | `PROXIMOS_RETIROS_VIAJES` | Misma grilla de 3 cards que la home | portadas desde `trips` |
| 4 | `LLAMADO_VIAJES` | "¿Sentís el llamado?" + CTA claro `APLICAR PARA UN VIAJE` sobre imagen de partículas | `IMAGE_VIAJES_PT2.png` |

## Pendientes y decisiones abiertas

1. **Fondo global**: hay que reemplazar el `body::before` de 4 blobs por el gradiente vertical + estrellas del diseño. Definir si se hace en CSS puro o con `BACKGROUND.png` / `Footer.png` como capas.
2. **`trips` necesita `image_url`**: las cards del diseño tienen portada real. Hoy usamos `tripPlaceholderImage(id)`. Requiere migración + campo en el form del admin.
3. **Hero de la home está en inglés** mientras el resto de la página está en español. Confirmar con Julia/Estela si es intencional o si quedó del mockup.
4. **Contenido sensible**: el copy de `METODOLOGIA_NOSOTROS` menciona explícitamente psilocibina y dosificación. Confirmar con Estela antes de publicarlo — tiene implicancias legales según jurisdicción.
5. **Rutas del footer que no existen**: `Blog`, `Privacidad`, `Términos de Servicio`, `Contacto`, `Soporte`. Y el input de newsletter no tiene backend.
6. **Sin diseño**: `/contenidos` (está en el nav pero no hay mockup), `/cuenta`, detalle de viaje, formulario de solicitud, panel de admin. Los CTAs `UNIRME AL CÍRCULO`, `ACCESO COMUNIDAD` y `APLICAR PARA UN VIAJE` son los entry points a ese flujo — hay que decidir a dónde apuntan.
7. **Optimización de assets**: los PNG pesan entre 1 y 6 MB. Convertir a WebP/AVIF redimensionado antes de meterlos en `public/`. CLAUDE.md prohíbe binarios en git, así que hay que decidir `public/` (assets fijos de layout) vs Supabase Storage (contenido editable por la clienta).
8. ~~**Posible error de exportación**: `NOSOTROS/ASSETS/BANNER_HERO_NOSOTROS.png` y `VIAJES/ASSETS/IMAGE_VIAJES_PT2.png` son byte a byte el mismo archivo (md5 `ac7fd2fa…`)~~. **Resuelto (2026-07-31), no hay que preguntarle nada a Julia**: los mockups `HERO_NOSOTROS.png` y `LLAMADO_VIAJES.png` muestran las dos veces las mismas siluetas de partículas, o sea que la repetición es deliberada. En el código es **un solo archivo**, `public/img/almas-particulas.webp` (`IMAGES.almas`), usado por el hero de `/nosotros` y por la banda P6 de `/viajes`.
