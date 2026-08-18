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
- **Recuperación de contraseña implementada** (rama `dashboard`): `/cuenta/recuperar` → mail → `/auth/confirm` (canjea `token_hash` por sesión) → `/cuenta/nueva-clave`. Ver `docs/AUTH_EMAIL.md`. **Ojo**: falta configurar las plantillas y las redirect URLs en el dashboard, sin eso el mail no llega a ningún lado. El mailer que trae Supabase **solo entrega a miembros de la organización**, así que sirve para probar con la cuenta de Ignacio pero a la clienta no le llega nada: para eso hace falta SMTP propio. No hace falta tener el dominio: alcanza con un proveedor que verifique una casilla suelta. Las plantillas de mail hay que pasarlas a `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=...`; el `{{ .ConfirmationURL }}` default usa PKCE y se rompe si el mail se abre en otro dispositivo
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
- `/contenidos` es el **hub de contenidos real** (2026-08-18): hero P1 + filtro por categoría + grilla de artículos de la tabla `articles`, con detalle en `/contenidos/[slug]`. Los carga la clienta desde `/admin/contenidos` (ver `docs/CONTENIDOS.md`). Reemplazó a la sección mock que se había mudado de la home
- **Home parcialmente rediseñada**: hero sobre `PageHero` con el banner de Julia, carrusel "Portales de transformación" (`PortalsSection`) y **dos bloques de viajes separados por tipo** — "Próximos Retiros" y "Próximas Ceremonias", los dos `TripsSection` con `trips` real (antes era una sola sección que los mezclaba, y antes de eso dos tarjetas hardcodeadas con viajes inexistentes). Cada bloque se omite entero si no hay viajes publicados de ese tipo. Consultar Supabase desde la home la volvió dinámica (`ƒ`), ya no es prerender estático. Siguen mock `AboutSection`, `EbookSection` y `TestimonialsSection` (`ContentSection` se borró al construir `/contenidos` de verdad)
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
│   ├── page.tsx                     # Home (7 secciones, 4 rediseñadas)
│   ├── layout.tsx                    # Root layout (fuentes, metadata)
│   ├── globals.css                   # Design system (colores, glass, scrollbar)
│   ├── not-found.tsx                 # 404 custom
│   ├── nosotros/page.tsx             # implementado (mockup de Julia + copy real)
│   ├── contenidos/
│   │   ├── page.tsx                  # hub: hero + filtro por categoria + grilla de articles
│   │   └── [slug]/page.tsx           # detalle publico del articulo
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
│       ├── retiros/                  # listado de trips type=retiro (usa viajes/TripsList)
│       ├── ceremonias/               # listado de trips type=ceremonia (idem)
│       ├── viajes/                   # CRUD de trips (form + actions). page.tsx redirige a /admin/retiros
│       ├── contenidos/               # CRUD de articles (form + actions), portada a site-assets
│       ├── suscriptores/             # lista del newsletter (solo lectura + copiar)
│       └── solicitudes/              # revision, aprobar/rechazar/expirar (bloquea auto-revision)
├── components/
│   ├── Header.tsx             # "use client" — nav desktop + drawer mobile
│   ├── PortalsSection.tsx     # "use client" — carrusel P8 de la home
│   ├── HeroSection.tsx
│   ├── AboutSection.tsx
│   ├── TripsSection.tsx       # viajes de la home, uno por `type` (retiros / ceremonias)
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
├── CONTENIDOS.md               # Articulos editables: /admin/contenidos -> /contenidos
├── EMAIL.md                    # Resend: mails que dispara la app (NO los de auth)
├── AUTH_EMAIL.md               # Mails de Supabase Auth (reset de clave)
├── consulta-sofia-acceso.txt   # Consulta pendiente sobre el "codigo de acceso"
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
- `Reveal` existe para que una sección con scroll reveal pueda seguir siendo Server Component: envuelve los hijos en el `motion.div` y deja el `"use client"` acotado al wrapper. Es lo que permitió que `TripsSection` consulte Supabase
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
| Retiros | `TripsSection type="retiro"` | Grilla P4 con `trips` reales (no mock) |
| Ceremonias | `TripsSection type="ceremonia"` | Grilla P4 con `trips` reales (no mock) |
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

### Sesión del 2026-08-05 — dónde retomar

Todo lo de abajo está **mergeado a `main` y deployado a producción** (verificado
contra el sitio en vivo). La rama `dashboard` quedó al día con `main`.

Entró: enum `trip_type` + desplegable Retiros/Ceremonias en el navbar, CRM en
`/admin/crm`, recuperación de contraseña por mail, favicon del águila.

**Lo primero al retomar — configurar los mails de auth en el dashboard de
Supabase.** Es lo único que quedó a medias a propósito: `/cuenta/recuperar` está
visible en producción pero **no manda nada** hasta tocar las plantillas y las
redirect URLs. Paso a paso completo en `docs/AUTH_EMAIL.md`. Ojo con el mailer
incluido: solo entrega a miembros de la organización de Supabase, así que sirve
para que pruebe Ignacio pero a la clienta no le llega — para eso hace falta SMTP
propio, que **no** depende de tener el dominio.

**A validar con Estela y Sofía** (todo anotado en `docs/CRM.md` §6):
- Los umbrales de Avanzado y Experto del CRM (hoy 10 y 20) están **inventados**:
  ella solo dio los tres primeros. Marcados como provisorios en `src/lib/crm.ts`
  y al pie de `/admin/crm`.
- La cuenta de ceremonias toma el máximo entre las aprobadas en la plataforma y
  las declaradas en el form de recurrente, para no clasificar como "nuevo" a
  quien viene ceremoniando por Google Forms.
- De dónde salen género, cargo y país (¿los carga el admin o se piden al
  registrarse?). Sin eso, dos de los cuatro ejes del CRM no existen.
- Cupones e invitaciones: documentados en `docs/CRM.md` §5, **sin implementar**.
  Bloqueado porque la plataforma no cobra.

### Sesión del 2026-08-06 — programa de ceremonias (MVP para la reunión)

Estela mandó una foto de la slide 6 de 8 del flyer que hoy reparten por
WhatsApp: "Programa" (grilla hora + actividad), el aporte en USD y un párrafo
con las condiciones de reserva. La foto está en `~/Descargas/retiros.jpeg`,
**fuera del repo**. Se implementó el MVP para mostrar en reunión que las
ceremonias se programan solas, aparte de los retiros:

- Migración `20260806153000_trip_program.sql`: `trips.schedule` (jsonb, array de
  `{time, activity}`, con CHECK de que sea array) y `trips.terms` (texto libre de
  las condiciones). **Elegido jsonb y no una tabla hija**: son ~6 filas que se
  editan siempre juntas desde el mismo form.
- `ScheduleEditor.tsx` en el admin: filas hora + actividad, agregar/quitar. Viaja
  al server action como **un solo campo** con el JSON serializado, y el action lo
  revalida con el mismo parser que usa la lectura (`src/lib/trip-schedule.ts`) y
  lo guarda ordenado por hora.
- `/viajes/[id]` muestra la sección "Programa" (se omite si no hay horarios) y el
  aporte + condiciones al pie del panel lateral.
- La home quedó partida en dos bloques por tipo (ver arriba).
- La ceremonia de prueba "Equinoccio Galactico" quedó cargada con el programa del
  flyer y pasó a ser de **un solo día** (`end_date = start_date`), que es lo que
  dice el flyer: 11:00 a 21:00. Mismo cambio en `supabase/seed.sql`.

**Ojo, el cobro sigue sin existir**: el flyer dice "pago del 50% para reservar
cupo" y la web sólo *muestra* esa condición como texto. Es la misma pared que
tiene bloqueados cupones e invitaciones (`docs/CRM.md` §5).

**A validar en la reunión**: si las condiciones (seña, reembolso) son iguales
para todos los viajes conviene sacarlas de `trips` y dejarlas fijas en la página;
hoy se cargan por viaje, que es lo flexible pero obliga a reescribirlas cada vez.
Faltan además las otras 7 slides del flyer para saber qué más comunican (qué
incluye, quién facilita, requisitos previos).

### Sesión del 2026-08-06 (bis) — el admin separa retiros de ceremonias

`/admin/viajes` era un único listado donde el tipo era un `<select>` al pie del
form, cuyo texto de ayuda decía "define en qué solapa aparece". Eso no
diferenciaba nada. Ahora:

- **Dos secciones en el nav**: `/admin/retiros` y `/admin/ceremonias`. Son dos
  `page.tsx` de tres líneas que comparten `viajes/TripsList.tsx` (mismo listado,
  filtrado por `type`). **La tabla sigue siendo una sola** y no hay que partirla:
  comparten fechas, cupo, portada, estado, solicitudes, revisión y CRM — separarla
  duplicaría RLS, las vistas `my_applications_*` y el panel de revisión.
- `/admin/viajes` quedó como redirect a `/admin/retiros`, para links viejos.
- **El tipo se elige antes del form y no se edita**: se entra por "Nueva
  ceremonia" (`/admin/viajes/nuevo?tipo=ceremonia`), viaja como hidden, y
  `updateTrip` **relee el tipo de la base e ignora el del form** — un retiro no
  se convierte en ceremonia por un campo oculto manipulado.
- `src/lib/trip-type.ts` centraliza etiquetas, rutas y copy por tipo. Antes
  `TYPE_LABEL` estaba copiado en tres archivos (admin, detalle público,
  `TripCard`); los tres consumen ahora `tripTypeLabel`/`isTripType`.
- El dashboard cuenta retiros y ceremonias por separado.

**Lo que falta y depende de la reunión** — el form todavía pide lo mismo para los
dos, y no debería:

1. **¿Una ceremonia es siempre de un día?** Si sí, se le pide una sola fecha más
   hora de inicio y fin (el flyer dice 11:00 a 21:00) y `end_date` se deriva. Hoy
   hay que poner la misma fecha dos veces y **no hay campo de hora**.
2. ~~**¿Un retiro contiene ceremonias adentro?**~~ **RESUELTO 2026-08-15**: sí las
   contiene (3 por retiro), pero **el conteo de experiencia es por viaje**: un
   retiro suma 1, no 3. Ellas quieren "un viaje" como parámetro. O sea que el
   cálculo de `/admin/crm` **ya era correcto** — no había bug.
3. ~~**¿El programa de un retiro va por jornada?**~~ **HECHO 2026-08-15**, ver la
   sesión de esa fecha más abajo.

También quedó pendiente de la lista anterior: "qué incluye" (traslado, comidas,
alojamiento) no existe como campo y es típico de retiro, no de ceremonia.

### Sesión del 2026-08-12 — multimedia y textos editables desde el admin

Nueva sección `/admin/multimedia`: la clienta y Sofía cambian imágenes y textos
de las páginas públicas sin tocar código. Detalle completo en `docs/MULTIMEDIA.md`.

- **El código declara qué slots existen** (`src/lib/site-content.ts`), la tabla
  `site_content` guarda solo overrides. Sección nueva = agregar entradas al
  registro, sin migración ni tocar la UI del admin. Sin fila, renderiza el asset
  del repo.
- Bucket `site-assets` (escritura solo admin) + compresor a WebP en el browser
  (`src/lib/compress-image.ts`) — el punto 1 de "lo próximo" que estaba pendiente,
  hecho acá. Falta aplicarlo también al input de portada de viajes.
- **`updateTag` y no `revalidateTag`**: en Next 16 el segundo pide un `profile` y
  sirve el valor viejo mientras revalida. Acá la clienta guarda y mira enseguida.
- La lectura usa un cliente **sin cookies**: `unstable_cache` no admite `cookies()`
  adentro del scope cacheado.
- **Colores: decidido NO hacer editor libre.** Si hace falta, presets de paleta
  completos en código, no ~50 pickers. Razonamiento en `docs/MULTIMEDIA.md`.

Verificado: build de producción, render público con los valores por defecto, y
las policies (probadas con `set role`: `anon` y un usuario logueado no admin no
pueden escribir; el admin sí, y el trigger registra el autor). **Sin verificar
end-to-end**: el guardado desde el panel logueado (subir imagen, ver el cambio en
el sitio) — requiere iniciar sesión, que la hace Ignacio.

Lo próximo, en orden:

0. **Adaptar el form por tipo**, con las tres respuestas de arriba.
1. **Compresor a WebP del lado del cliente** en el input de portada del admin. **No es por storage** (el free tier de Supabase aguanta ~200 viajes con el tope de 5MB): es porque `next/image` transformando un PNG de 5MB en frío cuelga la primera visita, justo la que hace la clienta al revisar el viaje que acaba de cargar. Canvas nativo, sin dependencias. **Antes de escribirlo, leer el skill `client-side-image-compress` de brain-data**: ya tiene la implementación resuelta (`compressImage()`), incluidos los dos detalles que se hacen mal solos — la orientación EXIF (las fotos de celular salen rotadas) y el fallback al original si `toBlob` falla. De yapa, pasar por canvas borra el EXIF, incluida la geolocalización.
2. Rediseñar las 3 secciones mock que quedan de la home: `AboutSection` (el asset `ICONO_ABOUTSECTION.png` es el único de la entrega de Julia sin convertir ni usar), `EbookSection` y `TestimonialsSection` — esta última es la que pide construir P7. En testimonios y en "Nuestra Esencia" **nuestro contenido es mejor que el del mockup** (personas reales vs. maqueta): se toma la forma de Julia, se conserva nuestro texto.
3. `/preparacion`, que con las primitivas ya construidas es composición pura.
4. ~~`/contenidos` de verdad~~ **HECHO 2026-08-18**, ver `docs/CONTENIDOS.md`. Falta el contenido en sí: la clienta tiene que cargar los artículos.

CTAs muertos que quedan: "Comprar Ahora" del e-book (no hay ruta ni checkout) y "Leer Más" de `AboutSection` (probablemente vaya a `/nosotros`).

Decisiones tomadas sola que hay que validar: el CTA **"Unirme al círculo"** del navbar apunta a `/cuenta?modo=registro` (con sesión se reemplaza por el avatar). El texto es de Julia pero **promete comunidad, que está fuera de alcance** (`docs/CONTEXT.md` §6) — confirmar con ellas. Los links del footer sin ruta (Blog, E-book, Privacidad, Términos, Soporte) se pintan apagados en vez de linkear a `#`.

No urgente pero pendiente: `/preparacion` no existe todavía.

### Sesión del 2026-08-15 — el boceto de Sofía, programa por jornada y Resend

**Sofía mandó la estructura completa del sitio con todos los textos**:
`web-cosmic-journey-ES.md`, en `~/Descargas`, **fuera del repo**. Es el documento
más importante que entró hasta ahora. Traducción de nombres:

| Sofía | Nosotros |
|---|---|
| Sesiones Cósmicas (1 día) | `type = ceremonia` |
| Viajes Cósmicos (1 semana) | `type = retiro` |

Trae en anexos los **textos completos de FAQs** (dos juegos, uno por tipo) y de
**Privacidad y Confidencialidad**. Eso ya **no hay que pedirlo** — sacarlo de la
lista de "contenido que falta" de `docs/CONTENT_MAP.md`.

**Ojo con el nombre "Viajes"**: hoy `/viajes` es el paraguas de los dos tipos. En
el vocabulario de Sofía, "Viaje Cósmico" nombra **solo al retiro**. Si se adopta su
nomenclatura, el paraguas se queda sin nombre — hay que decidir (`/experiencias`,
o partir en dos rutas). Sin resolver.

Lo que confirmó Ignacio de ese documento:

- **El conteo de experiencia es por viaje.** Un retiro tiene 3 ceremonias adentro
  pero suma 1 al historial. El CRM ya lo hacía bien.
- **El "código de acceso" queda EN REVISIÓN, no implementar.** Consulta escrita
  para Sofía en `docs/consulta-sofia-acceso.txt`. Lo que sí se sabe: postularse ya
  exige sesión (`viajes/[id]/solicitar/page.tsx`), así que el token siempre cae
  sobre una cuenta que existe — **no es un login alternativo**. La duda es si
  aporta algo por encima del botón "aprobar" que ya está en `/admin/solicitudes`.
- **El cobro sigue sin resolverse.** Hay charla con la clienta la semana del
  17/08 para presentarle opciones. Sigue bloqueando cupones, invitaciones y la
  seña del 50%.

**Programa por jornada (hecho).** Migración `20260815104000_trip_schedule_by_day.sql`
(solo el comment: **no hubo datos que migrar**). `ScheduleItem` pasó a
`{day, time, activity}`:

- `day` = número de jornada, 1 = `start_date`. `null` en ceremonias, que siguen
  siendo la lista plana de horas de siempre.
- `time` es opcional **solo** cuando hay `day`: un retiro tiene jornadas que son
  "Integración" a secas.
- Los items viejos `{time, activity}` siguen siendo válidos y se leen como jornada
  nula — por eso no hubo que tocar ningún viaje cargado.
- **La fecha de cada jornada no se guarda, se deriva** de `start_date`
  (`formatScheduleDay` en `format.ts`). Guardarla dejaría el programa desfasado en
  cuanto se corra la fecha del viaje.
- `ScheduleEditor` se bifurca por tipo: el retiro suma la columna Día con la fecha
  derivada debajo, y las filas nuevas heredan la jornada de la anterior.
- `start_date` en `TripForm` pasó a **controlado** para que esa fecha siga al campo.

**Resend integrado, pero no manda nada todavía.** Ver `docs/EMAIL.md`. Faltan las
tres cosas de ahí; la primera es el DNS. `sendEmail` sin `RESEND_API_KEY` loguea y
devuelve `not_configured`, no falla.

**Son dos canales distintos y se confunden fácil**: los mails de *auth* (reset de
clave) los manda Supabase por SMTP, los de la *app* (aprobación) salen por el SDK
de Resend. Misma cuenta, configuración separada.

Cuatro decisiones que parecen rebuscadas y **no hay que "limpiar"** (salen de las
skills `react-email-resend` y `email-boton-fondo-blanco-mobile` de brain-data):
cliente lazy (a nivel de módulo **tumba el build de Vercel**, no solo el mail),
`sendEmail` que nunca lanza, fondos con atributo `bgcolor` en `<table>` además del
CSS (`bgcolor` **no existe** en los tipos de `<td>`), y metas `color-scheme` en el
`<Head>`. Detalle completo en `docs/EMAIL.md`.

**El dominio `cosmiceaglejourney.com` ya existe** (verificado por DNS): Cloudflare
+ MX de Google Workspace + un A a `5.181.161.73`, que es **el sitio viejo que este
proyecto reemplaza**.

- **Mandar mails NO depende del cutover**: se verifica un subdominio
  (`mail.cosmiceaglejourney.com`) con TXT/DKIM propios, sin tocar el A ni el MX
  raíz. El sitio viejo y el correo de ellas siguen intactos.
- Fusionar el SPF si ya hay un `v=spf1` de Workspace: DNS respeta **uno solo**.
- **El acceso al Cloudflare es el camino crítico** — misma llave para el mail ahora
  y para mudar el sitio después. Pedirlo temprano.
- Antes del cutover hace falta la **lista de URLs del sitio viejo** para redirigir
  las indexadas (`redirects` en `next.config.ts`).
- `docs/AUTH_EMAIL.md` decía "no hace falta el dominio, alcanza una casilla suelta":
  **corregido**, eso no aplica a Resend, que exige dominio verificado.

Lo próximo de este hilo, en orden:

1. **Campos nuevos de `trips`** que pide el documento y no existen: país y ciudad
   separados (hoy `location` es texto libre), **categoría** (mujeres / hombres /
   mixto / avanzados), horarios de inicio y fin, tipo de establecimiento, qué
   incluye, ubicación/mapa, llegadas y salidas, qué llevar, política de cancelación.
2. **FAQs y Privacidad**, que ya vienen escritas en los anexos.
3. Cablear `sendEmail` a `reviewApplication`, cuando esté el DNS.

**Sin verificar end-to-end** (requiere sesión, la hace Ignacio): cargar un retiro
con programa por jornada desde el panel y verlo en la página pública.

### Sesión del 2026-08-18 — flujo de inscripción de Sofía, mail de aprobación y casilla interna

Sofía mandó `flujo-inscripcion-cosmic-eagle.md` (en `~/Descargas`, **fuera del
repo**): los 9 pasos del proceso manual de inscripción que hoy hacen por WhatsApp.
Comparación completa contra el código en **`docs/FLUJO_INSCRIPCION.md`**, que además
cruza ese documento con el boceto de estructura (`web-cosmic-journey-ES.md`, que **no
es nuevo**, entró el 15/08). Resumen: coinciden 2 de 9 pasos, faltan 5 enteros
(pago, saldo, preparación, consentimiento, logística, integración) y **el orden no
es el mismo** — en su proceso el pago va antes del formulario de salud.

Dato que sale del cruce: el anexo de Privacidad aclara que el **código de acceso es
un gate de contenido por nivel de experiencia**, no un login ni un reemplazo del
botón "aprobar". Responde en parte `docs/consulta-sofia-acceso.txt`.

Implementado (ver **`docs/NOTIFICACIONES.md`**):

- **El mail de aprobación quedó cableado.** `reviewApplication` manda
  `SolicitudAprobada` sólo en la transición a `approved` (relee el estado anterior
  para no remandar), después del update y sin poder tumbar la aprobación. **Sigue
  sin salir hasta verificar el dominio en Resend**, pero ahora el "no salió" se
  registra en la casilla interna en vez de morir en los logs de Vercel.
- **Casilla de avisos internos**: migración `20260818130000_admin_notifications.sql`,
  campanita con contador en el nav y `/admin/notificaciones`. Tres tipos:
  solicitud nueva, solicitud que **requiere revisión manual** por salud, y mail
  fallido. Los dos primeros los escribe un **trigger `security definer`** (el
  postulante no puede escribir en esa tabla), el tercero el código.
- La regla de "requiere revisión manual" (`health_condition || substance_use ||
  trauma`, o `new_treatment`) ahora está escrita **dos veces**: en el trigger y en
  `needsManualReview` del detalle. Están comentadas cruzadas; si cambia una, cambia
  la otra.

Verificado: build de producción, trigger probado con inserts reales (los dos tipos,
con y sin banderas) y borrados después, RLS probada con `set role` (`anon` y usuario
no admin ven cero filas), advisors sin novedades. **Sin verificar end-to-end**
(requiere sesión, la hace Ignacio): ver la campanita y marcar leído desde el panel.

### Sesión del 2026-08-18 (bis) — experiencias 2026 cargadas y estándar de portadas

**Las 6 experiencias del flyer están cargadas** con precio, descripción, programa y
condiciones. Análisis del texto, decisiones y lo que quedó pendiente en
**`docs/EXPERIENCIAS_2026.md`**. Lo que hay que recordar: Santiago se partió en dos
ceremonias (3 y 4 de octubre son dos flyers distintos), el precio de Santiago es una
**conversión aproximada de CLP a USD** que hay que confirmar, y quedaron dos viajes
en `open` **sin ningún dato** porque no están en el documento (Ceremonia en Tulum
del 7/11 y Ceremonia en Santiago del 5-6/12).

**Estándar de portadas** (ver **`docs/PORTADAS.md`**): una sola imagen, guardada en
16:9, recortada desde el centro por cada uso — 4:3 en la tarjeta, 21:9 en el banner
del detalle. De ahí sale la regla de la **zona segura: el 75% central de los dos
ejes**, que el form del admin dibuja sobre la preview.

- `src/components/ui/TripCover.tsx` es **la única pieza que decide el recorte**.
  Antes la tarjeta y el banner tenían cada uno su markup y su alto, y por eso se
  veían distintos.
- Los altos van por `aspect-ratio` y **no en píxeles**: con alto fijo el recorte
  cambia con el ancho del viewport.
- El recorte se hace **al subir** (`compressImage(file, maxPx, aspect)`, tercer
  parámetro nuevo), no al mostrar: lo que la clienta ve en la preview es
  literalmente lo que se guarda. Esto cierra el punto 1 de "lo próximo" del 12/08.
- El banner del detalle pasó de `<img>` a `next/image` con `priority`: era la
  imagen más grande de la página y la única sin optimizar.

**UX del panel**: el nav de secciones pasó de fila horizontal a **desplegable**
(con siete secciones ya no entraba, y abajo de `xl` caía a una segunda fila con
scroll que escondía secciones sin avisar). `/admin/multimedia` pasó a **acordeón**
(`<details>` nativo, sin estado de React) y sumó la sección **"Portadas de
viajes"**: se sube la portada de cualquier viaje sin entrar a editarlo. Es la única
sección del panel que no sale del registro de slots — vive en `trips.image_url`.
Las dos pantallas que suben portada comparten `src/lib/trip-cover.ts`.

**Sin verificar end-to-end** (requiere sesión, la hace Ignacio): el desplegable, el
acordeón y subir una portada desde Multimedia.

### Sesión del 2026-08-18 (ter) — contenidos editables, portales que giran y una prueba de fondo revertida

Todo lo de abajo está **mergeado a `main` y deployado a producción**.

#### 1. `/contenidos` dejó de ser mock

Nueva sección `/admin/contenidos`: la clienta carga artículos (título, bajada,
portada, categoría, texto) y salen publicados en `/contenidos` y
`/contenidos/[slug]`. Detalle y decisiones en **`docs/CONTENIDOS.md`**.

- Migración `20260818160000_articles.sql`: tabla `articles` + enums
  `article_category` (biblioteca / ciencia / testimonios, las tres del hub de
  `docs/CONTENT_MAP.md`) y `article_status` (draft / published).
- **El borrador no sale de la base**: la policy pública es
  `using (status = 'published')` y el admin ve todo por una segunda policy. Es a
  propósito distinto de `trips`, donde el filtro de borradores lo hace cada
  página y hay que acordarse en cada ruta nueva.
- **No es `site_content`**: ahí el código declara cuántos slots hay; acá la
  cantidad de artículos la decide la clienta. Lo que sí es slot es el hero de
  `/contenidos` (imagen + título + bajada), que se edita desde Multimedia.
- `published_at` lo **sella el trigger** la primera vez que se publica y no se
  vuelve a tocar: corregir una coma de un texto viejo no debería mandarlo arriba
  del listado.
- El cuerpo es **texto plano con dos reglas** (línea en blanco = párrafo, `## ` =
  subtítulo) y se renderiza como texto dentro de `<p>`/`<h2>`. Nada de HTML del
  formulario: no hay sanitizador en el proyecto y sería un XSS almacenado.
- Las portadas van al bucket `site-assets` bajo `articles/`, recortadas a 16:9 en
  el browser con el mismo `compressImage` de las portadas de viaje.
- `ContentSection.tsx` y `CONTENT_CARDS` **borrados**: eran las tres tarjetas mock
  que ocupaban la página.

Esto **contradice a propósito** una decisión vieja de `docs/CONTENT_MAP.md`
("Biblioteca y Ciencia Almática no llevan backend todavía, un archivo de
constantes alcanza"): lo que cambió no es la cantidad de material sino el
requerimiento — cargar contenido sin tocar código ni deployar. Anotado también
allá.

#### 2. Los portales de la home giran solos

`PortalsSection` ya animaba, pero solo al tocarlo. Ahora rota en círculo cada 5s.

- Se frena mientras el puntero está encima o el foco adentro (`onFocusCapture`,
  porque el foco cae en los botones y no en el contenedor), cada avance o click
  reinicia la espera, y `prefers-reduced-motion` corta el giro automático.
- El óvalo que cambia de lado al cerrar la vuelta **no se desliza por el medio**:
  se repone del otro extremo con un fundido (`x: { duration: 0 }` + keyframes de
  opacidad). Con click suelto casi no se notaba; girando solo pasaba cada vuelta.
- **Ojo**: la posición anterior se guarda como **estado**, junto al índice
  activo, y no en un `useRef`. Se lee durante el render para saber quién cambió
  de lado, y leer un ref ahí rompe la pureza del render — el lint del compilador
  de React lo rechaza con "Cannot access refs during render". Es el mismo error
  al que se va cualquiera que quiera comparar "valor anterior vs actual".

#### 3. La foto de "Sobre Cosmic Eagle" se edita desde Multimedia

Era la única imagen grande de la home clavada en `IMAGES`. Slot nuevo
`home.about.image` (recorte 1:1, el contenedor es cuadrado); `AboutSection`
recibe la imagen por props, como `PortalsSection`, porque es cliente por Framer
Motion. Sin migración: el registro de slots vive en el código.

De paso pasó de `<img>` a `next/image`. El wrapper nuevo alrededor del
`<Image fill>` **no sobra**: un absoluto se posiciona contra la caja de padding,
así que sin él la foto tapaba el `p-2` del marco de vidrio.

#### 4. Fondo animado: probado en producción y revertido

Se probó reemplazar el degradé vertical fijo del `body` por uno diagonal animado
(`#001f5c → #0066cc → #00ccff`, ciclo de 15s). Se pusheó a producción a pedido,
no gustó, y se revirtió en el commit siguiente — `globals.css` quedó byte a byte
como estaba. El intento está en el commit `949d6d2` por si se retoma la idea del
movimiento: lo que hay que resolver ahí es el pico de `#00ccff`, que deja sin
contraste al texto claro del sitio durante esa fase del ciclo.

#### Verificado y sin verificar

Verificado: build de producción en cada paso, `tsc` y lint limpios en lo tocado,
y las policies de `articles` probadas con `set role` — `anon` y un usuario
logueado no admin ven solo los publicados y no pueden escribir; el admin ve
borradores, escribe, y el trigger registra autor y sella la fecha de publicación.
Advisors sin novedades. Filas de prueba borradas.

**Sin verificar end-to-end** (requiere sesión de admin, la hace Ignacio): cargar
y publicar un artículo con portada desde el panel, subir la foto nueva de "Sobre
Cosmic Eagle", y ver el carrusel girando en el sitio en vivo.

## No hacer

- No inventar cuentas de Supabase ni connection strings falsos
- No crear rutas de API que asuman backend
- No modificar los textos legales del consentimiento (son de la clienta)
- No cambiar el flujo de aprobacion sin consultar (ver docs/CONTEXT.md:6)
