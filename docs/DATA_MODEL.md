# Modelo de datos

> Derivado de los formularios actuales de Google Forms. Las tablas definitivas se crean en migraciones SQL.

## Viajes (`trips`)

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| title | text | — |
| description | text | — |
| location | text | — |
| start_date | date | — |
| end_date | date | — |
| capacity | integer | Cupo maximo |
| status | enum | draft, open, closed, completed |
| price | numeric | 0 si gratuito |
| created_at | timestamptz | — |

## Solicitudes (`applications`) — etapa 1, el filtro corto

Reemplazó a `applications_first_time` / `applications_returning` el 2026-08-19 (migración
`20260819180444_two_stage_applications.sql`). Las dos tablas viejas eran **alternativas**
—se elegía una según el historial— y el flujo real las convirtió en **etapas**: primero
este filtro, que llenan todos, y después el formulario extenso, que llega tras el pago.
Ver `docs/FLUJO_INSCRIPCION.md`.

| Columna | Tipo | FK / notas |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | auth.users |
| trip_id | uuid | trips |
| full_name | text | — |
| email | text | — |
| phone | text | opcional |
| previous_ceremonies | integer | ceremonias declaradas con Estela. **0 = primerizo** |
| new_treatment | boolean | + `new_treatment_detail` |
| stress_anxiety | boolean | + `stress_anxiety_detail` |
| theme | text | tema o intención, opcional |
| comment | text | opcional |
| status | enum | pending_review, approved, rejected, expired |
| reviewed_by | uuid | auth.users (admin) |
| reviewed_at | timestamptz | — |
| payment_status | enum | pending, paid, waived |
| paid_at | timestamptz | — |
| payment_reference | text | texto libre: no hay pasarela, lo carga el admin |
| created_at | timestamptz | — |

Índice único **parcial** `(user_id, trip_id) where status in ('pending_review','approved')`:
una sola solicitud viva por viaje, pero un rechazo o un vencimiento no bloquean volver a
postularse al mismo viaje.

Las preguntas del filtro son provisorias: salen del formulario "Viajer@s", que es el único
filtro corto relevado. Sofía describe uno de tres preguntas que no existe como Google Form
(ver `docs/FORMULARIOS.md`).

## Formulario de salud (`health_form_first_time`) — etapa 2

Es el formulario largo de Estela. Cuelga de la solicitud y **no repite** nombre, mail ni
teléfono: eso ya está en `applications`.

| Columna | Tipo | FK / notas |
|---|---|---|
| id | uuid | PK |
| application_id | uuid | applications, **unique** (uno por solicitud) |
| age | integer | — |
| height / weight / country / occupation | text | — |
| health_condition | boolean | + `_detail` |
| stress_anxiety | boolean | + `_detail` |
| trauma | boolean | + `_detail` |
| substance_use | boolean | + `_detail` |
| allergies | boolean | + `_detail` |
| spiritual_practice | boolean | + `_detail` |
| first_time_plants | boolean | + `plants_detail` |
| has_themes | boolean | + `themes_detail` |
| fears | boolean | + `_detail` |
| comment | text | — |
| created_at | timestamptz | — |

**No existe `health_form_returning`.** Con el filtro corto cubriendo lo que pedía el
formulario de Viajer@s, un recurrente no tiene etapa 2 conocida. Si aparece, es una tabla
hermana, no una columna acá.

### Campos de decisión

`health_condition`, `substance_use`, `trauma` → si alguno es `true`, la solicitud
**requiere revisión manual obligatoria**. Ojo: esas respuestas llegan en la etapa 2, o sea
**después** de aprobar. Lo único que se conoce al momento de revisar es `new_treatment`
del filtro corto.

## Vista `my_applications`

Lo único que el postulante puede leer de sus propias solicitudes: la tabla base no le
devuelve ninguna fila, ni las suyas. Expone `id, trip_id, status, payment_status,
is_first_time, health_form_submitted, consent_submitted, created_at, reviewed_at` — nunca
respuestas de salud.

## Consentimientos informados (`consents`)

| Columna | Tipo | FK |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | auth.users |
| trip_id | uuid | trips |
| application_id | uuid | applications, **unique** (uno por solicitud) |
| date | date | — |
| confirmations | jsonb | 4 checkboxes |
| digital_signature | text | nombre tipeado |
| consent_version | text | version del texto legal |
| created_at | timestamptz | — |

## newsletter_subscribers

Altas del formulario "Sintoniza" del pie de pagina. No tiene relacion con `auth.users`:
suscribirse no requiere cuenta.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | pk |
| email | text | CHECK de formato + unico por `lower(email)` |
| created_at | timestamptz | — |

No hay baja ni estado de suscripcion: si hace falta dar de baja a alguien, hoy es un
`delete` a mano. El panel (`/admin/suscriptores`) es solo lectura.

## Reglas RLS

- Datos de salud (`applications`, `health_form_first_time`) → solo admin lee/escribe. El postulante **solo inserta**: nunca hace SELECT ni UPDATE sobre esas tablas, y mira su estado por la vista `my_applications`. Es la propiedad que hizo elegir el modelo de dos etapas encadenadas por INSERT en vez de una fila que se completa.
- `applications` tiene `revoke update` de tabla + `grant update` de las columnas de revisión y pago: ni el admin puede editar las respuestas del filtro. Ojo, el admin también es `authenticated`: revocar sin devolver esas columnas lo deja sin poder aprobar.
- El insert en `health_form_first_time` lo autoriza `private.owns_approved_application()` (`security definer`): chequear la propiedad exige leer `applications`, donde el postulante no tiene SELECT.
- `consents` → usuario ve/crea sus propios, admin ve todos.
- `trips` → lectura publica, escritura solo admin.
- `newsletter_subscribers` → **insert publico** (unica tabla que escribe `anon`, acotado por grant a la columna `email`), lectura solo admin: la lista de correos no la ve ni un usuario logueado.
- `users` → tabla custom para metadata de perfil (rangos, etc.), no confundir con `auth.users`.

## Usuario vs. Solicitante

Un `auth.users` puede tener 0, 1 o muchas solicitudes — **una por viaje**, no un perfil de salud unico de por vida. El campo `status` en la solicitud define su estado:
- `pending_review` → Solicitante (pre-aprobacion)
- `approved` → Viajero para ese viaje (acceso al panel de usuario mientras tenga al menos una solicitud `approved`)
- `rejected` → sin acceso para ese viaje, pero puede volver a aplicar a otro viaje (nueva fila, no se edita la rechazada)
- `expired` → aprobacion invalidada manualmente por el admin (ej. cambio de condicion de salud, viaje que ya paso)

Esto significa que el historial de un usuario es la lista completa de sus filas en `applications`, no un unico registro que se sobreescribe. El admin necesita una vista que muestre ese historial completo por usuario, no solo la solicitud mas reciente.
