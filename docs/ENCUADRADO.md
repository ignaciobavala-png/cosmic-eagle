# Encuadrado — API pública, y qué encaja con Cosmic Eagle

Sofía dijo que hoy usa **Encuadrado** y preguntó por conectar su API a la
plataforma. Relevado el 2026-08-29 contra la doc de ayuda
(`ayuda.encuadrado.com/es/articles/15651081`) y el **spec OpenAPI real**
(`https://encuadrado.com/api/public/v1/openapi.json`), que es la fuente buena:
la nota de ayuda es un resumen y se queda corta.

## 1. Qué es la API, en concreto

Encuadrado es una plataforma para profesionales (agenda + cobro + boleta, muy
orientada a Chile). La API pública **no expone la plataforma entera**: expone
*dos* endpoints, y son los de "reservar una hora".

| | |
|---|---|
| Base URL | `https://encuadrado.com/api/public/v1/` |
| Auth | header `X-API-Key`, una key por cuenta profesional |
| Rate limit | 120 GET/min, 10 POST/min (headers `X-RateLimit-*`) |

**GET `/services/{service_uuid}/available-time-slots`**
Ventanas reservables de un servicio. Params `start` / `end` ISO-8601.
Devuelve `[{ start, end }]`.

**POST `/services/{service_uuid}/bookings`**
Crea la reserva. Body `{ data: {...} }`. Requeridos: `full_name` y
`booking_date_time`. Condicionales según config del país: `email`, `rut`,
`address` + `address_comuna_region` (exigidos si el servicio emite boleta
electrónica chilena). Opcionales útiles: `phone` + `phone_country_code` (E.164),
`comments`, `client_timezone` (default `America/Santiago`),
`terms_and_conditions`, `redirect_url`.

Respuesta 201, con **dos formas mutuamente excluyentes**:

- **Sin prepago** → `booking_token` con valor, `temporal_booking_token` null,
  y en `extras` un `intake_form_url`.
- **Con prepago** → `temporal_booking_token` con valor, `booking_token` null, y
  en `extras` un **`payment_url`** más `slot_reservation_expires_at`. Si no se
  paga antes de esa hora, el cupo se libera solo.

El `redirect_url` (a dónde vuelve el cliente después de pagar) **solo funciona
si el dominio está registrado y validado** en Encuadrado, desde Conexiones →
Especializadas → "Integración API". Ahí también se genera la key, que **se
muestra una sola vez**.

## 2. Lo que la API NO tiene

Esto es lo que decide el encaje, más que lo que sí tiene:

- **No hay webhooks.** Ninguno. No hay forma de que Encuadrado nos avise que
  alguien pagó.
- **No hay endpoint para consultar reservas.** No se puede preguntar "¿esta
  reserva quedó pagada?". El `booking_token` no se puede resolver contra nada.
- **No hay cancelar ni modificar.**
- **No hay listar servicios**: el `service_uuid` se saca a mano de la URL de
  edición del servicio en el panel de Encuadrado.
- Fuera de alcance a propósito, dice la doc: ficha clínica, boletas, gestión de
  pagos "y funciones confidenciales futuras".

**Consecuencia dura**: el único aviso de que el pago entró es el `redirect_url`,
o sea el browser del propio cliente volviendo a nuestro sitio. Eso lo puede
falsificar cualquiera escribiendo la URL a mano — **no sirve para marcar
`payment_status = 'paid'`**. La confirmación real sigue siendo Estela mirando su
panel de Encuadrado, que es exactamente lo que hoy hace `PaymentControls`.

## 3. Encaje con nuestro modelo

Nuestro flujo (`docs/FLUJO_INSCRIPCION.md`) es:

```
registro → filtro corto → revisión de Estela → PAGO → salud → consentimiento
```

Encuadrado modela **agenda de horas de un profesional**, no **cupos de un viaje
con fecha fija y aprobación previa**. Los choques:

1. **El orden es incompatible.** En Encuadrado la reserva *es* el punto de
   entrada y el pago sale al reservar. En nuestro flujo primero aprueba Estela.
   No hay forma de emitir un `payment_url` sin crear la reserva.
2. **Los slots no aplican.** Una ceremonia es un día entero (11:00 a 21:00) y un
   retiro es una semana. `available-time-slots` no aporta nada: nuestras fechas
   ya están en `trips`, cargadas por la clienta.
3. **El cupo se duplicaría.** `trips.capacity` y la agenda de Encuadrado serían
   dos verdades sobre lo mismo, sin webhook para sincronizarlas.
4. **Es chileno.** `rut`, `address_comuna_region` exacta, boleta electrónica,
   `America/Santiago`, y presumiblemente cobro en CLP. Nuestros precios están en
   USD y hay viajes en Tulum. Es el mismo problema que ya apareció con el precio
   de Santiago (`docs/EXPERIENCIAS_2026.md`).

## 4. Recomendación

**No migrar el flujo de inscripción a Encuadrado.** El único pedazo que resuelve
algo que hoy no tenemos es el `payment_url` — la pared que arrastramos desde
agosto (seña del 50%, cupones, invitaciones). Y lo resuelve a medias, porque sin
webhook no cierra el círculo.

Si se quiere usar igual, la forma mínima y de bajo riesgo es **como generador de
link de pago, en un solo punto del flujo**: cuando Estela aprueba, un server
action llama a `POST /bookings` con prepago sobre un servicio de Encuadrado que
represente ese viaje, y guardamos el `payment_url` en la solicitud. El mail de
aprobación (`SolicitudAprobada`, ya cableado) deja de decir "coordiná por
WhatsApp" y lleva un botón que paga. El estado sigue marcándolo Estela a mano.

Cambios que eso implica:
- Un campo nuevo en `applications` para el `payment_url` y el
  `temporal_booking_token` (o reusar `payment_reference` para el token).
- `ENCUADRADO_API_KEY` en Vercel, **solo server-side** — la key nunca toca el
  browser.
- Un `service_uuid` de Encuadrado por viaje: columna nueva en `trips`, cargada a
  mano desde el admin.
- Registrar `cosmic-eagle.vercel.app` (y después el dominio real) como dominio
  validado en Encuadrado para poder usar `redirect_url`.

Estimación: chico, un par de horas, **una vez respondidas las preguntas de
abajo**. Pero antes de escribir una línea conviene comparar contra una pasarela
de verdad (Mercado Pago / Stripe), que sí tiene webhooks y sí cierra el estado
del pago solo. Ver `docs/CRM.md` §5 y la propuesta de pagos del 19/08.

## 5. Para preguntarle a Sofía

1. ~~**¿En qué moneda cobra hoy?**~~ **Respondido el 28/08**, ver abajo.
2. ~~**¿Le cobra a gente de fuera de Chile?**~~ **Sí**, ver abajo.
3. **¿Los viajes ya están cargados como "servicios" en Encuadrado, o usa la
   agenda para otra cosa** (sesiones individuales, terapia)? De ahí sale si hay
   un `service_uuid` por viaje o si habría que crearlos.
4. **¿Le sirve cobrar la seña del 50% ahí?** Encuadrado hace prepago del monto
   del servicio; si el 50% se modela como un servicio aparte, es un servicio más
   que mantener.
5. **¿Emite boleta electrónica por estas ceremonias?** Si sí, el formulario
   nuestro tendría que pedir RUT y comuna+región chilena exacta, que hoy no pide
   y a un extranjero no le aplica.
6. **¿Está dispuesta a seguir confirmando el pago a mano?** Sin webhook no hay
   alternativa, y conviene que lo sepa antes y no después.

## 6. Lo que contestó Sofía (28/08/2026)

Mandó los datos de cobro bajo el título "APPI ENCUADRADO", como respuesta a esta
consulta. Detalle completo en **`docs/PAGOS.md`**; los números están fuera del
repo, en `~/Escritorio/account/cosmic-eagle-cobros.txt`.

Resumen: cobra por **dos rieles según procedencia** — transferencia a un IBAN de
Santander España para US + Europa, y transferencia a una cuenta vista de Mercado
Pago para Chile.

**Eso no cambia la recomendación de §4: la debilita.**

- **Ninguno de los dos es una pasarela.** Los dos son transferencia bancaria. No
  hay checkout, ni link de pago, ni webhook. La confirmación manual de Estela no
  es un provisorio: es el mecanismo.
- **El riel internacional no pasa por Encuadrado.** Un IBAN español no lo emite
  Encuadrado, que es una plataforma chilena. O sea que el `payment_url` —lo
  único que la API nos aportaba— **como mucho cubre a los viajeros chilenos**, y
  ni siquiera está confirmado que Encuadrado esté enganchado a esa cuenta de
  Mercado Pago.
- Queda la ambigüedad del punto 4 de `docs/PAGOS.md` §4: si estos dos rieles son
  lo que Encuadrado cobra por detrás, o si son un canal aparte y Encuadrado le
  sirve sólo para agendar. **Es la pregunta que hay que hacer antes de escribir
  una línea de integración.**

Sigue sin responder de esta lista: los puntos 3, 4, 5 y 6.

## 7. Corrección del 01/09: Encuadrado sí cobra tarjeta y desde el exterior

Sofía le dijo a Ignacio que **quiere conectar la API porque Encuadrado acepta
tarjeta de crédito y pagos desde el exterior**, aunque cobren comisión.

Eso **contradice el §6 de este documento**, que daba por hecho que el riel
internacional no pasaba por Encuadrado y que su `payment_url` "como mucho cubre
a los viajeros chilenos". Corregido: si cobra tarjeta internacional, el
`payment_url` es el único checkout real que hay a mano y la integración del §4
pasa de "no vale la pena" a **recomendada**, en la forma mínima que ya está
descrita ahí (generador de link de pago en un solo punto del flujo).

Dos cosas que **no** se caen con esta corrección:

1. **El modelo de datos sigue siendo chileno.** Si el servicio emite boleta
   electrónica, `POST /bookings` exige `rut` y `address_comuna_region`. Un
   viajero de Tulum no tiene ninguno de los dos, o sea que la API podría
   rechazar justo el caso internacional que se quiere habilitar. Es la pregunta
   5 de §5 y ahora es **bloqueante**.
2. **Sigue sin haber webhook.** Lo que cambió es que ya no importa: Sofía
   confirma el pago a mano mirando el comprobante, y eso es lo que se construyó
   el 01/09 (`docs/PAGOS.md` §6).

El plan de la integración y la lista completa de lo que hace falta para
arrancarla están en `~/Escritorio/cosmic-eagle-cobros-requerimientos.txt`.
