# Mails de la app (Resend)

Fecha: 2026-08-15, actualizado 2026-08-29. Cubre los mails que dispara la aplicación. Los mails de
**autenticación** (recuperar contraseña, confirmar cuenta) los manda Supabase por
su cuenta y se configuran aparte: ver `docs/AUTH_EMAIL.md`.

## Los dos canales, que se confunden fácil

Es la misma cuenta de Resend, pero llegan por caminos distintos:

| Mail | Quién lo manda | Dónde se configura |
|---|---|---|
| Recuperar contraseña, confirmar cuenta | Supabase Auth | SMTP en el dashboard de Supabase |
| Solicitud aprobada, avisos del admin | Nuestro código | `src/lib/email/resend.ts` |

Y un tercero que no es ninguno de los dos: **Google Workspace** sigue siendo el
correo humano de ellas (`contacto@cosmiceaglejourney.com`). Resend no tiene
bandeja de entrada — por eso todos los mails salen con `reply_to` apuntando a esa
casilla, o una respuesta se pierde en el vacío.

## Estado: falta el DNS, el código está listo

**Nada se envía todavía.** Sin `RESEND_API_KEY`, `sendEmail` loguea y devuelve
`not_configured` en vez de fallar — que es el estado normal en local.

Para que salga un mail hacen falta tres cosas, en orden:

1. **Verificar `mail.cosmiceaglejourney.com` en Resend** (registros DNS en el
   Cloudflare del dominio). Es el bloqueante: Resend no entrega a terceros sin
   dominio verificado. Un subdominio y no la raíz, para no tocar el MX de
   Workspace ni el A record del sitio viejo. Ojo de fusionar el SPF si ya existe.
2. Cargar las variables de entorno (abajo) en `.env.local` y en Vercel.
3. ~~Cablear el envío al flujo que corresponda~~ **HECHO**: aprobar una solicitud
   manda `SolicitudAprobada` (18/08), y desde el 29/08 están también el acuse de
   recibo, el rechazo y el aviso de cupo reservado (tabla más abajo). Ver
   `docs/NOTIFICACIONES.md`. Falta igual el punto 1, así que todavía no sale
   nada — pero ahora el "no salió" queda anotado en la casilla interna del panel
   en vez de perderse en los logs.

## Variables de entorno

| Variable | Ejemplo | Si falta |
|---|---|---|
| `RESEND_API_KEY` | `re_...` | No se manda nada (se loguea) |
| `RESEND_FROM` | `Cosmic Eagle <hola@mail.cosmiceaglejourney.com>` | Cae al sandbox `onboarding@resend.dev`, que solo entrega a la casilla dueña de la cuenta |
| `RESEND_REPLY_TO` | `contacto@cosmiceaglejourney.com` | Usa esa misma dirección por defecto |
| `NEXT_PUBLIC_SITE_URL` | `https://cosmic-eagle.vercel.app` | Usa la URL de Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | El cron de correos programados no corre (devuelve `ok: false`) |
| `CRON_SECRET` | cualquier cadena larga | El cron de correos devuelve **401 y no manda nada** |

**Ojo con `SUPABASE_SERVICE_ROLE_KEY`**: saltea la RLS por completo. La usa un
solo archivo (`src/lib/supabase/admin.ts`) y un solo consumidor (el cron de
correos programados). Nunca lleva el prefijo `NEXT_PUBLIC_` — con él, Next la
inlinearía en el JavaScript que se descarga el visitante.

## Archivos

| Archivo | Rol |
|---|---|
| `src/lib/email/resend.ts` | Cliente y `sendEmail`. No lanza nunca |
| `src/emails/BaseLayout.tsx` | Marco común: paleta del sitio, `Title`, `Paragraph`, `CtaButton` |
| `src/emails/SolicitudRecibida.tsx` | Acuse del filtro corto. Cableado a `submitApplication` |
| `src/emails/SolicitudAprobada.tsx` | Aprobación. Cableado a `reviewApplication` |
| `src/emails/SolicitudRechazada.tsx` | Rechazo. Cableado a `reviewApplication` |
| `src/emails/PagoRegistrado.tsx` | Cupo reservado. Cableado a `markPayment` |
| `src/emails/SolicitudConversemos.tsx` | Requiere conversación. Cableado a `reviewApplication` |
| `src/emails/RecordatorioSaldo.tsx` | [3B]. Lo manda el **cron**, no un botón |
| `src/emails/FormulariosPendientes.tsx` | [4A]. Ídem |
| `src/lib/email/scheduled.ts` | El barrido diario: qué correo le toca hoy a cada solicitud |
| `src/lib/email/schedule-config.ts` | Los plazos, casi todos provisorios |
| `src/lib/supabase/admin.ts` | Cliente service role. Sólo lo usa el cron |
| `src/app/api/cron/emails/route.ts` | La ruta del cron (`vercel.json`, 13:00 UTC) |

## Los mails con botón, y cuándo sale cada uno

Estos salen de un server action: alguien aprieta algo en el panel y el correo
sale. Los que dispara el calendario están en la seccion siguiente.

Todos salen **solo en la transición**: se relee el estado anterior antes del
update, así que volver a apretar el mismo botón no le vuelve a escribir a nadie.

| Mail | Disparador | Transición exacta |
|---|---|---|
| Recibimos tu solicitud | `submitApplication` | insert del filtro corto |
| Tu solicitud fue aprobada | `reviewApplication` | `* → approved` |
| Sobre tu solicitud | `reviewApplication` | `* → rejected` |
| Tu cupo está reservado | `markPayment` | pago `pending → paid`/`waived`, **y** solicitud ya `approved` |

Tres decisiones de este set:

- **`expired` no manda mail.** Es una invalidación administrativa, no una
  respuesta a la persona.
- **El rechazo no dice por qué.** El motivo puede ser un dato de salud del
  filtro, y eso no viaja por mail. Si hay que explicarlo, lo hace Estela.
- **`PagoRegistrado` es el que destraba la etapa 2**: su CTA lleva al formulario
  de salud si la persona es primeriza y todavía no lo mandó, y al detalle del
  viaje si no. Mientras el pago se marque a mano, este mail es el único acuse
  que la persona recibe de ese pago.

**Ojo con el acuse de recibo**: un fallo ahí **no** se anota en la casilla de
avisos, a diferencia de los otros tres. Quien corre esa acción es el postulante,
que no tiene permiso de escribir en `admin_notifications`. Queda en los logs y
nada más — aceptable, porque el aviso que Estela sí necesita (solicitud nueva) lo
escribe el trigger de Postgres.

Previsualizar sin mandar nada: `pnpm email` (abre en `localhost:3001`, con hot
reload de los templates).

## Decisiones que parecen rebuscadas y no lo son

Todas salen de bugs ya pagados en otro proyecto (skills `react-email-resend` y
`email-boton-fondo-blanco-mobile` de brain-data). No "simplificar" ninguna:

- **El cliente de Resend se instancia lazy**, no a nivel de módulo. A nivel de
  módulo corre durante el *Collect Page Data* del build de Vercel: si la env var
  no está cargada, **se cae el deploy entero**, no solo el mail.
- **`sendEmail` nunca lanza.** Quien llama siempre está haciendo otra cosa más
  importante (aprobar una solicitud): si el mail falla, la aprobación tiene que
  quedar hecha igual.
- **Los fondos van en tablas con el atributo `bgcolor`**, además del CSS. Gmail
  app descarta fondos declarados solo por CSS, y con una paleta oscura eso
  significa un mail blanco. Detalle de tipos: `bgcolor` existe en
  `TableHTMLAttributes` pero **no** en `TdHTMLAttributes` — en el `<td>` va por CSS.
- **Las metas `color-scheme` en el `<Head>` son obligatorias.** Sin ellas iOS Mail
  y Gmail app aplican su transformación automática de modo oscuro y reescriben
  los colores a criterio propio.
- **El CTA no usa el `<Button>` de react-email**: ese es un `<a>` con el color solo
  en CSS, y sale con fondo blanco en varios clientes móviles.
- **Nada importante vive dentro de una imagen.** Gmail bloquea imágenes de
  remitentes nuevos por defecto; el logo es decorativo y el mail se lee sin él.
- **Estilos inline**, nunca `<style>` en el head.

## Cuota, cuando llegue el momento de mandar en volumen

El plan free de Resend son ~100 mails/día y ~3.000/mes. Para avisos de aprobación
sobra. Si alguna vez se manda una campaña al newsletter, leer la sección de
campañas masivas del skill `react-email-resend` **antes**: la cuota diaria se
agota en silencio y se parece a un rate limit, y diagnosticarla mal cuesta medio día.

## Los mails que no tiene botón (cron diario)

Desde el 03/09 hay un segundo canal: un cron diario barre las solicitudes y manda
lo que corresponda por fecha. La arquitectura completa está en
`docs/COMUNICACIONES.md` §8; lo mínimo para operarlo:

| | |
|---|---|
| Ruta | `GET /api/cron/emails` |
| Cuándo | `vercel.json`, 13:00 UTC (una hora después del keep-alive) |
| Auth | `Authorization: Bearer $CRON_SECRET`, **obligatorio** |
| Hoy manda | [3B] recordatorio de saldo, [4A] formularios pendientes |
| No remanda | `scheduled_email_log`, índice único (solicitud, tipo) |

Probarlo a mano, con el server local levantado:

```bash
CRON_SECRET=lo-que-sea pnpm dev
curl -H "Authorization: Bearer lo-que-sea" localhost:3000/api/cron/emails
# {"ok":true,"sent":0,"failed":0,"skipped":3,"deferred":0,...}
```

`skipped` son los correos que correspondían pero no salieron porque Resend
todavía no está configurado. **Ese número es la medida de lo que va a salir el
día que se verifique el dominio**, y no deja rastro en la base: los envíos siguen
pendientes.
