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

## Solicitudes — primerizo (`applications_first_time`)

| Columna | Tipo | FK |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | auth.users |
| trip_id | uuid | trips |
| full_name | text | — |
| age | integer | — |
| height | text | — |
| weight | text | — |
| country | text | — |
| email | text | — |
| phone | text | — |
| occupation | text | — |
| health_condition | boolean | — |
| health_condition_detail | text | — |
| stress_anxiety | boolean | — |
| stress_anxiety_detail | text | — |
| trauma | boolean | — |
| trauma_detail | text | — |
| substance_use | boolean | — |
| substance_use_detail | text | — |
| allergies | boolean | — |
| allergies_detail | text | — |
| spiritual_practice | boolean | — |
| spiritual_practice_detail | text | — |
| first_time_plants | boolean | — |
| plants_detail | text | — |
| has_themes | boolean | — |
| themes_detail | text | — |
| fears | boolean | — |
| fears_detail | text | — |
| comment | text | — |
| status | enum | pending_review, approved, rejected, expired |
| reviewed_by | uuid | auth.users (admin) |
| reviewed_at | timestamptz | — |
| created_at | timestamptz | — |

### Campos de decision

`health_condition`, `substance_use`, `trauma` → si alguno es `true`, la solicitud **requiere revision manual obligatoria** (no se auto-aprueba).

## Solicitudes — recurrente (`applications_returning`)

| Columna | Tipo | FK |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | auth.users |
| trip_id | uuid | trips |
| full_name | text | — |
| email | text | — |
| ceremony_date | date | — |
| new_treatment | boolean | — |
| new_treatment_detail | text | — |
| stress_anxiety | boolean | — |
| stress_anxiety_detail | text | — |
| theme | text | — |
| purpose | text | — |
| previous_ceremonies | integer | — |
| status | enum | pending_review, approved, rejected, expired |
| reviewed_by | uuid | auth.users (admin) |
| reviewed_at | timestamptz | — |
| created_at | timestamptz | — |

## Consentimientos informados (`consents`)

| Columna | Tipo | FK |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | auth.users |
| trip_id | uuid | trips |
| application_id | uuid | FK generico a ambas tablas de solicitud |
| date | date | — |
| confirmations | jsonb | 4 checkboxes |
| digital_signature | text | nombre tipeado |
| consent_version | text | version del texto legal |
| created_at | timestamptz | — |

## Reglas RLS

- Datos de salud (`applications_*`) → solo admin puede leer/escribir. El usuario solo ve sus propias solicitudes (status, no datos medicos).
- `consents` → usuario ve/crea sus propios, admin ve todos.
- `trips` → lectura publica, escritura solo admin.
- `users` → tabla custom para metadata de perfil (rangos, etc.), no confundir con `auth.users`.

## Usuario vs. Solicitante

Un `auth.users` puede tener 0, 1 o muchas solicitudes — **una por viaje**, no un perfil de salud unico de por vida. El campo `status` en la solicitud define su estado:
- `pending_review` → Solicitante (pre-aprobacion)
- `approved` → Viajero para ese viaje (acceso al panel de usuario mientras tenga al menos una solicitud `approved`)
- `rejected` → sin acceso para ese viaje, pero puede volver a aplicar a otro viaje (nueva fila, no se edita la rechazada)
- `expired` → aprobacion invalidada manualmente por el admin (ej. cambio de condicion de salud, viaje que ya paso)

Esto significa que el historial de un usuario es la lista completa de sus filas en `applications_first_time` / `applications_returning`, no un unico registro que se sobreescribe. El admin necesita una vista que muestre ese historial completo por usuario, no solo la solicitud mas reciente.
