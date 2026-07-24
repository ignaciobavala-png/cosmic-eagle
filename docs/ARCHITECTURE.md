# Arquitectura

## Stack

| Capa | Tecnologia | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.x |
| UI | React + Tailwind CSS | 19.x / v4 |
| Animaciones | Framer Motion | 12.x |
| Estado | Zustand | 5.x |
| DB / Auth | Supabase | PostgreSQL |
| Hosting | Vercel | Pro |
| Package | pnpm | — |
| Linting | ESLint flat config | 9.x |
| Lenguaje | TypeScript | strict |

## Estructura del proyecto

```
src/
├── app/                  # App Router
│   ├── (public)/         # Grupo: sitio publico (/, /nosotros, /viajes, /contenidos)
│   ├── (auth)/           # Grupo: login, registro, recupero
│   ├── (dashboard)/      # Grupo: panel de usuario y admin
│   └── api/              # API routes (keep-alive, webhooks, chatbot)
├── components/           # Componentes compartidos
│   ├── layout/           # Header, Footer, Shell
│   ├── sections/         # Secciones de landing
│   └── ui/               # GlassCard, Buttons, Inputs
├── lib/                  # Utilidades
│   ├── supabase/         # Clientes (server, client, proxy)
│   ├── store.ts          # Zustand
│   └── constants.ts      # Datos mock / config
└── supabase/             # Migraciones SQL
    └── migrations/
```

## Patrones

- Server Components por defecto, Client Components solo con interactividad
- Supabase SSR: singleton client (evita deadlock de login), proxy con exclusion de `auth/`
- Keep-alive: cron diario en `vercel.json`
- Animaciones: Framer Motion para scroll reveal, drawer, transiciones
- RLS obligatorio para datos sensibles de salud
- i18n: ES (principal) / EN
