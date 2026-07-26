<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Cosmic Eagle Journey

Plataforma web para viajes de ceremonias ancestrales chamánicas. Cliente: Estela. Contacto de desarrollo: Ignacio Bavala.

## Estado actual (actualizado 2026-07-26)

- Supabase está integrado y en uso real: proyecto `hwayqsgwoaznfqofsyly`, `.env.local` con URL/anon key (gitignored, no en el repo), clientes tipados en `src/lib/supabase/` (`client.ts`, `server.ts`, `proxy.ts`), `proxy.ts` en la raíz refresca sesión
- Schema completo aplicado via migraciones (`supabase/migrations/`): `profiles`, `trips`, `applications_first_time`, `applications_returning`, `consents`, vistas `my_applications_*`, funciones `is_admin()`/`handle_new_user()` en schema `private`
- Auth funcionando: login en `/cuenta` (email/password), sin registro todavía (ver "Lo que sigue")
- `/viajes` conectado a la tabla `trips` real (ya no es mock)
- Formulario de solicitud de salud funcionando en `/viajes/[id]/solicitar` (primerizo/recurrente, elegido segun historial de aprobaciones del usuario)
- Panel de admin funcionando en `/admin` (protegido por `profiles.is_admin`): dashboard, CRUD de viajes, revisión de solicitudes (aprobar/rechazar/expirar)
- `/nosotros` y `/contenidos` siguen siendo placeholders mock
- No hay proyecto en Vercel deployado todavia
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
| **Pendiente** | Vercel | no configurado todavia |

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
│   ├── viajes/
│   │   ├── page.tsx                  # conectado a `trips` real
│   │   └── [id]/solicitar/
│   │       ├── page.tsx              # elige form primerizo/recurrente segun historial
│   │       ├── FirstTimeForm.tsx     # "use client"
│   │       ├── ReturningForm.tsx     # "use client"
│   │       └── actions.ts            # submitFirstTimeApplication / submitReturningApplication
│   ├── cuenta/
│   │   ├── page.tsx                  # login real (sin registro todavia)
│   │   ├── LoginForm.tsx             # "use client", soporta ?next=
│   │   └── actions.ts                # login/logout
│   └── admin/                        # protegido por profiles.is_admin
│       ├── layout.tsx                # guard + AdminNav
│       ├── page.tsx                  # dashboard (stats + actividad reciente)
│       ├── viajes/                   # CRUD de trips
│       └── solicitudes/              # revision, aprobar/rechazar/expirar
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

Hecho: proyecto Supabase, `.env.local`, clientes tipados, `proxy.ts`, migraciones, login, `/viajes` conectado, formulario de solicitud (primerizo/recurrente), panel de admin (dashboard + CRUD viajes + revisión de solicitudes).

Pendiente, en orden sugerido:

1. **Registro de usuarios** — `/cuenta` solo tiene login hoy. Sin esto ningún visitante real puede crear una cuenta ni postularse (bloqueante para uso real). Email/password, sin Google OAuth por ahora.
2. **Panel de usuario/viajero** — ver sus propias solicitudes y estado (via `my_applications_first_time`/`my_applications_returning`), ver viajes aprobados. Hoy `/cuenta` solo muestra "sesión iniciada", nada mas.
3. **Consentimiento informado** — tabla `consents` ya existe en el schema pero no hay UI para completarlo. Los textos legales son de la clienta, no inventar contenido (ver "No hacer").
4. **`app/api/keep-alive/route.ts` + `vercel.json`** con cron diario para evitar que Supabase pause el proyecto por inactividad (plan free) — no configurado todavia.
5. Vercel: crear proyecto y deployar.
6. Comunicación admin → usuario (unidireccional, ver `docs/ROLES.md`).
7. i18n ES/EN.
8. Chatbot IA.

No urgente pero pendiente: `/nosotros` y `/contenidos` siguen siendo placeholders mock.

## No hacer

- No inventar cuentas de Supabase ni connection strings falsos
- No crear rutas de API que asuman backend
- No modificar los textos legales del consentimiento (son de la clienta)
- No cambiar el flujo de aprobacion sin consultar (ver docs/CONTEXT.md:6)
