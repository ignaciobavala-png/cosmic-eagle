# Cosmic Eagle Journey

Plataforma web para viajes de ceremonias ancestrales chamánicas. Reemplaza el flujo actual basado en Google Forms + gestión manual por un sitio con panel de administración, panel de usuario, calendario de viajes y formulario de solicitud con flujo de aprobación por datos de salud.

Cliente: Estela (Cosmic Eagle Journey). Contacto de desarrollo: Ignacio Bavala.

## Estado actual: solo frontend

- No hay cuenta de Supabase creada
- No hay proyecto en Vercel deployado
- Todo es mock data estática (`src/lib/constants.ts`)
- Las páginas están en placeholder salvo la home
- Sin autenticación, sin base de datos, sin backend

## Stack

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | Next.js 16 (App Router) | Turbopack |
| UI | React 19 + Tailwind CSS v4 | tokens `@theme` en `globals.css` |
| Animaciones | Framer Motion 12 | scroll reveal, drawer |
| Estado | Zustand 5 | solo UI (drawer), sin persist |
| Iconos | Lucide React | — |
| Fuentes | EB Garamond (headings), Montserrat (body) | `next/font/google` |
| Package manager | pnpm | — |
| Lint | ESLint 9 (flat config) | — |
| Lenguaje | TypeScript | strict |
| Pendiente | Supabase, Vercel | no configurado |

## Getting started

```bash
pnpm install
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Estructura

```
src/
├── app/
│   ├── page.tsx              # Home (7 secciones)
│   ├── layout.tsx             # Root layout (fuentes, metadata)
│   ├── globals.css            # Design system (colores, glass, scrollbar)
│   ├── not-found.tsx          # 404 custom
│   ├── nosotros/page.tsx      # placeholder
│   ├── viajes/page.tsx        # placeholder
│   ├── contenidos/page.tsx    # placeholder
│   └── cuenta/page.tsx        # placeholder (futuro auth)
├── components/
│   ├── Header.tsx             # nav desktop + drawer mobile
│   ├── HeroSection.tsx
│   ├── AboutSection.tsx
│   ├── RetreatsSection.tsx
│   ├── ContentSection.tsx
│   ├── EbookSection.tsx
│   ├── TestimonialsSection.tsx
│   ├── Footer.tsx
│   └── BackToTop.tsx          # FAB scroll
└── lib/
    ├── constants.ts           # Mock data, imágenes, nav links
    └── store.ts               # Zustand (drawerOpen)
```

## Design system

Estilo "Modern Mystical": dark void (`#03050F`), gold primary (`#E5C278`), cyan secondary (`#5DE6FF`), parchment text (`#F4F1EA`), glassmorphism.

- Tokens de color en `@theme` dentro de `globals.css`
- Utilidades custom: `glass-card`, `text-shadow-glow`, `animate-float`
- Scrollbar custom gold
- Imágenes mock vía `lh3.googleusercontent.com`, sin optimizar (`<img>`)

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/CONTEXT.md`](docs/CONTEXT.md) | Contexto de negocio, roles, formularios relevados, reglas de negocio y pendientes de definición con la clienta |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack técnico y estructura de carpetas planeada (incluye lo que falta: auth, dashboard, API) |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Modelo de tablas para Supabase (viajes, solicitudes primerizo/recurrente, consentimientos, RLS) |
| [`docs/ROLES.md`](docs/ROLES.md) | Roles (Administrador, Solicitante, Viajero) y flujo completo de aprobación |

## Roadmap (cuando haya cuenta de Supabase)

1. Crear proyecto en Supabase, obtener URL y anon key
2. `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `src/lib/supabase/` (client, server, proxy) + `proxy.ts` en raíz
4. `app/api/keep-alive/route.ts` + `vercel.json` con cron diario
5. Migraciones SQL en `supabase/migrations/`
6. Auth email/password (sin Google OAuth por ahora)
7. Flujo de solicitud primerizo/recurrente según `docs/DATA_MODEL.md`
8. Panel de admin y panel de usuario
9. i18n ES/EN
10. Chatbot con IA

## Convenciones del proyecto

- Server Components por defecto, `"use client"` solo cuando hay interactividad o Framer Motion
- Sin CSS-in-JS, solo Tailwind
- `@/*` apunta a `./src/*`
- Sin testing, sin Docker
- Sin binarios en git (Supabase Storage / Vercel Blob para assets cuando haya backend)
- Nav horizontal en `md+`, hamburger + drawer en mobile
- Footer: "i.vavala"

Ver `CLAUDE.md` / `AGENTS.md` para instrucciones detalladas de desarrollo con agentes de IA.
