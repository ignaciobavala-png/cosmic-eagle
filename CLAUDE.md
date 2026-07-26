<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Cosmic Eagle Journey

Plataforma web para viajes de ceremonias ancestrales chamánicas. Cliente: Estela. Contacto de desarrollo: Ignacio Bavala.

## Estado actual (actualizado 2026-07-26)

- Supabase está integrado y en uso real: proyecto `hwayqsgwoaznfqofsyly`, `.env.local` con URL/anon key (gitignored, no en el repo), clientes tipados en `src/lib/supabase/` (`client.ts`, `server.ts`, `proxy.ts`), `proxy.ts` en la raíz refresca sesión
- Schema completo aplicado via migraciones (`supabase/migrations/`): `profiles`, `trips`, `applications_first_time`, `applications_returning`, `consents`, vistas `my_applications_*`, funciones `is_admin()`/`handle_new_user()` en schema `private`
- Auth funcionando en `/cuenta`: login + **registro** (email/password, toggle `?modo=registro`, sin confirmación por mail — el gate real de acceso es la aprobación manual del admin, no la verificación de email). Login redirige directo a `/admin` si `profiles.is_admin`
- `/cuenta` logueado muestra **panel de viajero**: viajes aprobados + tabla de "Mis solicitudes" con estado (via `my_applications_first_time`/`my_applications_returning` + `trips`, sin exponer datos de salud)
- `/viajes` conectado a la tabla `trips` real (ya no es mock)
- Formulario de solicitud de salud funcionando en `/viajes/[id]/solicitar` (primerizo/recurrente, elegido segun historial de aprobaciones del usuario)
- Panel de admin funcionando en `/admin` (protegido por `profiles.is_admin`): dashboard, CRUD de viajes, revisión de solicitudes (aprobar/rechazar/expirar). Un admin no puede aprobar/rechazar su propia solicitud (guard en `reviewApplication` + oculto en la UI)
- `/nosotros` y `/contenidos` siguen siendo placeholders mock
- `pnpm build` (producción) verificado sin errores — listo para deployar en cuanto a código
- `app/api/keep-alive/route.ts` + `vercel.json` (cron diario 12:00 UTC) armados para que Supabase free tier no pause el proyecto por inactividad. Protegido con `CRON_SECRET` si esa env var existe (falta cargarla en Vercel al deployar)
- No hay proyecto en Vercel deployado todavia — falta crear el proyecto y cargar `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `CRON_SECRET` como env vars ahí
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
| Backend | Supabase (Postgres + Auth) | `@supabase/ssr`, RLS en todas las tablas, ver `supabase/migrations/` |
| **Pendiente** | Vercel | proyecto sin crear; `vercel.json` + keep-alive ya listos para cuando se deploye |

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
│   │   ├── page.tsx                  # conectado a `trips` real
│   │   └── [id]/solicitar/
│   │       ├── page.tsx              # elige form primerizo/recurrente segun historial
│   │       ├── FirstTimeForm.tsx     # "use client"
│   │       ├── ReturningForm.tsx     # "use client"
│   │       └── actions.ts            # submitFirstTimeApplication / submitReturningApplication
│   ├── cuenta/
│   │   ├── page.tsx                  # login/registro (?modo=registro) + panel de viajero
│   │   ├── LoginForm.tsx             # "use client", soporta ?next=, ojito password
│   │   ├── SignupForm.tsx            # "use client", ojito password
│   │   ├── MisSolicitudes.tsx        # viajes aprobados + tabla de solicitudes propias
│   │   └── actions.ts                # login/signup/logout
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

Estilo "Modern Mystical": dark void (#03050F), gold primary (#E5C278), cyan secondary (#5DE6FF), parchment text (#F4F1EA), glassmorphism.

- Todos los tokens de color en `@theme` dentro de `globals.css`
- Utilidades custom: `glass-card`, `text-shadow-glow`, `animate-float`
- Scrollbar custom gold
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

Hecho: proyecto Supabase, `.env.local`, clientes tipados, `proxy.ts`, migraciones, login + registro, redirect admin en login, `/viajes` conectado, formulario de solicitud (primerizo/recurrente), panel de admin (dashboard + CRUD viajes + revisión de solicitudes, con bloqueo de auto-aprobación), panel de usuario/viajero (`/cuenta`: viajes aprobados + estado de solicitudes), keep-alive (`app/api/keep-alive` + `vercel.json`, cron diario), build de producción verificado.

Pendiente, en orden sugerido:

1. **Consentimiento informado** — tabla `consents` ya existe en el schema pero no hay UI para completarlo. Los textos legales (5 bloques: Viaje, Facilitador, Experiencia, Consideraciones, Confidencialidad + 4 confirmaciones) son de la clienta — **no están en el repo, hay que pedírselos a Estela antes de construir la UI**, no inventar contenido (ver "No hacer").
2. **Vercel: crear proyecto y deployar.** El código ya está listo (`vercel.json` + keep-alive armados, build verificado) — falta crear el proyecto en Vercel y cargar ahí `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `CRON_SECRET` (cualquier string random, protege el endpoint de keep-alive).
3. Comunicación admin → usuario (unidireccional, ver `docs/ROLES.md`).
4. **i18n ES/EN** — decidido: no traducir a mano string por string. Escribir todo en `es.json`, generar `en.json` una vez (o cuando cambien los textos) vía script que llama a una API de traducción (DeepL/LLM), revisar a mano los términos específicos (ceremonia, chamánico, etc.), servir estático con `next-intl` — sin llamadas a API en cada request.
5. Chatbot IA.

No urgente pero pendiente: `/nosotros` y `/contenidos` siguen siendo placeholders mock.

## No hacer

- No inventar cuentas de Supabase ni connection strings falsos
- No crear rutas de API que asuman backend
- No modificar los textos legales del consentimiento (son de la clienta)
- No cambiar el flujo de aprobacion sin consultar (ver docs/CONTEXT.md:6)
