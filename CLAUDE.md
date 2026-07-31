<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Cosmic Eagle Journey

Plataforma web para viajes de ceremonias ancestrales chamánicas. Cliente: Estela. Contacto de desarrollo: Ignacio Bavala.

## Estado actual (actualizado 2026-07-27)

- Supabase está integrado y en uso real: proyecto `hwayqsgwoaznfqofsyly`, `.env.local` con URL/anon key (gitignored, no en el repo), clientes tipados en `src/lib/supabase/` (`client.ts`, `server.ts`, `proxy.ts`), `proxy.ts` en la raíz refresca sesión
- Schema completo aplicado via migraciones (`supabase/migrations/`): `profiles` (+ `avatar_url`), `trips`, `applications_first_time`, `applications_returning`, `consents`, vistas `my_applications_*`, funciones `is_admin()`/`handle_new_user()` en schema `private`
- Bucket de Storage `avatars` (público, RLS por carpeta `{user_id}/...`) para foto de perfil, subida desde `/cuenta` con `AvatarUpload.tsx` + server action `updateAvatar`
- Auth funcionando en `/cuenta`: login + **registro** (email/password, toggle `?modo=registro`). Diseño: sin confirmación por mail — el gate real de acceso es la aprobación manual del admin. **Ojo**: el toggle "Confirm email" del dashboard de Supabase (Authentication → Sign In/Providers → Email) tenía este comportamiento activado por defecto y rompía el login (`email_not_confirmed` se mostraba como "Email o contraseña incorrectos"); se pidió desactivarlo — **verificar que siga desactivado** si vuelve a aparecer este síntoma. Login redirige directo a `/admin` si `profiles.is_admin`
- `/cuenta` logueado muestra **tarjeta de perfil** (avatar editable + nombre + email) y **panel de viajero**: viajes aprobados + tabla de "Mis solicitudes" con estado (via `my_applications_first_time`/`my_applications_returning` + `trips`, sin exponer datos de salud)
- Navbar (`Header.tsx`) muestra avatar + primer nombre en el link "Mi Cuenta" cuando hay sesión (fetch client-side, se actualiza con `onAuthStateChange`). Usa el **logo oficial** (`public/logo.png`, via `next/image`) en desktop, drawer mobile y footer. **No hay link "Inicio"**: al home se llega tocando el logo, tanto en el navbar como en la cabecera del drawer
- `/viajes` conectado a la tabla `trips` real (ya no es mock). La tarjeta entera linkea al detalle
- `/viajes/[id]` es la **página pública de detalle del viaje** (no requiere sesión): portada, estado, descripción y datos (fechas, duración, lugar, cupo, aporte) + `generateMetadata`. El CTA cambia según sesión: sin usuario va a `/cuenta?next=/viajes/{id}/solicitar`, con usuario va directo al form; si el viaje está `closed`/`completed` muestra aviso. **Ojo**: la policy `trips_select_public` deja leer *todos* los trips a `anon`, incluidos los `draft` — el filtro de borradores se hace en la página (404), no en RLS. Cualquier ruta pública nueva que lea `trips` tiene que filtrar igual
- Imagen de portada: `trips.image_url` + bucket `trip-images` (público, escritura solo admin via `private.is_admin()`), subida desde el form del admin (`uploadCover` en `admin/viajes/actions.ts`). Las tres lecturas (home, `/viajes`, detalle) hacen `trip.image_url ?? tripPlaceholderImage(trip.id)`, así que un viaje sin portada sigue funcionando. **Ojo**: `next.config.ts` tiene que listar el hostname de Supabase en `remotePatterns` o `next/image` rechaza las portadas — falla en runtime, no en build
- **Ojo con los grants de columna** (bug corregido el 2026-07-31, migración `20260731210000_fix_profiles_is_admin_grant.sql`): `revoke update (col) on tabla from authenticated` **no hace nada** si el rol tiene `UPDATE` a nivel tabla — Postgres avisa por WARNING y sigue. Así quedó abierta durante días una escalada de privilegios: con la policy `profiles_update_own` cualquier usuario logueado podía `update profiles set is_admin = true where id = auth.uid()` desde el browser. La forma correcta es `revoke update on <tabla> from authenticated` y después `grant update (<columnas permitidas>)`. Aplica a cualquier columna sensible que se agregue más adelante
- **Ojo con los buckets públicos**: una policy de SELECT abierta sobre `storage.objects` **no** hace falta para leer por URL (esa lectura no pasa por RLS) y lo único que habilita es listar el bucket entero (advisor `lint 0025`). En `trip-images` el SELECT está restringido a admin, que igual lo necesita porque el upsert de Storage exige INSERT + SELECT + UPDATE. `avatars` todavía arrastra la policy abierta, pendiente de corregir igual
- Formulario de solicitud de salud funcionando en `/viajes/[id]/solicitar` (primerizo/recurrente, elegido segun historial de aprobaciones del usuario)
- Panel de admin funcionando en `/admin` (protegido por `profiles.is_admin`): dashboard, CRUD de viajes, revisión de solicitudes (aprobar/rechazar/expirar). Un admin no puede aprobar/rechazar su propia solicitud (guard en `reviewApplication` + oculto en la UI)
- **Assets de diseño de Julia recibidos (2026-07-30)**: ver `docs/DESIGN_ASSETS.md` (mapeo de la carpeta a las rutas) y `docs/RECORRIDO.md` (el recorrido del negocio + las 8 primitivas visuales del sistema). La carpeta original está en `~/Descargas/frontend_eagle`, **fuera del repo**
- `/nosotros` **implementado** con el mockup de Julia y copy real de la clienta (hero + propósito + metodología + Nuestra Visión)
- `/viajes` **implementada sobre el mockup de Julia**: hero P1 (`hero-viajes.webp`) + grilla de `TripCard` (P4, la misma de la home) + banda de llamado P6 al pie. El CTA "Aplicar para un viaje" **ancla al listado** (`#proximos`), no linkea a un form: aplicar es siempre a *un* viaje concreto
- `/contenidos` dejó de ser placeholder: hospeda **provisoriamente** la sección "Contenidos" que estaba en la home (mock, CTAs sin destino), hasta cerrar `docs/CONTENT_MAP.md` con Sofía
- **Home parcialmente rediseñada**: hero sobre `PageHero` con el banner de Julia, carrusel "Portales de transformación" (`PortalsSection`) y "Próximos Retiros" **conectado a `trips` real** (antes eran dos tarjetas hardcodeadas con viajes inexistentes). Consultar Supabase desde la home la volvió dinámica (`ƒ`), ya no es prerender estático. Siguen mock `AboutSection`, `EbookSection` y `TestimonialsSection` (`ContentSection` se mudó a `/contenidos`)
- `pnpm build` (producción) verificado sin errores — listo para deployar en cuanto a código
- `app/api/keep-alive/route.ts` + `vercel.json` (cron diario 12:00 UTC) armados para que Supabase free tier no pause el proyecto por inactividad. Protegido con `CRON_SECRET`
- **Proyecto deployado en Vercel**: `cosmic-eagle` (org `ethoslogs-projects`), URL de producción `https://cosmic-eagle.vercel.app`. Env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `CRON_SECRET` cargadas en Development/Preview/Production. **Repo de GitHub conectado al proyecto de Vercel** (vía GitHub App, no webhook clásico) — cada push a `main` deploya solo a producción, no hace falta correr `vercel --prod` a mano
- **Newsletter "Sintoniza"**: el input del footer ya guarda. Tabla `newsletter_subscribers` (RLS: insert público para `anon`, select solo admin), server action `subscribeNewsletter`, y los correos se leen en `/admin/suscriptores` (tabla + botón de copiar al portapapeles). Es la **única tabla que escribe `anon`**: el insert está acotado por grant a la columna `email` y el formato lo valida un CHECK. Un mail repetido responde "listo" igual (no revela quién está suscripto). **No hay rate limit** — si aparece spam, el paso siguiente es un captcha o un límite por IP, no tocar la policy. El advisor `lint 0024` (`WITH CHECK (true)`) queda en WARN a propósito: cualquiera puede suscribirse, esa es la función
- Cuenta de prueba admin: ver `~/Escritorio/account/cosmic-eagle-acces.txt` (fuera del repo)

**Ya se puede escribir código que asuma conexión a Supabase** — el schema existe y está en uso. Antes de tocar RLS/funciones, revisar el checklist de seguridad del skill `supabase`.

## Stack

| Capa | Tech | Notas |
|---|---|---|
| Framework | Next.js 16 (App Router) | Turbopack |
| UI | React 19 + Tailwind CSS v4 | `@theme` tokens en globals.css |
| Animaciones | Framer Motion 12 | scroll reveal, drawer |
| Estado | Zustand 5 | solo UI (drawer), sin persist |
| Iconos | Lucide React | — |
| Fuentes | EB Garamond (headings), Montserrat (body) | next/font/google |
| Package | pnpm | — |
| Lint | ESLint 9 flat config | — |
| TypeScript | strict | — |
| Backend | Supabase (Postgres + Auth + Storage) | `@supabase/ssr`, RLS en todas las tablas y en `storage.objects`, ver `supabase/migrations/` |
| Deploy | Vercel | proyecto `cosmic-eagle`, repo conectado — auto-deploy en cada push a `main` |

## Estructura

```
src/
├── app/
│   ├── page.tsx                     # Home (6 secciones, 3 rediseñadas)
│   ├── layout.tsx                    # Root layout (fuentes, metadata)
│   ├── globals.css                   # Design system (colores, glass, scrollbar)
│   ├── not-found.tsx                 # 404 custom
│   ├── nosotros/page.tsx             # implementado (mockup de Julia + copy real)
│   ├── contenidos/page.tsx           # provisorio: la seccion mock que estaba en la home
│   ├── api/keep-alive/route.ts       # ping a `trips`, cron diario via vercel.json
│   ├── viajes/
│   │   ├── page.tsx                  # P1 + grilla P4 + P6, conectado a `trips` real
│   │   └── [id]/
│   │       ├── page.tsx              # detalle PUBLICO del viaje (sin login)
│   │       └── solicitar/
│   │           ├── page.tsx          # elige form primerizo/recurrente segun historial
│   │           ├── FirstTimeForm.tsx     # "use client"
│   │           ├── ReturningForm.tsx     # "use client"
│   │           └── actions.ts            # submitFirstTimeApplication / submitReturningApplication
│   ├── cuenta/
│   │   ├── page.tsx                  # login/registro (?modo=registro) + panel de viajero
│   │   ├── LoginForm.tsx             # "use client", soporta ?next=, ojito password
│   │   ├── SignupForm.tsx            # "use client", ojito password
│   │   ├── MisSolicitudes.tsx        # viajes aprobados + tabla de solicitudes propias
│   │   ├── AvatarUpload.tsx          # "use client", sube foto a bucket `avatars`
│   │   └── actions.ts                # login/signup/logout/updateAvatar
│   └── admin/                        # protegido por profiles.is_admin
│       ├── layout.tsx                # guard + AdminNav
│       ├── page.tsx                  # dashboard (stats + actividad reciente)
│       ├── viajes/                   # CRUD de trips
│       ├── suscriptores/             # lista del newsletter (solo lectura + copiar)
│       └── solicitudes/              # revision, aprobar/rechazar/expirar (bloquea auto-revision)
├── components/
│   ├── Header.tsx             # "use client" — nav desktop + drawer mobile
│   ├── PortalsSection.tsx     # "use client" — carrusel P8 de la home
│   ├── HeroSection.tsx
│   ├── AboutSection.tsx
│   ├── RetreatsSection.tsx
│   ├── ContentSection.tsx
│   ├── EbookSection.tsx
│   ├── TestimonialsSection.tsx
│   ├── Footer.tsx             # 4 columnas segun mockup (links sin ruta van apagados)
│   ├── NewsletterForm.tsx     # "use client" — alta al newsletter (useActionState)
│   ├── newsletter-actions.ts  # "use server" — subscribeNewsletter
│   ├── BackToTop.tsx          # "use client" — FAB scroll
│   └── ui/                    # primitivas del sistema visual de Julia
│       ├── PageHero.tsx           # P1 — hero de pagina
│       ├── DocumentCard.tsx       # P2 — card documento (golden glass)
│       ├── FeatureBlock.tsx       # P3 — par asimetrico texto/imagen
│       ├── TripCard.tsx           # P4 — tarjeta de viaje con portada
│       ├── ClosingSection.tsx     # P5 — cierre centrado + FourPointStar
│       ├── CallBand.tsx           # P6 — banda de llamado (imagen + titulo + 1 CTA)
│       ├── Reveal.tsx             # "use client" — scroll reveal aislado
│       └── CtaLink.tsx            # boton solido / ghost
└── lib/
    ├── constants.ts           # Mock data (solo home), imagenes, nav links, footer
    ├── format.ts              # formatDateRangeCompact (parsea `date` en UTC)
    ├── store.ts               # Zustand (drawerOpen)
    └── supabase/
        ├── client.ts           # browser client
        ├── server.ts           # server client (cookies)
        ├── proxy.ts            # helper de refresco de sesion
        └── types.ts            # tipos generados (Database)
proxy.ts                        # Next 16 middleware, en la raiz
vercel.json                     # cron diario -> /api/keep-alive
supabase/
├── migrations/                 # historial de schema, aplicado via MCP
└── seed.sql                    # datos de ejemplo para `supabase db reset`
public/
├── logo.png                    # logo oficial de la disenadora (914x267, alpha recortado)
└── img/                        # assets de Julia convertidos a WebP (11.4 MB -> 267 KB)
docs/
├── CONTEXT.md                  # Requerimientos del cliente + decisiones de alcance
├── RECORRIDO.md                # El recorrido del negocio + las 8 primitivas visuales
├── DESIGN_ASSETS.md            # Carpeta de assets de Julia mapeada a las rutas
├── CONTENT_MAP.md              # Secciones propuestas por Sofia mapeadas a las rutas
├── FORMULARIOS.md              # Google Forms originales de Estela + paridad con la app
├── ARCHITECTURE.md             # Stack y estructura planeada
├── DATA_MODEL.md               # Tablas de Supabase (implementadas)
└── ROLES.md                    # Admin, Solicitante, Viajero
```

## Design system

**"Aetheric Mysticism"** (confirmado por la diseñadora, aplicado 2026-07-30). Reemplaza al "Modern Mystical" anterior (dark void #03050F / gold #E5C278 / cyan #5DE6FF). Base cálida #131410, atmósfera azul "Midnight Celestial", oro champagne, glassmorphism.

- Todos los tokens en `@theme` dentro de `globals.css`, con los nombres de rol de Material
- **Ojo con el rol del oro**: en el set confirmado `primary` es `#fff6eb` (blanco cálido), NO el oro. El oro son `primary-fixed-dim` (`#e3c37d` — headings, bordes, íconos, acentos) y `primary-container` (`#f9d78f` — CTA sólido, con `text-on-primary`). Los componentes ya usan esos tokens; no volver a mapear `text-primary` a "dorado"
- El fondo **nunca es plano**: degradé vertical de documento completo (azul celeste `#0a2a52` arriba → negro `#05060a` en el pie) en `body`, más un campo de estrellas fijo de 5 capas en `body::before`. **Ojo**: `html` lleva `background-color` a propósito, para cortar la propagación del fondo de `body` al canvas — sin eso el degradé se dimensiona contra el viewport y el remate oscuro del pie no se ve nunca
- **Primitivas del sistema** en `src/components/ui/`: `PageHero` (P1), `DocumentCard` (P2), `FeatureBlock` (P3, par asimétrico texto/imagen), `TripCard` (P4), `ClosingSection` + `FourPointStar` (P5), `CallBand` (P6), más `CtaLink` y `Reveal`. Salen del mockup de Julia y son con las que se componen las páginas narrativas — antes de escribir una sección nueva, revisar si ya existe la primitiva (catálogo completo de las 8 en `docs/RECORRIDO.md` §4). Falta construir P7 (header con dividers, lo pide `TestimonialsSection`) y P8 vive todavía dentro de `PortalsSection`
- `Reveal` existe para que una sección con scroll reveal pueda seguir siendo Server Component: envuelve los hijos en el `motion.div` y deja el `"use client"` acotado al wrapper. Es lo que permitió que `RetreatsSection` consulte Supabase
- Fuentes: **Domine** (display/headings) + **Literata** (body), via `next/font/google`
- Escala tipográfica como tokens `--text-*`: `text-display-lg`, `text-headline-lg/md`, `text-body-lg/md`, `text-label-sm` (labels en mayúscula con tracking)
- Radios ajustados a la guía (4–8px para contenedores): `rounded-2xl` ahora es 8px, no 16px
- Layout: `max-w-narrative` (1200px), `px-gutter` (24px), `px-margin-mobile`/`px-margin-desktop` (20/64px), `py-section` (120px). **No** se cambió el `--spacing` base de Tailwind a 8px porque duplicaría cada `p-4` existente
- Utilidades custom: `glass-card` (golden glass: `#b3964b` al 10% + blur 20px + borde dorado), `glint-edge` (borde con degradé dorado, **opt-in** porque agrega `position: relative`), `aura-gold`/`aura-blue` (blobs locales), `text-shadow-glow`, `animate-float`
- Pendiente del spec, a la espera de assets de la diseñadora: sacred geometry, textura stardust, watermark del águila, inputs de solo borde inferior, dividers con estrella de 4 puntas, tinte azul en imágenes
- Imagenes mock via `lh3.googleusercontent.com` (AIDA), no optimizadas — usan `<img>`, next.config ya tiene el hostname

## Secciones de la home (todas mock)

| Seccion | Componente | Contenido |
|---|---|---|
| Hero | `HeroSection` | Titulo, subtitulo, 2 CTAs |
| About | `AboutSection` | Texto + imagen con glow |
| Retiros | `RetreatsSection` | Bento grid 2 cards (retiro + ceremonia) |
| Contenidos | `ContentSection` | 3 cards con offset vertical |
| E-Book | `EbookSection` | Maqueta 3D libro + features |
| Testimonios | `TestimonialsSection` | 3 cards con estrellas |

## Convenciones del proyecto

- Server Components por defecto, `"use client"` solo cuando hay interactividad o Framer Motion
- Sin CSS-in-JS, solo Tailwind
- `@/*` alias apunta a `./src/*`
- Sin testing, sin Docker
- Binarios en git: **solo assets fijos de layout** (logo, heros, imágenes de secciones narrativas), siempre convertidos a WebP y redimensionados, en `public/img/`. El contenido editable por la clienta (portadas de viajes, avatares) va a Supabase Storage. **A confirmar con Ignacio** — la regla anterior era "sin binarios en git", pero `public/logo.png` ya sentó el precedente
- Nav: horizontal en `md+`, hamburger + drawer solo en mobile
- Footer firma: "i.vavala"

## Lo que sigue

Hecho: proyecto Supabase, `.env.local`, clientes tipados, `proxy.ts`, migraciones, login + registro, redirect admin en login, `/viajes` conectado, detalle público de viaje (`/viajes/[id]`), formulario de solicitud (primerizo/recurrente), panel de admin (dashboard + CRUD viajes + revisión de solicitudes, con bloqueo de auto-aprobación), panel de usuario/viajero (`/cuenta`: tarjeta de perfil con avatar + viajes aprobados + estado de solicitudes), avatar de perfil (bucket `avatars` + upload), navbar personalizado (avatar + nombre), fix del bug de login por email sin confirmar, keep-alive (`app/api/keep-alive` + `vercel.json`, cron diario), build de producción verificado, **proyecto deployado en Vercel con auto-deploy conectado a GitHub** (`cosmic-eagle`, env vars cargadas).

**Arquitectura de contenido definida (2026-07-30)**: ver `docs/CONTENT_MAP.md` — mapeo de las 6 secciones que propuso Sofía sobre las rutas existentes. Resumen: ceremonias y retiros son ambos `trips` (con campo `type`), `/contenidos` es un hub de categorías (Biblioteca + Ciencia Almática + Testimonios), y la única ruta nueva a construir es `/preparacion`. Todo lo demás es contenido que hay que pedirle a la clienta.

**Formularios originales relevados (2026-07-30)**: ver `docs/FORMULARIOS.md`. Los forms de Google de Estela son 3 × 2 idiomas (salud primeriza, "Viajer@s"/recurrente, consentimiento) — "Travelers" es el inglés de Viajer@s, **no** un formulario de facilitadores. `FirstTimeForm`/`ReturningForm` coinciden 1:1 con los reales.

Pendiente, en orden sugerido:

1. **Consentimiento informado** — tabla `consents` ya existe en el schema pero no hay UI para completarlo. Los textos legales (5 bloques + 4 confirmaciones + firma) son de la clienta — **no están en el repo**, no inventar contenido (ver "No hacer"). Ojo: en el flujo real el consentimiento es un paso *posterior* a la solicitud, no parte del mismo form.
2. Comunicación admin → usuario (unidireccional, ver `docs/ROLES.md`).
3. **i18n ES/EN** — decidido: no traducir a mano string por string. Escribir todo en `es.json`, generar `en.json` una vez (o cuando cambien los textos) vía script que llama a una API de traducción (DeepL/LLM), revisar a mano los términos específicos (ceremonia, chamánico, etc.), servir estático con `next-intl` — sin llamadas a API en cada request.
4. Chatbot IA.

Decisiones abiertas que bloquean trabajo (detalle en `docs/FORMULARIOS.md`): cómo tratar a los recurrentes que ceremoniaron vía Google Forms (historial cero en Supabase → se les mostraría el form de primera vez), y si los Google Forms se apagan al salir la web o conviven un tiempo.

**Frontend de Julia, orden de trabajo (ver `docs/RECORRIDO.md` §5)**: hecho el chrome global (fondo + navbar + footer), `/nosotros`, `/viajes` completa (P1 + P4 + P6) y, de la home, el hero, el carrusel y Próximos Retiros conectado a `trips` con portada real. De las 8 primitivas solo falta P7.

Lo próximo, en orden:

1. **Compresor a WebP del lado del cliente** en el input de portada del admin. **No es por storage** (el free tier de Supabase aguanta ~200 viajes con el tope de 5MB): es porque `next/image` transformando un PNG de 5MB en frío cuelga la primera visita, justo la que hace la clienta al revisar el viaje que acaba de cargar. Canvas nativo, sin dependencias. **Antes de escribirlo, leer el skill `client-side-image-compress` de brain-data**: ya tiene la implementación resuelta (`compressImage()`), incluidos los dos detalles que se hacen mal solos — la orientación EXIF (las fotos de celular salen rotadas) y el fallback al original si `toBlob` falla. De yapa, pasar por canvas borra el EXIF, incluida la geolocalización.
2. Rediseñar las 3 secciones mock que quedan de la home: `AboutSection` (el asset `ICONO_ABOUTSECTION.png` es el único de la entrega de Julia sin convertir ni usar), `EbookSection` y `TestimonialsSection` — esta última es la que pide construir P7. En testimonios y en "Nuestra Esencia" **nuestro contenido es mejor que el del mockup** (personas reales vs. maqueta): se toma la forma de Julia, se conserva nuestro texto.
3. `/preparacion`, que con las primitivas ya construidas es composición pura.
4. `/contenidos` de verdad, cuando cierre `docs/CONTENT_MAP.md` con Sofía: hoy es la sección mock de la home mudada de lugar.

CTAs muertos que quedan: "Comprar Ahora" del e-book (no hay ruta ni checkout) y "Leer Más" de `AboutSection` (probablemente vaya a `/nosotros`).

Decisiones tomadas sola que hay que validar: el CTA **"Unirme al círculo"** del navbar apunta a `/cuenta?modo=registro` (con sesión se reemplaza por el avatar). El texto es de Julia pero **promete comunidad, que está fuera de alcance** (`docs/CONTEXT.md` §6) — confirmar con ellas. Los links del footer sin ruta (Blog, E-book, Privacidad, Términos, Soporte) se pintan apagados en vez de linkear a `#`.

No urgente pero pendiente: `/contenidos` es la sección mock de la home mudada de lugar, no una página propia. `/preparacion` no existe todavía.

## No hacer

- No inventar cuentas de Supabase ni connection strings falsos
- No crear rutas de API que asuman backend
- No modificar los textos legales del consentimiento (son de la clienta)
- No cambiar el flujo de aprobacion sin consultar (ver docs/CONTEXT.md:6)
