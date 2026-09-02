# Cobro — lo que hay hoy y qué puede hacer la web

Actualizado 2026-09-01, con lo que trajo Sofía ese día (§5) y lo que ya quedó
implementado en la rama `cobros` (§6).

> **Los números de cuenta NO están acá.** Viven en
> `~/Escritorio/account/cosmic-eagle-cobros.txt`, fuera del repo, porque son
> datos bancarios reales más un RUT y el repo está en GitHub y conectado a
> Vercel. Este doc describe el esquema, no las credenciales.

## 1. Qué contestó Sofía

Dos rieles, elegidos por **procedencia del viajero**, no por viaje:

| Riel | Para | Instrumento |
|---|---|---|
| Santander España (IBAN + BIC) | US + Europa | Transferencia internacional |
| Mercado Pago Chile (cuenta vista) | Chile | Transferencia local |

Los dos apuntan a `Booking@cosmiceaglejourney.com` como contacto. Son **dos
titulares distintos** (una persona en España, otra en Chile).

## 2. El dato que importa: ninguno de los dos es una pasarela

Esto es lo que define todo lo demás.

- El IBAN es una **transferencia bancaria**. No hay API, no hay checkout, no hay
  webhook. Llega o no llega, y alguien lo mira en el homebanking.
- La cuenta de Mercado Pago es una **cuenta vista con número de cuenta**, o sea
  también una transferencia. **No es Mercado Pago Checkout**, que es el producto
  que sí tiene API, link de pago y webhook de confirmación. Son cosas distintas
  del mismo proveedor y se confunden fácil.

Conclusión: **la confirmación del pago es y va a seguir siendo manual** mientras
el cobro sea por estos dos rieles. `PaymentControls` en `/admin/solicitudes/[id]`
—donde Estela marca pagado / sin cargo— no es un parche provisorio: es el
mecanismo real.

Corolario para `docs/CRM.md` §5: cupones e invitaciones siguen bloqueados por lo
mismo. `payment_status = 'waived'` ya cubre el caso "no paga", que es lo único
que la plataforma puede saber sin cobrar.

## 3. Qué SÍ puede hacer la web hoy, sin pasarela

El escalón que hoy pasa por WhatsApp se puede subir a la plataforma sin cobrar
un peso online:

1. **Mostrar las instrucciones de pago en la pantalla de estado**
   (`/viajes/[id]/solicitar`, que ya es la pantalla de "en qué paso quedaste"):
   una vez aprobada, ahí va el monto, el riel que le toca y los datos.
2. **Mandarlas en el mail de aprobación** (`SolicitudAprobada`, ya cableado en
   `reviewApplication`). Hoy ese mail no dice cómo pagar.
3. **Elegir el riel**. Hace falta saber de dónde es la persona. Hoy no lo
   sabemos: `applications` no tiene país. O se agrega al filtro corto, o se
   muestran los dos rieles y elige el viajero. **Lo segundo es más barato y no
   toca el copy de Sofía** — decisión pendiente.
4. **Pedir el comprobante**. Un campo o un adjunto reduce el ida y vuelta con
   Estela. `payment_reference` ya existe para anotarlo del lado del admin.

Nada de esto necesita migración de schema salvo el país, y ninguno toca RLS.

## 4. Lo que sigue sin resolverse

- ~~**La moneda.**~~ **RESUELTO el 02/09/2026**, ver §7.
- **La seña del 50%.** El flyer la promete; con transferencia, es la persona la
  que decide cuánto manda. La web sólo puede decir el monto.
- **Dónde queda Encuadrado.** Ver `docs/ENCUADRADO.md`. La respuesta de Sofía
  llegó bajo el título "APPI ENCUADRADO", así que puede querer decir dos cosas
  distintas y hay que cerrarlo: (a) que Encuadrado cobra por detrás con estos
  mismos rieles, o (b) que estos rieles son un canal aparte y Encuadrado le
  sirve sólo para agendar. Si es (a), el `payment_url` de Encuadrado podría
  reemplazar la transferencia manual del riel chileno; si es (b), Encuadrado no
  aporta nada a este flujo.
- **Si algún día se quiere cobro automático**, el camino corto es **Mercado Pago
  Checkout** para Chile (ya tiene la cuenta) y **Stripe** para el resto. Los dos
  tienen webhook, que es exactamente lo que le falta a todo lo de arriba.


## 5. Lo nuevo del 01/09: Encuadrado sí cobra tarjeta y desde el exterior

Ignacio habló con Sofía. Tres cosas:

1. **Quiere conectar la API de Encuadrado**, porque acepta **tarjeta de crédito
   y pagos desde el exterior**, aunque cobren comisión.
2. **Para euros, la cuenta de Santander** (el riel que ya estaba en §1).
3. **Ella confirma el pago desde el panel mirando el comprobante**, como en la
   tiquetera de Manso Club.

### Qué corrige de lo que decía este documento

El §6 de `docs/ENCUADRADO.md` decía que el riel internacional no pasaba por
Encuadrado y que su `payment_url` "como mucho cubre a los viajeros chilenos".
**Eso era falso.** Si Encuadrado cobra tarjeta internacional, el `payment_url`
es el único checkout real disponible y la integración pasa a valer la pena.

Lo que **no** cambia es la objeción de fondo de `ENCUADRADO.md` §3.4, que nunca
fue "no cobra afuera" sino el **modelo de datos chileno**: si el servicio emite
boleta electrónica, el `POST /bookings` exige `rut` y `address_comuna_region`, y
un viajero de Tulum no tiene ninguno de los dos. Es la pregunta que hay que
cerrar antes de escribir la integración.

### Qué deja de ser un problema

La **falta de webhook**, que era la objeción principal. Sofía confirma a mano
mirando el comprobante: no es un provisorio a la espera de la pasarela, es el
mecanismo de operación. Eso es lo que se construyó en §6.

### Los dos rieles se confirman distinto

| Riel | Qué paga | Cómo lo confirma Estela |
|---|---|---|
| Encuadrado (tarjeta) | tarjeta, con comisión | mirando **su panel de Encuadrado**. No hay comprobante que subir |
| Santander euros | transferencia | mirando **el comprobante que sube el viajero** en nuestro panel |

Los dos terminan en el mismo botón (`PaymentControls`), pero uno trae adjunto y
el otro no. Por eso el comprobante es **opcional**: la pantalla lo ofrece, no lo
exige.

## 6. Lo que quedó implementado (rama `cobros`, 01/09)

Migraciones `20260901220000_notification_kind_payment_proof.sql` y
`20260901220100_payment_rails_and_proofs.sql`.

- **`/admin/pagos`**: Estela carga los medios de cobro (nombre, a quién le
  corresponde, instrucciones multilínea, moneda, link opcional, visible sí/no).
  **Los datos bancarios no están en el repo**: la migración siembra los dos
  rieles vacíos e inactivos y los números se cargan desde el panel.
- **Tabla `payment_methods` y no slots de `site_content`**: `site_content` se lee
  con el cliente público, o sea que `anon` puede listarla. Un IBAN, un titular y
  un RUT son datos de personas; acá el SELECT arranca en `authenticated`.
- **La pantalla de estado (`/viajes/[id]/solicitar`) muestra los datos de pago**
  a quien está aprobado y sin pagar, y le deja **subir el comprobante**. Si no
  hay ningún riel activo cae en "te vamos a escribir con los datos", que es lo
  que decía antes.
- **El mail de aprobación lleva los datos de pago** y su CTA ahora apunta a la
  pantalla de estado, no a la página del viaje: es donde se paga.
- **Tabla `payment_proofs`, no columnas en `applications`**: cada aporte del
  postulante sigue siendo un INSERT nuevo (nunca UPDATE sobre la fila con sus
  respuestas), y son **varios por solicitud** — el flyer promete seña del 50% y
  saldo.
- **Bucket `comprobantes` PRIVADO**, el único del proyecto: un comprobante lleva
  nombre, cuenta y a veces el saldo de quien transfiere. El panel lo abre con un
  **link firmado** que vence a los 10 minutos. Acepta PDF además de imágenes.
- **Aviso en la campanita** cuando llega un comprobante (`kind = 'payment_proof'`),
  escrito por un trigger `security definer` — el postulante no puede escribir en
  `admin_notifications`.
- **Subir un comprobante NO marca el pago.** `payment_status` lo sigue moviendo
  Estela desde `PaymentControls`, ahora con el archivo a la vista arriba.

Verificado: `tsc`, lint (los 2 errores de `multimedia/SlotEditor.tsx` son
previos), build de producción, y la RLS probada con `set role` sobre la base
real — el dueño de una solicitud aprobada inserta su comprobante y no lo relee,
otro usuario es rechazado, la misma solicitud sin aprobar es rechazada, el
UPDATE está revocado para todos, `anon` no tiene ni grant sobre `payment_methods`,
un usuario no admin ve sólo los rieles activos y no puede escribirlos, y el
trigger escribe el aviso. Filas de prueba borradas, todo volvió a cero.
Advisors sin novedades.

**Sin verificar end-to-end** (requiere sesión, la hace Ignacio): cargar un riel
desde `/admin/pagos`, verlo en la pantalla de estado de una solicitud aprobada,
subir un comprobante y abrirlo desde el panel.


## 7. La moneda: el precio se fija en dólares (02/09/2026)

Definido por Ignacio, sin esperar a Sofía: es una decisión de producto, no un
dato de ella. Era el punto 6 de las ocho preguntas de
`~/Escritorio/cosmic-eagle-cobros-requerimientos.txt`.

**`trips.price` está fijado en USD. Todos los demás rieles cobran el
equivalente del día.** El IBAN de Santander liquida en euros, Encuadrado en lo
que cobre; ninguno de los dos tiene un precio propio por viaje.

- **No se agregó columna `currency` a `trips`.** Si la moneda del viaje es
  siempre la misma, la columna sería una constante guardada 7 veces y un campo
  más en el form del admin. La moneda que varía es la del **riel**, y esa ya
  vive en `payment_methods.currency`.
- **`formatAmount` se mudó de `src/lib/payments.ts` a `src/lib/format.ts`** y
  ahora imprime `USD 900`. Es la **única** función que escribe un precio: antes
  el `USD` estaba escrito a mano en `TripsList`, en las dos vistas del detalle
  del viaje, y la pantalla de estado del postulante lo omitía a propósito
  (hedge de la indefinición). Eran cuatro criterios para el mismo número.
  `payments.ts` quedó sin ella y no la reexporta.
- **Un riel con moneda distinta de USD aclara "· el equivalente del día"** al
  lado de su etiqueta, en la pantalla de estado. Sin eso el monto de arriba se
  lee como si estuviera en la moneda del riel, que es exactamente el caso de
  "900 USD vs 900 EUR" que motivaba la pregunta.

Lo que **sigue abierto** de este hilo:

- El precio de la ceremonia de Santiago es una conversión aproximada de CLP a
  USD y hay que confirmarlo (`docs/EXPERIENCIAS_2026.md`).
- La seña del 50%: la web dice el monto total, y quien transfiere decide cuánto
  manda. Para que el sistema distinga "pagó la seña" de "pagó todo" hace falta
  un campo más y que Estela lo marque.
- En qué moneda cobra la tarjeta de Encuadrado (pregunta 4 de las ocho). No
  cambia lo de arriba: sea cual sea, es otro riel con su conversión del día.

---

## 8. El documento de comunicaciones asume seña + saldo (02/09)

`docs/COMUNICACIONES.md` (el orden cronológico de mails que mandó Sofía el
26/08) da por hecho un modelo de pago que **contradice la decisión de §7**: sus
correos [2], [3A], [3B] y [3C] ofrecen reservar el cupo con una seña, pagar el
saldo *"de una vez o en cuotas"* desde el espacio personal, y ponen una fecha de
corte a 15 días de la experiencia.

Hoy `payment_status` es `pending | paid | waived` — un booleano con excepción,
sin lugar para un pago parcial ni para un saldo.

**No se implementa nada hasta que respondan**: las siete preguntas están en
`docs/consulta-sofia-pagos.txt`. Es lo único de ese documento que cambia el
schema.

---

## 9. Seña y total, las dos opciones (02/09)

Sofía respondió las preguntas 1 y 2 de `docs/consulta-sofia-pagos.txt`: **se
ofrecen las dos opciones y el monto de la seña es editable por viaje.**

Eso **revierte lo que había decidido sola en §7** ("por Encuadrado se cobra el
total, la seña sigue siendo transferencia con comprobante"). Estaba marcado como
reversible justamente esperando esta respuesta. Hoy la web ofrece las dos por
cualquier riel; qué hace la tarjeta con la seña es la pregunta 6, todavía
abierta.

Detalle completo del modelo en `docs/COMUNICACIONES.md` §7. Lo esencial:
`trips.deposit_amount` (cuánto se pide, nulo = se paga completo),
`applications.amount_paid` (cuánto llegó, acumulado), y `payment_status` con
`deposit_paid` en el medio. El saldo es una resta, no una columna.

**Sigue sin existir el plazo de los 15 días** y ninguna pantalla lo nombra.
