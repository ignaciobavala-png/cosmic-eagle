<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Cosmic Eagle Journey

Plataforma web para viajes de ceremonias ancestrales chamánicas. Cliente: Estela
(fundadora) y Sofía (contenidos). Desarrollo: Ignacio Bavala.

**Julia, la diseñadora, salió del proyecto el 16/09.** Su rediseño queda —es lo
que está en producción y sigue siendo la referencia—, pero **ya no hay a quién
consultarle**: lo que antes era "preguntarle a Julia" ahora lo deciden Sofía e
Ignacio. Los cambios sobre su diseño aprobado ya no necesitan aviso, y las
decisiones que estaban trabadas esperándola están abajo, en "Lo que sigue".

**El historial de sesiones vive en `docs/BITACORA.md`**, no acá. Este archivo es
el estado y las reglas vigentes; la bitácora es el porqué de cada decisión. Las
sesiones nuevas se anotan allá, al pie. Si algo de acá se contradice con la
bitácora, gana este archivo (es el más nuevo).

## Estado actual (2026-09-15)

En producción: `https://cosmic-eagle.vercel.app` (proyecto `cosmic-eagle`, org
`ethoslogs-projects`, auto-deploy en cada push a `main`). `main` es la única rama.

**Backend.** Supabase `hwayqsgwoaznfqofsyly`, schema completo aplicado via
migraciones (`supabase/migrations/`), RLS en las 15 tablas y en `storage.objects`.
Clientes tipados en `src/lib/supabase/`: `client` (browser), `server` (cookies),
`public` (sin cookies, para páginas estáticas), `admin` (service role, sólo cron
y scripts), `proxy` (refresco de sesión, `proxy.ts` en la raíz).

**Auth.** Login + registro en `/cuenta` (sin confirmación por mail: el gate real
es la aprobación manual del admin — el toggle "Confirm email" del dashboard de
Supabase tiene que seguir **desactivado**). Recuperación de contraseña en
`/cuenta/recuperar` → `/auth/confirm` → `/cuenta/nueva-clave`, **sin plantillas
configuradas todavía** (`docs/AUTH_EMAIL.md`).

**El embudo de inscripción, en dos etapas** (`docs/FLUJO_INSCRIPCION.md`):

```
registro → filtro corto → revisión de Estela → pago
        → formulario de salud extenso → consentimiento → logística
```

`applications` (filtro + estado + revisión + pago) con hijas
`health_form_first_time`, `consents` y `payment_proofs`. Cada etapa es un INSERT
nuevo: el postulante **nunca** necesita UPDATE sobre una fila con datos médicos.
La vista `my_applications` es lo que ve el viajero en `/cuenta`.

**El pago**: Estela lo confirma a mano desde `/admin/solicitudes` mirando el
comprobante. Los rieles de cobro los carga ella en `/admin/pagos`; los
comprobantes van al bucket privado `comprobantes` (URLs firmadas a 10 min).
`payment_status`: `pending` → `deposit_paid` → `paid`, más `waived`.
**No hay pasarela**: Encuadrado está relevado (`docs/ENCUADRADO.md`) y no
integrado. `trips.price` está fijado en **USD**; la moneda que varía es la del
riel (`payment_methods.currency`).

**Correos.** Dos canales que se confunden fácil: los de *auth* los manda Supabase
por SMTP, los de la *app* salen por el SDK de Resend (`docs/EMAIL.md`). Vamos
**11 de las 15 comunicaciones** del embudo de Sofía (`docs/COMUNICACIONES.md`).
Los disparados por botón salen de un server action; los que dispara el calendario
los manda el cron de `/api/cron/emails` (13:00 UTC), con `scheduled_email_log`
como registro de "no remandar". **No sale ni un correo hasta verificar el dominio
en Resend** — sin `RESEND_API_KEY`, `sendEmail` loguea y devuelve
`not_configured` sin fallar y sin dejar fila.

**Panel de admin** (`/admin`, protegido por `profiles.is_admin`): dashboard, CRUD
de experiencias, solicitudes (revisión + pago a mano), CRM, contenidos, FAQs,
testimonios, multimedia, pagos, legales, acceso, suscriptores, notificaciones.
Un admin no puede revisar su propia solicitud.

**Contenido editable por la clienta, sin tocar código**: imágenes y textos de las
páginas públicas (`site_content` + registro de slots en `src/lib/site-content.ts`,
panel en `/admin/multimedia`), artículos (`articles`), FAQs (`faqs`), testimonios
(`testimonials`), documentos legales (`legal_documents`), medios de cobro
(`payment_methods`).

**La biblioteca tiene tres niveles de acceso** (`publico < miembros < programa`,
`docs/ACCESO_CONTENIDOS.md`): el gate va en la RLS, la vista `articles_public`
expone los metadatos de lo cerrado para dibujar el candado, la habilitación
(`content_grants`) sale sola al aprobar una solicitud, y hay códigos por viaje
(`access_codes`) que se canjean con sesión iniciada.

**Frontend.** El rediseño de Julia está aplicado en todas las rutas públicas: no
queda ninguna sobre el chrome viejo. Home puramente narrativa y **estática**
(`○`, sin consultar Supabase con cookies), `/nosotros`, `/viajes` (dos bloques
narrativos con calendario desplegable), `/viajes/[id]`, `/contenidos`,
`/contenidos/[slug]`, `/faqs`, `/privacidad`, `/terminos`, `/cuenta`. Desde el
17/09 hay ademas `/calendario`: las dos carteleras abiertas y nada mas, el
atajo para quien entra a ver la proxima fecha. Es el tercer hijo del
desplegable de Experiencias y el unico que no es un ancla de `/viajes`.

**Tests.** Playwright en `e2e/` (`docs/E2E.md`): 38 públicos + 18 del panel, más
dos recorridos que generan capturas para mostrarle el producto a la clienta
(`capturas.escritura` = el embudo, `capturas-sitio.lectura` = el sitio). Salen a
`~/Escritorio/things/cosmic-eagle-material/`, fuera del repo.

## Stack

| Capa | Tech | Notas |
|---|---|---|
| Framework | Next.js 16 (App Router) | Turbopack |
| UI | React 19 + Tailwind CSS v4 | `@theme` tokens en globals.css |
| Animaciones | Framer Motion 12 | scroll reveal, drawer |
| Estado | Zustand 5 | solo UI (drawer), sin persist |
| Iconos | Lucide React | — |
| Fuentes | Sorts Mill Goudy (display), Montserrat (body) | next/font/google |
| Mails | Resend + React Email | `src/emails/` |
| Package | pnpm | — |
| Lint | ESLint 9 flat config | — |
| TypeScript | strict | — |
| Backend | Supabase (Postgres + Auth + Storage) | `@supabase/ssr` |
| E2E | Playwright | `e2e/`, ver `docs/E2E.md` |
| Deploy | Vercel | auto-deploy en cada push a `main` |

## Estructura

```
src/
├── app/
│   ├── page.tsx                  # Home narrativa (estática, ISR 1h para los viajes)
│   ├── layout.tsx  globals.css  not-found.tsx
│   ├── nosotros/                 # cuatro palabras → relato → propósito → frase → enfoque → cierre
│   ├── viajes/
│   │   ├── page.tsx              # #sesiones y #viajes, los dos bloques narrativos
│   │   └── [id]/
│   │       ├── page.tsx          # detalle PÚBLICO (hero P1 + crema + banda de cierre)
│   │       ├── solicitar/        # ETAPA 1: filtro corto + pantalla de estado + Cómo pagar
│   │       ├── salud/            # ETAPA 2: sólo aprobada + pagada
│   │       └── consentimiento/   # firma, después del formulario de salud
│   ├── calendario/               # atajo: las dos carteleras abiertas, hero corto
│   ├── contenidos/               # biblioteca + [slug] (muro si el nivel no alcanza)
│   ├── faqs/  privacidad/  terminos/
│   ├── cuenta/                   # acceso (AuthScreen) + panel del viajero
│   │   ├── recuperar/  nueva-clave/
│   ├── auth/confirm/             # canjea token_hash por sesión
│   ├── api/
│   │   ├── keep-alive/           # cron diario, que Supabase no pause el proyecto
│   │   ├── cron/emails/          # barrido de correos programados (exige CRON_SECRET)
│   │   └── preview-email/        # 404 en producción
│   └── admin/                    # guard por profiles.is_admin + AdminNav desplegable
│       ├── experiencias/         # el CRUD de trips (form + actions)
│       ├── viajes/               # listado type=retiro      ("Viajes Cósmicos")
│       ├── sesiones/             # listado type=ceremonia    ("Sesiones Cósmicas")
│       ├── solicitudes/[id]/     # filtro + salud + consentimiento + pago
│       ├── pagos/  acceso/  crm/  contenidos/  testimonios/
│       ├── faqs/  legales/  multimedia/  suscriptores/  notificaciones/
├── components/
│   ├── Header.tsx                # navbar opaco + desplegables + drawer mobile
│   ├── Footer.tsx  NewsletterForm.tsx  BackToTop.tsx
│   ├── forms/styles.ts           # los estilos de campo, compartidos por TODOS los forms
│   └── ui/                       # primitivas del sistema (ver Design system)
└── lib/
    ├── constants.ts  format.ts  store.ts
    ├── site-content.ts           # registro de slots editables
    ├── trip-type.ts  trip-schedule.ts  trip-cover.ts  trip-fields.ts
    ├── consent.ts                # el texto legal + CONSENT_VERSION
    ├── content-access.ts         # niveles de la biblioteca
    ├── use-section-progress.ts   # progreso de scroll propio (NO useScroll)
    ├── compress-image.ts  compress-video.ts
    ├── email/                    # sendEmail, plantillas y schedule-config
    └── supabase/                 # client · server · public · admin · proxy · types
proxy.ts                          # middleware de Next 16, en la raíz
vercel.json                       # dos crons: keep-alive y correos
supabase/migrations/              # historial de schema, aplicado via MCP
e2e/                              # Playwright, ver docs/E2E.md
docs/                             # BITACORA.md + un doc por tema (ver abajo)
public/img/                       # assets fijos de layout, WebP
```

### Los docs

`BITACORA.md` (historial) · `CONTEXT.md` (requerimientos) · `ROLES.md` ·
`DATA_MODEL.md` · `ARCHITECTURE.md` · `E2E.md` · `RECORRIDO.md` (las 8
primitivas) · `FLUJO_INSCRIPCION.md` · `CONSENTIMIENTO.md` · `PAGOS.md` ·
`ENCUADRADO.md` · `COMUNICACIONES.md` (las 15 del embudo) · `EMAIL.md` ·
`AUTH_EMAIL.md` · `NOTIFICACIONES.md` · `BIBLIOTECA.md` ·
`ACCESO_CONTENIDOS.md` · `CONTENIDOS.md` · `FAQS.md` · `MULTIMEDIA.md` ·
`PORTADAS.md` · `CRM.md` · `FORMULARIOS.md` · `EXPERIENCIAS_2026.md` ·
`COPY_HUERFANO.md` · `HOME_REDISENO.md` · `REDISENO_JULIA_HTML.md` ·
`CORRECCIONES_JULIA_*.md` · `entregas/` (lo que mandan las clientas).

## Design system

**"Aetheric Mysticism"**, confirmado por la diseñadora. Base cálida, atmósfera
azul, oro champagne, glassmorphism. Todos los tokens en `@theme` dentro de
`globals.css`, con nombres de rol de Material.

- **El oro no es `primary`.** `primary` es `#fff6eb` (blanco cálido). El oro son
  `primary-fixed-dim` (`#e3c37d`) y `primary-container` (`#f9d78f`).
- **Y cada oro tiene su lugar** (regla del 28/08, medida en contraste):
  `primary-fixed-dim` es el oro de *acento* (bordes, íconos, headings sobre fondo
  oscuro); para **texto chico sobre fondo claro** va `on-primary-container`
  (`#755c21`); para **texto sobre azul** va `primary-container`. El `#b3964b`
  sirve como relleno y borde, **no** como color de texto.
- **El fondo nunca es plano**: degradé vertical de documento completo en `body`
  más un campo de estrellas fijo en `body::before`. `html` lleva
  `background-color` a propósito, para que el degradé no se dimensione contra el
  viewport.
- Los degradés azules van **rectos**, de `#05125A` a `#0079B3` (navbar y footer),
  sin mesetas ni escalas intermedias.
- **Navbar opaco** (`h-16 lg:h-21`): todos los `main` llevan `pt-16 lg:pt-21` o
  el navbar les tapa el arranque. Y `scroll-padding-top` en `html` para que los
  anclajes no queden debajo.
- Fuentes: **Sorts Mill Goudy** (display, sólo peso 400 — va
  `font-synthesis-weight: none`, un faux bold sobre una serif antigua se ve
  embarrado) + **Montserrat** (cuerpo). **Un resaltado dentro de un párrafo no
  cambia de tipografía**, sólo de color y peso: la altura de x de la serif es
  mucho más baja y se lee como si estuviera en otro cuerpo.
- Escala tipográfica como tokens `--text-*`. Layout: `max-w-narrative` (1200px),
  `px-gutter`, `py-section`. `rounded-2xl` es 8px, no 16.
- Utilidades custom: `glass-card` (vidrio dorado, **pensado para fondo oscuro**:
  sobre crema no se ve, ahí van tarjetas blancas con filete dorado),
  `glint-edge`, `aura-gold`/`aura-blue`, `text-shadow-glow`, `animate-float`,
  `animate-kb-zoom`.

### Primitivas (`src/components/ui/`)

Antes de escribir una sección nueva, revisar si la primitiva ya existe. Las 8 del
sistema original están en `docs/RECORRIDO.md` §4: `PageHero` (P1),
`DocumentCard` (P2), `FeatureBlock` (P3), `TripCard` (P4), `ClosingSection` (P5),
`CallBand` (P6), `SectionHeading` (P7), más el carrusel de portales (P8).

Del rediseño: `ImmersiveHero`, `CreamSection` (la franja clara),
`MediaStatement`, `ScrollStory` / `StickyStory` / `WordSequence` (los bloques de
scroll largo), `TestimonialViewer` (los tres juegos de testimonios),
`TripCarousel` + `Collapsible` (la cartelera), `TripCover` (**la única pieza que
decide el recorte de una portada**), `ArticleBody`, `LegalPage`, `AuthScreen`,
`GateModal` + `ExperienceGate`, `BackgroundMedia`, `Reveal` / `RevealItem` /
`RevealLine`, `CtaLink` (variantes `solid`, `ghost`, `pill`, `outline`, `glass`).

`Reveal` existe para que una sección con scroll reveal siga siendo Server
Component: acota el `"use client"` al wrapper.

## Reglas que se repiten (las trampas)

Cada una costó una sesión. Están desarrolladas en `docs/BITACORA.md`.

### Postgres y RLS

- **`revoke update (columna)` no hace nada** si el rol tiene UPDATE a nivel
  tabla: Postgres avisa por WARNING y sigue. Va `revoke update on <tabla>` y
  después `grant update (<columnas permitidas>)`. Así estuvo abierta una escalada
  de privilegios en `profiles.is_admin`. Corolario: **el revoke alcanza también
  al admin**, que es `authenticated` como todos, y una columna nueva necesita
  entrar en los grants o el panel no la puede escribir.
- **`alter type ... add value` no se puede USAR en la misma transacción** en que
  se agrega, y cada migración corre en una. El valor del enum va en su propia
  migración. Van cuatro veces con esta trampa.
- **Un trigger BEFORE corre antes de que se evalúe el `with check`**, así que la
  RLS ve la fila ya corregida. Lo que sostiene la seguridad ahí es la función
  `security definer`, no un `auth.uid() = user_id` que el trigger reescribe.
- **Una vista `security definer` también escribe como su dueño**: hay que
  otorgarle sólo SELECT.
- Chequear la propiedad de algo que el usuario no puede leer exige una función
  `security definer` (`private.is_admin()`,
  `private.owns_approved_application()`, `private.content_level()`).
- **Una policy de SELECT abierta sobre `storage.objects` no hace falta** para
  leer por URL en un bucket público: lo único que habilita es listar el bucket.
- El **orden de declaración de un enum es el orden de comparación** cuando las
  policies escriben `nivel <= private.content_level()`.
- **`trips` filtra los borradores en cada página, no en RLS** (la policy deja
  leer todos a `anon`). `articles` y `faqs` sí lo hacen en RLS. Cualquier ruta
  pública nueva que lea `trips` tiene que filtrar igual.
- Una columna generada exige funciones IMMUTABLE: `concat`/`concat_ws` son
  STABLE, va `||` + `coalesce`.
- `create or replace view` sólo acepta agregar columnas **al final**.

### Next.js y Supabase

- **`createClient` de `server.ts` lee `cookies()` y vuelve dinámica la página.**
  Lo que tiene que quedar estático se lee con `src/lib/supabase/public.ts` +
  `revalidate`. Corolario: los server actions del panel tienen que
  `revalidatePath()` las rutas públicas o el ISR tarda en mostrar lo editado.
- **`updateTag`, no `revalidateTag`**: el segundo sirve el valor viejo mientras
  revalida, y acá la clienta guarda y mira enseguida.
- `unstable_cache` no admite `cookies()` adentro del scope cacheado.
- `next.config.ts` tiene que listar el hostname de Supabase en `remotePatterns` o
  `next/image` rechaza las portadas — **falla en runtime, no en build**.
- **En `next dev` la primera respuesta de una ruta queda cacheada**: un cambio en
  `site_content` no se ve hasta agregarle una query string distinta.
- `health_form_first_time` vuelve como **objeto o `null`**, no como arreglo (la
  FK es one-to-one), y el `!inner` del embed no es decorativo: sin él un filtro
  sobre una tabla embebida no descarta la fila padre.

### Animación y scroll

- **No usar `useScroll` en un bloque más alto que la pantalla.** Framer 12
  delega al motor nativo (`ViewTimeline`), que traduce
  `["start start","end end"]` al rango `contain` — degenerado si el elemento
  nunca entra entero. Va `src/lib/use-section-progress.ts`. Compila igual y se ve
  mal: hay que verificarlo en el browser.
- **El ratio de intersección máximo alcanzable es `alto de pantalla / alto de lo
  observado`.** Una sección de 4 pantallas nunca pasa de 0.25, así que un
  `amount` mayor **no dispara nunca**. Donde el alto lo decide la clienta (FAQs,
  biblioteca) se observa **sólo el encabezado**.
- Se observa **la sección**, no la columna de texto de adentro.
- **El observador se arma después de `load` + doble `rAF`**, y la espera gatea el
  observador (ref vacía hasta que está armado), no la salida.
- **`prefers-reduced-motion` no puede cambiar el árbol**: `useReducedMotion`
  devuelve `false` en el servidor, el HTML sale con `opacity:0` y React avisa que
  *no va a parchear* ese atributo — el contenido queda invisible para siempre. La
  preferencia sólo cambia la **transición** (duración cero). Es la causa del bug
  que dejó el sitio entero invisible el 03/09, y la home todavía arrastra un
  error de hidratación por lo mismo en `ScrollStory`.
- **Chrome headless trae `reduce` por defecto**: un test que quiere ver la
  animación necesita `reducedMotion: "no-preference"` explícito.
- Una sección de `100svh` con `overflow-hidden` **recorta sin avisar** en
  pantallas bajas y no hay scroll que lo recupere: la medida del texto tiene que
  seguir también al alto (`min(1.9vw, 3.1vh)`).
- **Un `z-index` negativo en una sección con imagen de fondo la deja tapada** por
  el degradé del `body`. Va envoltorio en `z-0` y contenido en `z-10`.
- `ScrollHintButton` es `absolute` y no ocupa lugar: la sección tiene que
  reservarle el hueco con su propio padding.

### Tailwind, y la trampa que ya salió cuatro veces

**Pasar por `className` una utilidad que compite con una que el componente ya
trae no funciona.** Entre dos utilidades de la misma especificidad decide el
**orden de la hoja generada**, no el orden en que se escriben las clases
(`py-24` + `pb-0` deja el padding en 96px; `bottom-8` gana sobre un `bottom-3`
pasado desde afuera). Se resuelve **adentro del componente**, con una prop
(`flushBottom`, `bottomClassName`, `textColorClassName`).

Y **ojo con reemplazar clases por texto**: un `backdrop-blur-2xl` puede estar dos
veces en el mismo archivo y el cambio se cuela donde no va.

### Correos

- **La paleta está copiada a mano** en `src/emails/BaseLayout.tsx`: un correo no
  puede importar Tailwind ni leer los tokens. Si el sitio cambia de paleta, ese
  archivo hay que tocarlo, no se entera solo.
- Cliente de Resend **lazy**: a nivel de módulo tumba el build de Vercel.
  `sendEmail` **nunca lanza**.
- Fondos con atributo `bgcolor` en `<table>` además del CSS; **nada de
  `linear-gradient`** (Outlook lo descarta y el botón se queda sin fondo); metas
  `color-scheme` en el `<Head>`; las fuentes van nombradas con su cascada, no se
  pueden cargar.
- `Paragraph` tiene `preLine` para los campos que la clienta carga como lista.

### Verificación

- **Medir en el browser, no a ojo.** Lo que se verificó a ojo se rompió: el botón
  azul sobre azul, el texto que se leía dos veces, los 400px de pantalla vacía.
- **Si `next start` quedó levantado de un build anterior sirve el HTML nuevo con
  el CSS viejo** y las mediciones dan cualquier cosa. Matarlo por puerto
  (`fuser -k 3000/tcp`): un `pkill -f "next start"` se lleva puesto al propio
  shell y el `pnpm start` que viene después nunca corre.
- **Antes de tocar un texto que el `grep` no encuentra, buscarlo en
  `site_content`**: la clienta lo carga desde `/admin/multimedia`.

## Convenciones del proyecto

- Server Components por defecto; `"use client"` sólo con interactividad o Framer
  Motion, y acotado al wrapper más chico posible.
- Sin CSS-in-JS, solo Tailwind. `@/*` apunta a `./src/*`. Sin Docker.
- Binarios en git: **solo assets fijos de layout** (logo, heros, secciones
  narrativas), en WebP, en `public/img/`. Lo que edita la clienta va a Supabase
  Storage.
- El cuerpo de un artículo o un legal es **texto plano con cinco reglas**
  (`## `, `### `, `- `, `> `, `**Título.** resto`) y sale como texto: **no hay
  sanitizador en el proyecto** y aceptar HTML sería un XSS almacenado.
- Las imágenes se comprimen y recortan **en el browser al subir**
  (`compressImage`), no al mostrar: lo que la clienta ve en la preview es lo que
  se guarda. Zona segura de una portada: el 75% central de los dos ejes.
- **Las keys de los slots de `site_content` no se renombran** aunque cambie la
  sección: lo que la clienta ya subió queda huérfano.
- El nombre del tipo de viaje cambia sólo en la etiqueta
  (`src/lib/trip-type.ts`): **en la base siguen siendo `retiro` y `ceremonia`**.
  Y "ceremonia" en el formulario de salud, en `ScreeningForm` y en el CRM
  significa *el ritual*, no el tipo de viaje.
- **El menú de `/nosotros` y el orden de la página van juntos** (cuatro palabras
  → Quiénes somos → propósito → frase → enfoque → cierre). Ya se revirtió una vez
  por error.

## No hacer

- No inventar cuentas de Supabase ni connection strings falsos
- No inventar copy de la clienta: los textos legales, las FAQs, el consentimiento
  y el encuadre del filtro corto son de ella, **literales** (el filtro está en
  tuteo a diferencia del resto del sitio, y no se reescribe sin consultar)
- No cambiar el flujo de aprobación sin consultar (ver `docs/CONTEXT.md` §6)
- No servir las tipografías del manual de marca (LTC Goudy Old Style y Dolly Pro):
  son de pago y los archivos que llegaron son piratas
- **Lo que mandan las clientas se copia al repo el mismo día**
  (`docs/entregas/`): `~/Descargas` se vacía sola y ya se perdieron tres
  documentos, incluidos los HTML de Julia y el anexo de Privacidad

## Lo que sigue

**Bloqueado por afuera, en orden de urgencia:**

1. **El DNS de Resend** — verificar un subdominio de `cosmiceaglejourney.com`.
   Es lo único que separa al sistema de correos de funcionar. **No puede ser
   `mail.`** (ya existe como CNAME al sitio viejo). El acceso a Cloudflare es el
   camino crítico: la misma llave sirve para mudar el sitio después.
2. **Traspaso de cuentas**: Supabase pasa a Sofía (quedar como miembro con
   permisos o se pierden el SQL, las migraciones y el MCP — el `project ref` y
   las llaves **no** cambian en una transferencia). Resend se crea con una
   casilla de ellas. Confirmar que `contacto@cosmiceaglejourney.com` existe: es
   el `reply_to` de todo y Resend no tiene bandeja de entrada.
3. **Las 5 preguntas de pagos** sin responder (`docs/consulta-sofia-pagos.txt`):
   cuotas, plazo, qué pasa si no paga, la tarjeta, el riel del saldo.
4. **Los cuatro corchetes de las páginas legales** — el país define si aplica la
   Ley 19.628 chilena o el RGPD, que trata la salud como categoría especial.
5. **Activar la protección de contraseñas filtradas** en el dashboard de
   Supabase (es un toggle).

**Construcción pendiente:**

- **Que el registro se sostenga solo, sin SMTP, hasta que esté el dominio**
  (decidido el 16/09). El embudo **ya funciona sin correo**: el registro no pide
  confirmación (el toggle de Supabase está apagado a propósito), `sendEmail`
  nunca lanza y deja el "no se pudo avisar" en la campanita, los avisos al admin
  los escribe un trigger, y `/cuenta` dice el **paso siguiente** de cada
  solicitud. El único agujero es **recuperar la contraseña**:
  `resetPasswordForEmail` sale por el SMTP de Supabase y hoy el formulario
  responde "te mandamos un correo" **y no llega nada**. Faltan dos cosas: (1) un
  botón en el panel que genere un link de recuperación con la API admin —el
  cliente service-role ya existe— para que Estela lo pase por WhatsApp, y (2)
  corregir el copy de `/cuenta/recuperar` mientras tanto. **Ojo: "Confirm email"
  del dashboard tiene que seguir desactivado** o el registro se rompe en el acto.

- Las 4 comunicaciones que faltan ([6] preparación, [7] logística completa,
  [8] integración, [9] feedback): ya tienen enum y plazo, les falta contenido.
- `/preparacion`, que con las primitivas ya construidas es composición pura.
- El **Manual Evolutivo** de la biblioteca (tres etapas de contenido, no tres
  niveles de acceso) y el rediseño tipo Netflix de `/contenidos` que muestra el
  video de Julia.
- El **chip de grupo de las FAQs** (hoy salen 29 en lista plana; el verde del
  diseño aprobado no existe en la paleta).
- La corrección de Julia sobre About, sin implementar
  (`docs/entregas/2026-09-04-julia-about/`): fondo de imagen,
  `KEYWORD_START_OFFSETS` medido en vivo y no hardcodeado, y el degradé de tres
  colores por línea. Es su última entrega; **implementarla o descartarla lo
  decide Sofía**, ya no se le consulta a ella.
- i18n ES/EN — decidido: todo en `es.json`, `en.json` generado una vez por
  script, revisión manual de los términos específicos, `next-intl` estático.
- Chatbot IA.

**Decisiones abiertas que esperan a las clientas:**

- **Si una Sesión es siempre de un día** (abierta desde el 06/08) y **la
  repetición de fechas** que había pedido Julia: las dos piden tabla hija de
  fechas, cupo por fecha y revisar el correo [7].
- Si el cuerpo del sitio pasa a la serif que pide el manual de marca. Era un
  desacuerdo entre el manual y Julia, que cerró Montserrat explícitamente;
  **con ella afuera lo destraba Sofía sola**. Sigue faltando el PDF del manual
  completo, que llegó **truncado**.
- Los umbrales de Avanzado y Experto del CRM (10 y 20, **inventados**).
- Si el consentimiento que se extrajo del Google Form es el texto vigente.
- El destino de "Contacta soporte" y de los links apagados del footer.
- Copy de la clienta sin lugar en `docs/COPY_HUERFANO.md`.

**Deuda anotada**: los cuatro testimonios de "Nuestros Sanadores" en producción
son **Lorem ipsum**; `Collapsible` dice que renderiza siempre para el SEO pero
monta recién al abrir; quedan componentes sin uso de los rediseños anteriores
(`PortalsSection`, `AboutSection`, `EbookSection`, `TripsSection`, `QuoteBand`,
`HumanitySection`, `GoldDivider`, `FeatureBlock`, `DocumentCard`, `CallBand`,
`ClosingSection`), varios cargando copy huérfano.
