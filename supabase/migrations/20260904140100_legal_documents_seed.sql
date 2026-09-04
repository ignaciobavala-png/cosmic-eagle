-- Siembra los DOS documentos legales. Va en su propia migracion, separada del
-- esquema, porque es dato y no estructura: si maniana hay que corregir una
-- coma del texto no se toca la que crea la tabla.
--
-- ─── Los dos documentos ──────────────────────────────────────────────────────
--
-- Se siembran CON texto, al reves de `faqs` y `payment_methods`, que salieron
-- vacios a proposito. La diferencia es que ahi el contenido era un dato que solo
-- tiene la clienta (sus preguntas, sus cuentas bancarias) y aca es la
-- descripcion de algo que ya sabemos: como trata el sitio la informacion que
-- pide. Una pagina de privacidad en blanco es peor que un borrador honesto.
--
-- Todo lo tecnico que se afirma en Privacidad es cierto del sitio tal como esta
-- hoy: permisos por fila en `applications` y sus hijas, el bucket `comprobantes`
-- privado con URLs firmadas a 10 minutos, y las respuestas de salud fuera de la
-- vista `my_applications`. Si eso cambia, el texto cambia.
--
-- Los datos que faltan van marcados con [ ... ] y son lo unico que la
-- organizacion tiene que completar: el responsable legal, el pais y la casilla.

insert into public.legal_documents (slug, title, body) values (
  'privacidad',
  'Privacidad y cuidado de tu información',
  $doc$Esta página explica qué información te pedimos, quién la ve y qué podés hacer con ella. Está escrita para leerse, no para cubrirnos.

## Qué te pedimos y para qué

Cuando te postulás a una Sesión o a un Viaje te pedimos información sobre tu salud en dos momentos distintos. Primero, tres preguntas breves: si atravesás una enfermedad grave, si estás o estuviste en tratamiento psiquiátrico o psicológico, y si tomás alguna medicación, incluidos suplementos y hierbas. Más adelante, una vez que tu lugar está confirmado, te pedimos un formulario más extenso.

> Nada de lo que nos cuentes cierra la puerta de entrada.

No hay ningún rechazo automático: esas respuestas sólo hacen que tu solicitud llegue marcada para que la miremos con más atención y podamos conversarlo con vos. Toda esa información existe por una sola razón: acompañarte de forma segura durante la ceremonia. No la usamos para decidir precios, no la cruzamos con nada y no la pedimos para ningún otro fin.

## Quién la ve y cómo se guarda

Esa información la ve únicamente el equipo de Cosmic Eagle que acompaña las experiencias, desde un panel privado y con su propia cuenta. No es visible para las demás personas que participan del viaje, ni para nadie que no forme parte del equipo.

El sitio está construido para que eso no dependa de la buena voluntad de nadie:

- **Permisos a nivel de cada fila.** La base de datos aplica las reglas por sí misma, de modo que una cuenta sólo alcanza sus propias solicitudes. No es una pantalla que esconde datos: es la base que no los entrega.
- **Tus respuestas de salud no vuelven a mostrarse.** Una vez enviado el formulario, ni siquiera aparecen en tu espacio personal.
- **Los comprobantes de pago viven en un espacio cerrado.** El equipo los abre con enlaces que caducan a los pocos minutos.
- **Los datos de tu tarjeta no pasan por nosotros.** El cobro con tarjeta lo procesa la plataforma de pagos; a nosotros nos llega la confirmación, no el medio de pago.

## Con quién no se comparte

Para que el sitio funcione trabajamos con proveedores que alojan la base de datos, publican la página y envían los correos. Actúan por cuenta nuestra, con la obligación de cuidar la información igual que nosotros, y no la usan para fines propios.

Fuera de eso, no compartimos tu información de salud con terceros: no la vendemos, no la cedemos, no la usamos para publicidad y no la publicamos en ningún lado, ni siquiera de forma anónima. Los testimonios y las fotos que aparecen en el sitio se publican sólo con el permiso expreso de quien los comparte, y ese permiso se puede retirar en cualquier momento.

Conservamos tus datos de salud mientras dure tu vínculo con nosotros y por el plazo que nos exija la ley. Cumplido eso, se eliminan.

## Tus derechos

Tu información es tuya. Podés pedirnos en cualquier momento una copia de todo lo que tenemos sobre vos, corregir algo que esté mal, o pedir que lo borremos: alcanza con escribirnos y te respondemos dentro de los diez días hábiles.

Si algo de lo que compartiste dejó de ser cierto o preferís que no lo guardemos más, decínoslo y lo damos de baja. Tené en cuenta que hay información que necesitamos tener el día de la ceremonia para poder acompañarte con seguridad, y sin ella puede que no podamos recibirte.

Y si en algún momento creés que no cuidamos tu información como corresponde, queremos saberlo antes que nadie: escribinos y lo resolvemos con vos.

## Cómo contactarnos

Para cualquiera de estos pedidos, escribinos a [casilla de contacto].

El responsable del tratamiento de tus datos es [nombre legal de la organización], con domicilio en [ciudad y país].
$doc$
), (
  'terminos',
  'Términos de Servicio',
  $doc$Estas son las condiciones bajo las que funciona este sitio y bajo las que se participa de nuestras experiencias. Al crear una cuenta o postularte a una experiencia, las aceptás.

## Qué es Cosmic Eagle Journey

Organizamos Sesiones Cósmicas de un día y Viajes Cósmicos de una semana: encuentros ceremoniales con medicinas ancestrales, acompañados por nuestro equipo. Este sitio es el lugar donde se publican las fechas, se piden los lugares y se sigue el estado de cada inscripción.

## Cómo funciona la inscripción

Postularte no reserva tu lugar. El recorrido tiene estos pasos, en este orden:

- **Creás tu cuenta** y completás un formulario breve con tus datos y tres preguntas de salud.
- **Nosotros revisamos tu solicitud** una por una. Puede quedar aprobada, o podemos proponerte una conversación antes de decidir. Ninguna respuesta te descarta automáticamente.
- **Con la solicitud aprobada, se abre el pago.** Podés pagar el total o, si esa experiencia lo permite, una seña para reservar el cupo.
- **Confirmado el pago, completás el formulario de salud extenso.** Recién ahí tu lugar queda tomado.

Aceptar una postulación es decisión nuestra. Podemos no aprobarla, y podemos dar de baja una inscripción ya aprobada si aparece información que hace que la experiencia no sea segura para vos o para el grupo. En ese caso te lo decimos y te devolvemos lo que hayas pagado.

## Pagos, seña y cancelaciones

El aporte de cada experiencia está publicado en su página, en dólares. Podés pagarlo con tarjeta o por transferencia; cuando pagás por transferencia, subís el comprobante desde tu espacio personal y nosotros lo confirmamos a mano. Subir un comprobante no confirma el pago por sí solo.

Si una experiencia tiene seña, el saldo se abona antes de la fecha, del modo que te indiquemos por correo. Las condiciones de cada experiencia —qué incluye, qué no, y cualquier condición particular— están publicadas en su propia página y forman parte de estos términos.

La política de cancelación y reembolso es la publicada en la página de cada experiencia. Si cancelás, escribinos lo antes posible: cuanto antes lo sepamos, más posibilidades hay de que alguien más pueda ocupar tu lugar.

## Sobre la naturaleza de las experiencias

Esto es importante y conviene leerlo dos veces.

> Nuestras experiencias no son un tratamiento médico ni psicológico, y no reemplazan a ninguno.

No diagnosticamos, no prescribimos y no interrumpimos tratamientos. Si estás bajo tratamiento médico o psiquiátrico, seguí con tu profesional y contale que vas a participar: por eso te preguntamos por tu medicación. La información que compartís en los formularios es la base sobre la que decidimos si podemos acompañarte con seguridad, así que responder con precisión es parte de tu cuidado. Participar es una decisión libre y adulta, y podés interrumpir en cualquier momento.

## Tu cuenta

Sos responsable de mantener tu contraseña a resguardo y de que la información de tu cuenta sea verdadera y esté al día. Si detectás que alguien accedió a tu cuenta, avisanos enseguida. Podés pedir que la demos de baja cuando quieras.

## Los contenidos del sitio

Los textos, las imágenes y el material de la biblioteca son de Cosmic Eagle Journey o de quienes nos autorizaron a publicarlos. Podés leerlos y compartir el enlace; no podés reproducirlos ni usarlos con fines comerciales sin nuestro permiso. Los testimonios pertenecen a quienes los escribieron y se publican con su permiso.

## Cambios en estos términos

Podemos actualizar esta página. Cuando el cambio sea importante, te lo avisamos por correo. La fecha de la última actualización está al pie.

## Contacto y jurisdicción

Ante cualquier duda sobre estos términos, escribinos a [casilla de contacto].

El titular del servicio es [nombre legal de la organización], con domicilio en [ciudad y país]. Estos términos se rigen por las leyes de [país] y cualquier controversia se somete a sus tribunales.
$doc$
);
