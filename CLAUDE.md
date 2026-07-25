<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Cosmic Eagle Journey

Plataforma web para viajes de ceremonias ancestrales chamánicas. Cliente: Estela. Contacto de desarrollo: Ignacio Bavala.

## Estado actual: **SOLO FRONTEND**

- Existe un proyecto Supabase creado (`hwayqsgwoaznfqofsyly`) y el MCP de Supabase está conectado (`.mcp.json`), pero el schema `public` está **vacío** (sin tablas ni migraciones) y no hay `.env.local` en el repo — el frontend no está integrado con él todavía
- No hay proyecto en Vercel deployado
- Todo es mock data estático
- Las paginas son placeholders (salvo la home)
- Sin autenticacion, sin base de datos en uso, sin backend

**No escribas codigo que asuma conexion a Supabase** — el proyecto existe pero está vacío; cuando se empiece la integración real, seguir los pasos de "Lo que sigue".

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
| **Pendiente** | Supabase (integracion), Vercel | proyecto Supabase creado y MCP conectado, pero sin tablas/env/integracion; Vercel no configurado |

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
    ├── constants.ts           # Mock data, imagenes, nav links
    └── store.ts               # Zustand (drawerOpen)
docs/
├── CONTEXT.md                 # Requerimientos del cliente
├── ARCHITECTURE.md            # Stack y estructura planeada
├── DATA_MODEL.md              # Tablas para Supabase (a futuro)
└── ROLES.md                   # Admin, Solicitante, Viajero
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

## Lo que sigue (integracion real con Supabase)

1. ~~Crear proyecto en Supabase~~ ya existe (`hwayqsgwoaznfqofsyly`), falta obtener URL y anon key y usarlas en el repo
2. Crear `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Crear `src/lib/supabase/` con client.ts (singleton browser), server.ts, proxy.ts
4. Crear `proxy.ts` en raiz (middleware Next 16) con exclusion de `auth/`
5. Crear `app/api/keep-alive/route.ts` + `vercel.json` con cron diario
6. Migraciones SQL en `supabase/migrations/`
7. Auth: login/registro con email/password (sin Google OAuth por ahora)
8. Flujo de solicitud (primerizo/recurrente) segun `docs/DATA_MODEL.md`
9. Panel de admin y panel de usuario
10. i18n ES/EN
11. Chatbot IA

## No hacer

- No inventar cuentas de Supabase ni connection strings falsos
- No crear rutas de API que asuman backend
- No modificar los textos legales del consentimiento (son de la clienta)
- No cambiar el flujo de aprobacion sin consultar (ver docs/CONTEXT.md:6)
