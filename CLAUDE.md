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
- Navbar (`Header.tsx`) muestra avatar + primer nombre en el link "Mi Cuenta" cuando hay sesión (fetch client-side, se actualiza con `onAuthStateChange`)
- `/viajes` conectado a la tabla `trips` real (ya no es mock). La tarjeta entera linkea al detalle
- `/viajes/[id]` es la **página pública de detalle del viaje** (no requiere sesión): portada, estado, descripción y datos (fechas, duración, lugar, cupo, aporte) + `generateMetadata`. El CTA cambia según sesión: sin usuario va a `/cuenta?next=/viajes/{id}/solicitar`, con usuario va directo al form; si el viaje está `closed`/`completed` muestra aviso. **Ojo**: la policy `trips_select_public` deja leer *todos* los trips a `anon`, incluidos los `draft` — el filtro de borradores se hace en la página (404), no en RLS. Cualquier ruta pública nueva que lea `trips` tiene que filtrar igual
- Imagen de portada: `trips` **no tiene columna de imagen**; se usa `tripPlaceholderImage(id)` de `lib/constants.ts` (elige placeholder por hash del id, así coincide listado y detalle). Si se quiere portada real hay que agregar `image_url` a la tabla y al form del admin
- Formulario de solicitud de salud funcionando en `/viajes/[id]/solicitar` (primerizo/recurrente, elegido segun historial de aprobaciones del usuario)
- Panel de admin funcionando en `/admin` (protegido por `profiles.is_admin`): dashboard, CRUD de viajes, revisión de solicitudes (aprobar/rechazar/expirar). Un admin no puede aprobar/rechazar su propia solicitud (guard en `reviewApplication` + oculto en la UI)
- `/nosotros` y `/contenidos` siguen siendo placeholders mock
- `pnpm build` (producción) verificado sin errores — listo para deployar en cuanto a código
- `app/api/keep-alive/route.ts` + `vercel.json` (cron diario 12:00 UTC) armados para que Supabase free tier no pause el proyecto por inactividad. Protegido con `CRON_SECRET`
- **Proyecto deployado en Vercel**: `cosmic-eagle` (org `ethoslogs-projects`), URL de producción `https://cosmic-eagle.vercel.app`. Env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `CRON_SECRET` cargadas en Development/Preview/Production. **Repo de GitHub conectado al proyecto de Vercel** (vía GitHub App, no webhook clásico) — cada push a `main` deploya solo a producción, no hace falta correr `vercel --prod` a mano
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
│   ├── page.tsx                     # Home (7 secciones, mock)
│   ├── layout.tsx                    # Root layout (fuentes, metadata)
│   ├── globals.css                   # Design system (colores, glass, scrollbar)
│   ├── not-found.tsx                 # 404 custom
│   ├── nosotros/page.tsx             # placeholder
│   ├── contenidos/page.tsx           # placeholder
│   ├── api/keep-alive/route.ts       # ping a `trips`, cron diario via vercel.json
│   ├── viajes/
│   │   ├── page.tsx                  # listado, conectado a `trips` real
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
│       └── solicitudes/              # revision, aprobar/rechazar/expirar (bloquea auto-revision)
├── components/
│   ├── Header.tsx             # "use client" — nav desktop + drawer mobile
│   ├── HeroSection.tsx
│   ├── AboutSection.tsx
│   ├── RetreatsSection.tsx
│   ├── ContentSection.tsx
│   ├── EbookSection.tsx
│   ├── TestimonialsSection.tsx
│   ├── Footer.tsx
│   └── BackToTop.tsx          # "use client" — FAB scroll
└── lib/
    ├── constants.ts           # Mock data (solo home), imagenes, nav links
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
docs/
├── CONTEXT.md                  # Requerimientos del cliente + decisiones de alcance
├── ARCHITECTURE.md             # Stack y estructura planeada
├── DATA_MODEL.md               # Tablas de Supabase (implementadas)
└── ROLES.md                    # Admin, Solicitante, Viajero
```

## Design system

**"Aetheric Mysticism"** (confirmado por la diseñadora, aplicado 2026-07-30). Reemplaza al "Modern Mystical" anterior (dark void #03050F / gold #E5C278 / cyan #5DE6FF). Base cálida #131410, atmósfera azul "Midnight Celestial", oro champagne, glassmorphism.

- Todos los tokens en `@theme` dentro de `globals.css`, con los nombres de rol de Material
- **Ojo con el rol del oro**: en el set confirmado `primary` es `#fff6eb` (blanco cálido), NO el oro. El oro son `primary-fixed-dim` (`#e3c37d` — headings, bordes, íconos, acentos) y `primary-container` (`#f9d78f` — CTA sólido, con `text-on-primary`). Los componentes ya usan esos tokens; no volver a mapear `text-primary` a "dorado"
- El fondo **nunca es plano**: `body::before` fija 4 blobs radiales (`#0079b3` + `#05125a`) sobre la base `#131410`. La intensidad se regula con los 4 alphas de esos gradientes
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
- Sin binarios en git (usar Supabase Storage/Vercel Blob para assets cuando haya backend)
- Nav: horizontal en `md+`, hamburger + drawer solo en mobile
- Footer firma: "i.vavala"

## Lo que sigue

Hecho: proyecto Supabase, `.env.local`, clientes tipados, `proxy.ts`, migraciones, login + registro, redirect admin en login, `/viajes` conectado, detalle público de viaje (`/viajes/[id]`), formulario de solicitud (primerizo/recurrente), panel de admin (dashboard + CRUD viajes + revisión de solicitudes, con bloqueo de auto-aprobación), panel de usuario/viajero (`/cuenta`: tarjeta de perfil con avatar + viajes aprobados + estado de solicitudes), avatar de perfil (bucket `avatars` + upload), navbar personalizado (avatar + nombre), fix del bug de login por email sin confirmar, keep-alive (`app/api/keep-alive` + `vercel.json`, cron diario), build de producción verificado, **proyecto deployado en Vercel con auto-deploy conectado a GitHub** (`cosmic-eagle`, env vars cargadas).

Pendiente, en orden sugerido:

1. **Consentimiento informado** — tabla `consents` ya existe en el schema pero no hay UI para completarlo. Los textos legales (5 bloques: Viaje, Facilitador, Experiencia, Consideraciones, Confidencialidad + 4 confirmaciones) son de la clienta — **no están en el repo, hay que pedírselos a Estela antes de construir la UI**, no inventar contenido (ver "No hacer").
2. Comunicación admin → usuario (unidireccional, ver `docs/ROLES.md`).
3. **i18n ES/EN** — decidido: no traducir a mano string por string. Escribir todo en `es.json`, generar `en.json` una vez (o cuando cambien los textos) vía script que llama a una API de traducción (DeepL/LLM), revisar a mano los términos específicos (ceremonia, chamánico, etc.), servir estático con `next-intl` — sin llamadas a API en cada request.
4. Chatbot IA.

No urgente pero pendiente: `/nosotros` y `/contenidos` siguen siendo placeholders mock.

## No hacer

- No inventar cuentas de Supabase ni connection strings falsos
- No crear rutas de API que asuman backend
- No modificar los textos legales del consentimiento (son de la clienta)
- No cambiar el flujo de aprobacion sin consultar (ver docs/CONTEXT.md:6)
