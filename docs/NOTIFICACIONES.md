# Avisos: mail a la persona + casilla interna del panel

Fecha: 2026-08-18. Dos cosas que se hicieron juntas porque son la misma pregunta
—"¿quién se entera de qué?"— vista desde los dos lados del mostrador.

## 1. El mail de aprobación (afuera)

`reviewApplication` (`src/app/admin/solicitudes/actions.ts`) manda el mail cuando
el admin aprieta **Aprobar**. Antes no mandaba nada: el estado cambiaba en la base
y la persona se enteraba sólo si entraba a `/cuenta` a mirar.

Detalles que no son casuales:

- **Sólo en la transición a `approved`.** La solicitud se lee *antes* del update
  para conocer el estado anterior. Un segundo click sobre una solicitud ya
  aprobada no vuelve a escribirle a la persona.
- **Sólo al aprobar.** Rechazar y expirar no mandan mail: un rechazo por datos de
  salud merece una conversación, no un correo automático. Si alguna vez se quiere,
  el template va aparte.
- **El mail sale después del update.** Si Resend falla, la aprobación ya está
  hecha. `sendEmail` nunca lanza (ver `docs/EMAIL.md`).
- **Se manda al `email` del formulario**, no al de la cuenta: es el que la persona
  escribió para este viaje.
- Va sólo el primer nombre. "Hola María Fernanda Gómez" suena a carta del banco.

**Sigue sin salir hasta que esté el DNS.** Sin `RESEND_API_KEY`, `sendEmail`
devuelve `not_configured` — y eso ahora **queda registrado en la casilla interna**
como "no se pudo avisar", así que el aviso no se pierde en los logs.

## 2. La casilla interna del panel (adentro)

Campanita en el nav del admin con el contador de sin leer, y
`/admin/notificaciones` con el listado. Migración
`20260818130000_admin_notifications.sql`.

Sale del paso 4 del flujo de Sofía (`docs/FLUJO_INSCRIPCION.md`): "el sistema debe
generar un aviso interno para revisión" cuando hay respuestas de salud
afirmativas.

Tres tipos de aviso (`admin_notification_kind`):

| Tipo | Cuándo | Quién lo escribe |
|---|---|---|
| `application_new` | Llegó una solicitud sin banderas | Trigger en Postgres |
| `application_health_flag` | Llegó una solicitud que declara condición de salud, uso de sustancias, trauma o tratamiento nuevo | Trigger en Postgres |
| `email_failed` | Un mail de la app no salió | El código, al fallar el envío |

Decisiones:

- **Los avisos de solicitud los escribe un trigger, no el server action.** Quien
  inserta la solicitud es el postulante, que no es admin y no puede escribir en
  `admin_notifications`. El trigger es `security definer` justamente para eso, y
  además garantiza que el aviso exista pase por donde pase el insert (form, seed,
  SQL a mano).
- **La regla de "requiere revisión manual" está escrita dos veces**: en el trigger
  (SQL) y en el detalle de la solicitud (`needsManualReview`, React). Es
  `health_condition || substance_use || trauma` para primerizos y `new_treatment`
  para recurrentes. Si cambia una, cambia la otra — están comentadas cruzadas.
  No se unificó porque una corre en Postgres y la otra en el browser.
- **Leído es global, no por admin.** Una sola columna `read_at`/`read_by`. Con dos
  o tres personas mirando la misma casilla alcanza; si aparecen admins con
  alcances distintos, esto pasa a ser `admin_notification_reads (notification_id,
  user_id)`.
- **El contador vive en el layout del admin** y baja como prop a `AdminNav`, que
  es cliente. Por eso los actions llaman `revalidatePath("/admin", "layout")` y no
  sólo la página: si no, la campanita se queda con el número viejo.
- **RLS: sólo admin, en todas las operaciones.** El cuerpo del aviso cita qué
  declaró la persona, así que es dato sensible. Verificado con `set role`: `anon`
  y un usuario logueado no admin ven cero filas.
- **Grants por columna**: el admin sólo puede escribir `read_at` y `read_by`. El
  `revoke` a nivel tabla va primero, si no el grant por columna no hace nada (el
  bug de `20260731210000`).
- Borrar una solicitud borra sus avisos (`on delete cascade`). Verificado.

## Lo que NO hace

- **No hay tiempo real.** El contador se actualiza al navegar o al revalidar, no
  solo. Con el volumen de Cosmic Eagle no hace falta un canal de Realtime.
- **No manda mail al admin.** El aviso vive en el panel. Si Estela quiere
  enterarse sin entrar, el paso siguiente es un mail diario de resumen — no uno
  por solicitud.
- **No avisa nada más**: consentimiento, pagos y material de integración no
  existen todavía, así que no hay avisos para ellos.
