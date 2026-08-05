# Mails de autenticación (Supabase Auth)

Fecha: 2026-08-05. Cubre recuperación de contraseña y, si algún día se prende,
confirmación de cuenta.

## El mailer que trae Supabase: sirve, pero solo para nosotros

Primero, para sacarlo del medio: **el login con email + contraseña no manda
ningún mail**. Compara la clave contra la base y listo. Los mails de auth
aparecen solo en recuperar contraseña, confirmar cuenta, magic link, invitación
y cambio de email.

Supabase trae un SMTP propio que funciona sin configurar nada, con tres límites:

1. **Solo entrega a los miembros de la organización del proyecto.** Textual de la
   doc: *"Unless you configure a custom SMTP server for your project, Supabase
   Auth will refuse to deliver messages to addresses that are not part of the
   project's team."* Al resto le responde *Email address not authorized*, que
   desde el sitio se ve como si el mail nunca hubiera llegado.
2. Rate limit muy bajo (unos pocos mails por hora) y variable sin aviso.
3. Sin garantía de entrega — es best-effort declarado.

O sea que **para que Ignacio pruebe el flujo alcanza con el mailer incluido**: su
dirección ya es miembro de la organización. No hace falta dar de alta nada.

Cuándo deja de alcanzar:

| Quién prueba | Qué hace falta |
|---|---|
| Ignacio solo | Nada. El mailer incluido ya le entrega |
| Estela | Agregarla a la organización de Supabase (gratis, pero le da acceso al dashboard del proyecto) o SMTP propio |
| Cualquier persona real usando el sitio | SMTP propio, sin vuelta |

## Cuando haga falta el SMTP: que no haya dominio no bloquea nada

Un proveedor de mail ofrece dos formas de habilitar un remitente:

- **Verificar un dominio** (registros DNS). Es lo mejor a futuro — permite
  `no-reply@cosmiceagle.com` — pero necesita el dominio comprado.
- **Verificar una sola dirección de remitente** (te mandan un mail con un link).
  No necesita dominio: alcanza con un Gmail. Es lo que corresponde ahora.

Con la segunda opción los mails salen desde esa casilla (ej.
`cosmiceagle.contacto@gmail.com`) y llegan a cualquier destinatario. La
contra es que caen en spam más seguido que un dominio autenticado, y que el
remitente que ve la persona es un Gmail. Para probar alcanza; **cuando esté el
dominio se cambia solo la configuración SMTP, sin tocar código**.

**Ojo al elegir proveedor:** varios (Resend, entre ellos) en su modo sin dominio
te dejan mandar *solo a tu propia dirección*, que reproduce exactamente el
problema del mailer de Supabase. Antes de decidir hay que confirmar en el
proveedor que la verificación por remitente único permita enviar a terceros.
Brevo y Mailjet históricamente lo permiten; conviene verificar los términos
actuales al crear la cuenta, porque esto cambia seguido.

## Configuración en el dashboard de Supabase

Nada de esto está en el repo — son settings del proyecto `hwayqsgwoaznfqofsyly`.

### 1. SMTP

`Project Settings → Authentication → SMTP Settings` → *Enable Custom SMTP*, y
cargar host, puerto, usuario y contraseña del proveedor, más el *Sender email*
(la dirección verificada) y el *Sender name* (`Cosmic Eagle`).

### 2. URLs

`Authentication → URL Configuration`:

- **Site URL**: `https://cosmic-eagle.vercel.app`
- **Redirect URLs** (lista blanca — si una URL no está acá, Supabase la ignora):
  - `https://cosmic-eagle.vercel.app/auth/confirm`
  - `https://cosmic-eagle-*.vercel.app/auth/confirm` (previews de Vercel)
  - `http://localhost:3000/auth/confirm` (desarrollo)

### 3. Plantillas de mail

`Authentication → Email Templates`. Hay que reemplazar el
`{{ .ConfirmationURL }}` que viene por defecto:

| Plantilla | Link |
|---|---|
| Reset Password | `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery` |
| Confirm signup | `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email` |

**Por qué no se deja el default.** `{{ .ConfirmationURL }}` usa PKCE: el
`code_verifier` queda en una cookie del navegador que pidió el mail. Si la
persona pide el cambio en la computadora y abre el mail en el teléfono —el caso
más común— el canje falla. Con `token_hash` el link anda desde cualquier
dispositivo. Es el flujo que Supabase recomienda para apps con render en
servidor.

Conviene además traducir el texto de las plantillas al español, que vienen en
inglés.

### 4. Confirmación de cuenta: sigue APAGADA

`Authentication → Sign In / Providers → Email → Confirm email` **queda
desactivado**, como está hoy. El gate de acceso es la aprobación manual del
admin, no el mail (ver CLAUDE.md). Prenderlo agrega una fricción que no filtra
nada y ya rompió el login una vez.

El código igual quedó preparado: `signup` manda `emailRedirectTo` y
`/auth/confirm` acepta `type=email`. Si se decide prenderlo, es un toggle, no un
deploy.

## Lo que sí está en el repo

| Archivo | Rol |
|---|---|
| `src/app/auth/confirm/route.ts` | Canjea el `token_hash` por sesión y redirige |
| `src/app/cuenta/recuperar/` | Pedir el mail de recuperación |
| `src/app/cuenta/nueva-clave/` | Definir la contraseña nueva (requiere sesión) |
| `src/lib/site-url.ts` | Resuelve el origen para el `redirectTo` |
| `requestPasswordReset` / `updatePassword` | En `src/app/cuenta/actions.ts` |

`proxy.ts` ya excluía `/auth/` del matcher, así que el refresco de sesión no
pisa las cookies que setea el `verifyOtp`.

### Decisiones de seguridad

- **`requestPasswordReset` responde "listo" siempre**, exista o no la cuenta. Si
  distinguiera los dos casos, el formulario sería un oráculo para averiguar quién
  está registrado — y acá estar registrado se correlaciona con haber participado
  de una ceremonia.
- **El parámetro `next` de `/auth/confirm` se valida** (tiene que empezar con `/`
  y no con `//`). Viene de una URL de un mail: sin el guard es un open redirect.
- **El token no sigue viaje**: la redirección se arma limpiando la query, así no
  queda en el historial ni en el `Referer`.

## Cómo probarlo

Orden sugerido: configurar URLs y plantillas, probar con la cuenta de Ignacio
usando el mailer incluido, y recién montar el SMTP cuando lo tenga que probar
alguien más.

1. Configurar URLs y plantillas (arriba). El SMTP, solo si hace falta.
2. En `/cuenta` → "¿Olvidaste tu contraseña?" → poner un mail registrado.
3. Abrir el link del mail **desde otro dispositivo**, que es el caso que rompe el
   flujo default.
4. Debería caer en `/cuenta/nueva-clave` con la sesión abierta; al guardar,
   vuelve a `/cuenta` con el aviso.
5. Volver a abrir el mismo link: tiene que mostrar "el enlace venció o ya se usó"
   (son de un solo uso).

## Pendiente

- Comprar el dominio y migrar el remitente de la casilla verificada a
  `no-reply@<dominio>` con SPF/DKIM. Es solo cambiar el SMTP.
- Decidir si el mail de "solicitud aprobada / rechazada" sale por acá o por otro
  canal — eso es el pendiente de comunicación admin → usuario (`docs/ROLES.md`),
  y **no** son mails de auth: Supabase Auth solo manda los suyos.
