# Auditoría del flujo de usuario — estado real al 2026-08-13

> Relevado leyendo el código en producción (`main`), no la documentación previa.
> Donde el código y `docs/ROLES.md` / `docs/CONTEXT.md` no coinciden, manda el código
> y queda marcado como **divergencia**.
>
> Preparado para la reunión con la clienta: la pregunta que responde es *¿la web es hoy
> un clon del flujo que Estela ya usa con sus clientes, o le falta / le sobra algo?*

---

## 1. Categorías de usuario que existen hoy

En la base hay **un solo flag de rol**: `profiles.is_admin` (booleano). Todo lo demás
—"solicitante", "viajero", niveles de experiencia— es **derivado del historial de
solicitudes**, no un permiso guardado.

| # | Categoría | Cómo se determina | Qué habilita de más |
|---|---|---|---|
| 0 | **Anónimo** | sin sesión | Todo el sitio público + suscribirse al newsletter |
| 1 | **Registrado** | tiene cuenta | `/cuenta` (perfil + avatar) y postularse a un viaje |
| 2 | **Solicitante** | tiene ≥1 solicitud en `pending_review` | Ver el estado de su solicitud |
| 3 | **Viajero** | tiene ≥1 solicitud `approved` | Una sección "Viajes aprobados" en `/cuenta`. **Nada más** |
| 4 | **Admin** | `profiles.is_admin = true` | Panel `/admin` completo |

Puntos importantes:

- **Ser "viajero aprobado" hoy casi no cambia nada.** Lo único que gana es una tarjeta
  con el viaje en `/cuenta`. No hay consentimiento, ni mensajes del admin, ni material
  de preparación, ni contenido exclusivo. Es el hueco más grande respecto de lo que
  promete `docs/ROLES.md`.
- **Divergencia con `docs/ROLES.md`**: el documento dice que el solicitante "no tiene
  acceso al panel de usuario". En el código **cualquier usuario logueado entra a
  `/cuenta`** y ve su tabla de solicitudes. El panel no está gateado por aprobación.
- **`is_admin` sólo se promueve por SQL / dashboard de Supabase.** No hay pantalla para
  hacer admin a alguien, y está bien: la migración `20260731210000` revoca el `UPDATE`
  de esa columna para que nadie se autopromueva.
- **Todos los admins son iguales.** No existe un rol intermedio (ej. alguien que cargue
  viajes y textos pero no vea los datos de salud). Si Sofía va a tocar `/admin/multimedia`,
  hoy eso implica darle acceso a las fichas médicas completas. **Decisión para la reunión.**
- **No existe el rol facilitador / guía / staff.** Confirmado también en
  `docs/FORMULARIOS.md`: el formulario "Travelers" es el inglés de "Viajer@s", no un
  formulario de facilitadores.
- Los niveles del CRM (Nuevo · Principiante · Intermedio · Avanzado · Experto) son
  **etiquetas de lectura para el admin**, no permisos. No cambian nada de lo que el
  usuario ve.

---

## 2. Permisos, verificados contra las policies de RLS

| Recurso | Anónimo | Registrado | Admin |
|---|---|---|---|
| `trips` (leer) | ✅ todos, **incluidos borradores** | ✅ | ✅ |
| `trips` (crear/editar/borrar) | ❌ | ❌ | ✅ |
| `applications_*` (crear) | ❌ | ✅ sólo con su propio `user_id` | ✅ |
| `applications_*` (leer la ficha completa) | ❌ | ❌ **ni la suya** | ✅ |
| Estado de las solicitudes propias | ❌ | ✅ vía vistas `my_applications_*` (sólo estado y fechas, sin datos médicos) | ✅ |
| `profiles` | ❌ | ✅ el propio (menos `is_admin`) | ✅ todos |
| `consents` | ❌ | ✅ crear/leer los propios | ✅ |
| `newsletter_subscribers` | ✅ **insertar** (única escritura anónima) | ✅ | ✅ leer |
| `site_content` (textos/imágenes) | ✅ leer | ✅ leer | ✅ escribir |
| Storage `avatars` | — | ✅ su carpeta | ✅ |
| Storage `trip-images`, `site-assets` | lectura por URL | lectura por URL | ✅ escribir |

Dos detalles que conviene conocer antes de la reunión:

1. **Los borradores de viaje son legibles por RLS.** La policy deja leer todos los
   `trips` a cualquiera; que un `draft` no tenga página pública es una decisión de la
   página (`/viajes/[id]` devuelve 404), no de la base. En la práctica: si alguien
   conoce el UUID no ve la página, pero un borrador no es un secreto criptográfico.
2. **Los datos de salud están bien cerrados.** El propio solicitante **no puede releer
   lo que envió** — sólo el admin. Eso es correcto en privacidad, pero tiene una
   consecuencia de producto: si la persona se equivocó en un dato, no puede corregirlo
   ni verlo. Hoy no hay forma de editar una solicitud enviada.

---

## 3. Formularios que existen hoy en la web

### Públicos / de usuario

| # | Formulario | Ruta | Campos | Estado |
|---|---|---|---|---|
| 1 | Registro | `/cuenta?modo=registro` | nombre, email, contraseña (mín. 8) | ✅ funciona. **Sin confirmación por mail**, a propósito |
| 2 | Login | `/cuenta` | email, contraseña | ✅ |
| 3 | Recuperar contraseña | `/cuenta/recuperar` | email | ⚠️ código listo, **no manda el mail** (falta config + SMTP, ver `docs/AUTH_EMAIL.md`) |
| 4 | Nueva contraseña | `/cuenta/nueva-clave` | contraseña ×2 | ⚠️ ídem, depende del mail |
| 5 | Foto de perfil | `/cuenta` | imagen ≤3MB | ✅ |
| 6 | **Solicitud primeriza** | `/viajes/[id]/solicitar` | nombre, edad, altura, peso, país, ocupación, email, teléfono + 9 preguntas sí/no con detalle + comentario | ✅ |
| 7 | **Solicitud recurrente** | `/viajes/[id]/solicitar` | nombre, email, ceremonias previas, fecha última ceremonia + 2 sí/no + tema + propósito | ✅ |
| 8 | Newsletter "Sintoniza" | footer, todo el sitio | email | ✅ |

### Sólo admin

| Formulario | Ruta | Notas |
|---|---|---|
| Alta/edición de viaje | `/admin/viajes/nuevo?tipo=…`, `/…/editar` | Título, descripción, lugar, fechas, cupo, precio, estado, portada, programa (hora + actividad) y condiciones. El **tipo se elige antes y no se edita** |
| Revisión de solicitud | `/admin/solicitudes/[tipo]/[id]` | Botones Aprobar / Rechazar / Expirar. Marca en rojo condición de salud, sustancias y trauma |
| Multimedia y textos | `/admin/multimedia` | Reemplaza imágenes y textos de las páginas públicas |

### Formularios que **no** existen todavía

- **Consentimiento informado.** La tabla `consents` está creada y con RLS, pero no hay
  ni una pantalla. Es el paso que en el flujo real de Estela va *después* de la solicitud.
  Bloqueado porque los textos legales son de ella y no están en el repo.
- **Contacto.** No hay formulario; el footer abre un `mailto:`.
- **Reserva / pago / seña.** Inexistente (ver §5).
- El campo "temas específicos a trabajar" es un **sí/no** en la web y en el Google Form
  real es **selección múltiple** con opciones predefinidas. Es el único desajuste de tipo
  entre los dos: falta la lista de opciones de Estela.

---

## 4. El recorrido, paso a paso, como está hoy

```
Visitante
  └─ /  o  /viajes  o  /viajes?tipo=ceremonias
       └─ /viajes/[id]  (página pública del viaje: portada, programa, aporte, condiciones)
            └─ CTA "Postularme"
                 ├─ sin sesión → /cuenta?next=…  (login o registro)
                 └─ con sesión → /viajes/[id]/solicitar
                      ├─ ¿tiene alguna solicitud APROBADA previa en la plataforma?
                      │     sí → formulario RECURRENTE (corto)
                      │     no → formulario PRIMERIZO (largo)
                      └─ envía → status = pending_review
                                   │
                                   │  ⚠️ acá no pasa NADA: no se avisa a nadie
                                   │
                      Admin entra a /admin → ve el pendiente en el dashboard
                           └─ /admin/solicitudes → detalle → Aprobar / Rechazar / Expirar
                                   │
                                   │  ⚠️ acá tampoco: el usuario no recibe aviso
                                   │
                      Usuario vuelve por su cuenta a /cuenta y ve el estado
                           └─ aprobado → aparece la tarjeta "Viajes aprobados"
                                          y el flujo TERMINA ahí
```

Reglas de negocio que ya están implementadas y conviene confirmar en voz alta:

- **La solicitud es por viaje, no de por vida.** Un rechazo en un viaje no bloquea
  postularse a otro.
- **Una vez enviada la solicitud para un viaje, la página muestra el estado y no deja
  volver a enviar**, sea cual sea el resultado. Es decir: **rechazado en un viaje = no
  puede reintentar en ese mismo viaje**, aunque el motivo del rechazo sea corregible
  (ej. un dato mal cargado). A validar.
- Si el viaje no está `open`, el formulario ni se muestra.
- **Un admin no puede aprobar su propia solicitud** (guard en el server action además de
  esconder los botones).
- El estado `expired` existe y es 100% manual: no hay vencimiento automático.

---

## 5. Diferencias contra el flujo que Estela usa hoy (Google Forms + WhatsApp)

Lo que la web **ya replica bien**:

- Los dos formularios (primerizo / recurrente) coinciden 1:1 con los de ella
  (verificado campo por campo en `docs/FORMULARIOS.md`).
- La aprobación manual obligatoria por datos de salud.
- Una solicitud atada a una ceremonia concreta, no un perfil único.
- El admin ve el historial completo de cada persona, no sólo la última solicitud.

Lo que **falta para que sea un clon del flujo real** — esto es la agenda de la reunión:

1. **No hay ninguna notificación, en ningún momento.** Ni cuando entra una solicitud
   (Estela tiene que entrar al panel a mirar), ni cuando se aprueba o rechaza (la persona
   se entera sólo si vuelve a `/cuenta`). Hoy ese hueco lo tapa WhatsApp/mail a mano.
   **Es el punto más importante: la respuesta al solicitante es parte del servicio.**
   Nota técnica: el envío de mails ya está bloqueado por lo mismo que la recuperación de
   contraseña — hace falta un SMTP propio.
2. **El consentimiento informado no existe como pantalla.** Es un paso obligatorio del
   flujo actual de ella.
3. **El cupo es decorativo.** `capacity` se muestra en la web y en el admin, pero **nadie
   cuenta cuántos aprobados hay**. No hay tope, no se cierra solo, y el admin no tiene
   una pantalla de "quiénes van a esta ceremonia": las solicitudes se listan por estado,
   no por viaje. Cerrar el cupo es cambiar el estado del viaje a mano.
4. **El cobro no existe.** El flyer dice "50% para reservar cupo"; la web sólo *muestra*
   esa frase como texto. Ninguna solicitud aprobada implica una reserva pagada. Esto es
   lo que bloquea también cupones e invitaciones (`docs/CRM.md` §5).
5. **Los recurrentes históricos verán el formulario largo.** La web decide qué formulario
   mostrar mirando el historial *en Supabase*; quien viene ceremoniando por Google Forms
   tiene historial cero. Tres salidas posibles, sin decidir (`docs/FORMULARIOS.md` §3).
6. **Doble canal.** Mientras los Google Forms sigan circulando por Instagram/WhatsApp,
   entran solicitudes por dos lados y hay que revisar en dos lugares. Falta fecha de corte.
7. **Sólo español.** Estela ya opera bilingüe; el inglés no es un "nice to have".
8. **El usuario no puede corregir ni ver lo que envió**, y el admin no tiene forma de
   pedirle "completá este dato" desde la plataforma (la comunicación admin → usuario
   sigue sin construirse).

---

## 6. Preguntas concretas para llevar a la reunión

1. Cuando aprobás o rechazás, **¿qué recibe la persona?** ¿Mail automático, o seguís
   escribiendo vos por WhatsApp? (Define si hay que montar SMTP ya.)
2. ¿El consentimiento se firma **en la web** o se sigue mandando aparte?
3. **¿La plataforma tiene que controlar el cupo?** ¿Se cierra sola al llegar al tope, o
   preferís decidirlo a mano viaje por viaje?
4. ¿Querés una pantalla de **"participantes de esta ceremonia"** (la lista de quién va)?
   Hoy no existe y parece lo que más se usa el día del viaje.
5. **La seña del 50%**: ¿queda por fuera (transferencia + aviso manual) o la web tiene
   que registrar quién pagó?
6. A alguien **rechazado en un viaje puntual, ¿se le permite reenviar** la solicitud a
   ese mismo viaje si corrige algo? Hoy no puede.
7. ¿Sofía necesita entrar al panel? Si sí, hace falta un **rol que no vea los datos de
   salud**; hoy admin es todo o nada.
8. La lista de opciones del campo **"temas específicos a trabajar"** (hoy es un sí/no).
9. ¿Cuándo se apagan los Google Forms?

---

Ver también: `docs/ROLES.md` (el flujo como se diseñó), `docs/FORMULARIOS.md` (los
formularios originales de Estela), `docs/CRM.md` (segmentación de contactos),
`docs/AUTH_EMAIL.md` (lo que falta configurar para que salga cualquier mail).
