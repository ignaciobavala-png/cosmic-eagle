# Glosario ES → EN — Cosmic Eagle Journey

Escrito antes de traducir (etapa 2, 29/09/2026). Lo revisa Sofía.
Lo dudoso está marcado con ⚠️. `Cosmic Eagle` y `Estela` no se traducen.

## Términos de marca

| ES | EN | Nota |
|---|---|---|
| Cosmic Eagle / Cosmic Eagle Journey | Cosmic Eagle / Cosmic Eagle Journey | Nombre propio, no se traduce. |
| Estela | Estela | Nombre propio. |
| Viajes Cósmicos | **Cosmic Journeys** ⚠️ | Alternativa: dejarlo como nombre propio ("Viajes Cósmicos") para no perder la marca. Se traduce porque en el sitio siempre aparece como categoría ("Próximos Viajes"), no como firma. |
| Sesiones Cósmicas | **Cosmic Sessions** ⚠️ | Misma decisión que *Viajes Cósmicos*. |
| Portales de Transformación | Portals of Transformation | Título del hero de /viajes. |
| Voces de Luz | Voices of Light | Título de la banda de testimonios. |
| Nuestros Viajeros | Our Travelers | Título de la banda de testimonios de /viajes. |
| Nuestros Sanadores | Our Healers | Idem (home/viajes). |
| Sintoniza | **Stay in tune** ⚠️ | Encabezado del newsletter del footer. Alternativa: "Stay connected". |

## Términos de contenido

| ES | EN |
|---|---|
| ceremonia | ceremony |
| chamánico/a | shamanic |
| medicina ancestral | ancestral medicine |
| integración | integration |
| facilitador/a | facilitator |
| planta(s) de poder | plant medicine(s) |
| conciencia | consciousness |
| evolución | evolution |
| alma | soul |
| sabiduría cósmica | cosmic wisdom |
| conocimiento cósmico | cosmic knowledge |
| viajero/a | traveler |

## Tipos de experiencia (el `value` de la base NUNCA se traduce: `retiro` / `ceremonia`)

| Valor DB | Etiqueta ES | Etiqueta EN | Dónde |
|---|---|---|---|
| `retiro` (singular) | Viaje | Journey | navbar, tarjetas, detalle |
| `retiro` (plural) | Viajes | Journeys | navbar, carteleras |
| `ceremonia` (singular) | Sesión | Session | navbar, tarjetas, detalle |
| `ceremonia` (plural) | Sesiones | Sessions | navbar, carteleras |
| — | Retiro / Retiros ⚠️ | Retreat / Retreats | **Inconsistencia del castellano**: `ExperienceFilter` usa "Retiro(s)" mientras `trip-type.ts` usa "Viaje(s)" para el mismo tipo. Se preserva tal cual en ES (no se puede cambiar) y en EN se distingue igual: `Retreat(s)` en el filtro, `Journey(s)` en el resto. Sofía decide si se unifica. |

## Estados

| ES | EN |
|---|---|
| Cupos disponibles | Spots available |
| Cupo completo | Full |
| Finalizado | Completed |
| Abierto | Open |
| Con cuenta | Account required |
| Del programa | Program |
| Borrador | Draft |

## Categorías de la biblioteca

| ES | EN |
|---|---|
| Preparación & Integración | Preparation & Integration |
| Salud & Bienestar | Health & Wellbeing |
| Evolución & Conciencia | Evolution & Consciousness |
| Tecnología Humana | Human Technology |
| Testimonios | Testimonials |

## Categoría de audiencia de un viaje (`trip_category`)

| ES | EN |
|---|---|
| Solo mujeres | Women only |
| Solo hombres | Men only |
| Avanzados | Advanced |
| Mixto | Mixed (no se muestra) |

## Interface (se traduce)

Login → Log in · Registrarse → Sign up · Ingresar → Log in · Cerrar sesión → Log out ·
Volver → Back · Explorar → Explore · Ver la experiencia → View the experience ·
Contenidos → Content · Experiencias → Experiences · Nosotros → About us ·
Preguntas frecuentes → Frequently asked questions · Recuperar acceso → Recover access ·
Última actualización → Last updated · Próximamente → Coming soon

## Lo que NO se traduce en esta etapa (queda en castellano en /en)

Copy literal de la clienta: `site_content`, `trips`, `articles`, `faqs`,
`testimonials`, `legal_documents`, `payment_methods`, las páginas legales, las FAQs
de la home (`src/lib/home-faqs.ts`), el muro de contenidos
(`CONTENT_WALL_COPY`), el embudo (solicitar / salud / consentimiento) y los correos.
