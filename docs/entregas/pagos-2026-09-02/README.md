# Cómo cobra hoy Encuadrado — capturas del 02/09/2026

Las sacó Ignacio del link que mandó Sofía:

    https://encuadrado.com/s/estela-gala/viaje-cosmico-buenos-aires-septiembre-2026?from=app

Es un link **público**, no hace falta cuenta para verlo. Análisis completo en
`docs/ENCUADRADO.md` §8.

| Captura | Paso |
|---|---|
| `1-datos.png` | Paso 1 "Datos": nombre, correo, celular y el tilde de términos |
| `2-pago-usd.png` | Paso 2 con la moneda en **USD**: Stripe, tarjeta Visa/Mastercard/Amex/Discover |
| `3-pago-clp.png` | Paso 2 con la moneda en **CLP**: Apple Pay, transferencia bancaria o tarjeta |

Lo que hay que mirar en `1-datos.png`: **no pide RUT ni comuna**. Eso desbloquea
la pregunta 5 de `docs/ENCUADRADO.md` §5, que era la única bloqueante.
