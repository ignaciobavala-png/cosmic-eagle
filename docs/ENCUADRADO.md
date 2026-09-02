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

## 8. Corrección del 02/09: no es una reserva, es un LINK DE PAGO

Sofía mandó el link que usa hoy y Ignacio sacó las tres capturas del recorrido
(`docs/entregas/pagos-2026-09-02/`):

    https://encuadrado.com/s/estela-gala/viaje-cosmico-buenos-aires-septiembre-2026?from=app

**Todo este documento estaba analizando el producto equivocado.** Los §1 a §4
describen la API de *agenda* (`available-time-slots` + `bookings`), y de ahí
salían los cuatro choques del §3: el orden incompatible, los slots que no
aplican, el cupo duplicado y el modelo chileno. Lo que Estela usa no es eso: es
un **link de pago suelto**, uno por viaje, sin agenda ni horarios. La página
tiene un botón "Pagar" y nada más.

El recorrido real, en dos pasos:

1. **Datos**: nombre y apellidos, correo, celular con código de país, y el tilde
   de términos de Encuadrado. **No pide RUT. No pide comuna ni región.**
2. **Pago**, con selector de moneda arriba:
   - **USD** → Stripe, tarjeta de crédito o débito (Visa, Mastercard, Amex,
     Discover). Es el checkout internacional.
   - **CLP** → Apple Pay, transferencia bancaria o tarjeta.

El precio se muestra en las dos monedas a la vez (`$ 350.000 CLP ($ 350.00 USD)`).

### Qué se cae y qué queda en pie

- **Se cae la pregunta 5 de §5, que era la bloqueante.** Era "¿emite boleta
  electrónica?, porque entonces `POST /bookings` exige RUT y comuna y se rompe
  justo el caso internacional". El formulario real no los pide: **el viajero de
  Tulum puede pagar.**
- **Se cae la necesidad de la API entera.** No hace falta `service_uuid`, ni la
  `ENCUADRADO_API_KEY`, ni registrar el dominio para el `redirect_url`, ni el
  `POST /bookings` del §4. El link ya existe y lo genera Estela desde su panel.
  La integración pasa de "un par de horas de código server-side con una key
  secreta" a **pegar una URL**.
- **Sigue en pie que no hay webhook**, y sigue sin importar: Estela confirma
  mirando el comprobante (§7).
- **Sigue en pie el cupo duplicado**, y ahora es lo único delicado: el link es
  público y no sabe de aprobaciones. Alguien con la URL puede pagar sin haber
  sido aprobado. No es plata perdida —se le devuelve o se le corre a otra
  fecha— pero conviene que Estela lo sepa, y es un argumento para no publicar
  el link en la página del viaje sino sólo en la pantalla del aprobado, que es
  donde ya vive el bloque de pago.

### Lo que falta para cablearlo

**El link es por viaje**, y `payment_methods.link_url` es global: si se carga
ahí, todos los viajes cobrarían el precio del viaje de Buenos Aires. Hace falta
una columna **`trips.payment_url`**, cargada desde el form del admin, y que el
bloque "Cómo pagar" de `/viajes/[id]/solicitar` dibuje ese botón arriba de los
rieles de transferencia. Es una migración chica y un campo de texto.

### Estado de los rieles (cargados el 02/09)

| Orden | Riel | Moneda | Activo |
|---|---|---|---|
| 1 | Transferencia bancaria en euros (Santander España) | EUR | sí |
| 2 | Transferencia a Mercado Pago (Chile) | CLP | sí |
| 3 | Pago con tarjeta (Encuadrado) | USD | **no**, espera `trips.payment_url` |

Los números salen de `~/Escritorio/account/cosmic-eagle-cobros.txt`, **fuera del
repo**. Ignacio los repitió el 02/09 y coinciden exactos con los que Sofía había
mandado el 28/08.

## 9. ¿Se puede crear el viaje en Encuadrado desde nuestro panel? NO

Sofía preguntó el 02/09 si, en vez de crear el servicio en Encuadrado y pegar el
link acá, se puede crear todo desde nuestro panel por API. Verificado contra el
spec en vivo el mismo día (sigue idéntico al del 29/08):

```
GET  /services/{service_uuid}/available-time-slots
POST /services/{service_uuid}/bookings
```

**No hay endpoint para crear un servicio, ni para listarlos, ni para editarlos.**
Los dos endpoints reciben un `service_uuid` que ya tiene que existir, y
`BookingData` —sus 25 campos— **no tiene ninguno de monto**: el precio vive en el
servicio y el servicio sólo se crea a mano en su panel. No es difícil: no existe
la puerta.

Tres caminos, en el orden en que se decidieron:

1. **Pedírselo a Encuadrado.** El propio spec invita
   (`soporte@encuadrado.com`) y la API se llama "para partners". Cuesta un mail y
   no se puede planificar contra la respuesta. **Sin hacer.**
2. **Bajar la fricción**: un campo "link de pago" en el viaje, que ella pega una
   vez por viaje (son ~7 al año). **HECHO el 02/09**, ver `docs/PAGOS.md` §10.
3. **Ir directo a Stripe.** Sale de la captura `2-pago-usd.png`: cuando se paga
   en dólares, Encuadrado **dice literalmente "Stripe"**. No es una pasarela
   propia, es un revendedor con comisión encima. Yendo directo, Sofía obtiene lo
   que pidió —el checkout se genera solo desde nuestro panel, con el precio que
   cargó, sin tocar otra plataforma— más **webhooks**, o sea que el pago se
   confirmaría solo y Estela dejaría de revisar comprobantes a mano.
   **Descartado por ahora** (Ignacio, 02/09: "hagamos la 2 ahora nada más").
   Si se retoma, lo que hay que averiguar primero es si Estela puede darse de
   alta en Stripe Chile con su entidad, y qué pierde de Encuadrado —agenda y
   boleta— que hoy usa para su otro trabajo.

El campo `trips.payment_url` no se tira si algún día se va a Stripe: guarda una
URL de checkout, sea de quien sea.
