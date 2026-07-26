# Roles y flujos

## Roles

**Decidido (2026-07-25): un solo rango de usuario por ahora.** No hay niveles de viajero (ej. "frecuente", "iniciado") — eso queda para una fase futura si se pide.

### Administrador
- Gestiona viajes (crear, editar, cerrar cupos)
- Revisa solicitudes de salud (aprueba / rechaza)
- Ve todos los datos sensibles (formularios de salud)
- Ve el historial completo de solicitudes de cada usuario (no solo la ultima) — una persona puede tener solicitudes rechazadas en un viaje y aprobadas en otro
- Puede marcar solicitudes/aprobaciones como expiradas manualmente
- Comunica con viajeros via panel (unidireccional admin → usuario en esta fase)
- Accede al consentimiento informado de cualquier usuario

### Solicitante / Visitante (sin aprobacion)
- Se registra con email/password
- Completa formulario de salud (primerizo o recurrente segun historial) **por cada viaje al que aplica**
- Espera revision del admin
- No tiene acceso al panel de usuario
- Recibe notificacion de aprobacion/rechazo
- Si fue rechazado para un viaje, puede volver a aplicar a otro viaje mas adelante (no queda bloqueado de por vida)

### Viajero (aprobado)
- Tiene al menos una solicitud vigente en estado `approved` (no expirada)
- Accede al panel de usuario
- Ve sus viajes aprobados y proximos
- Completa consentimiento informado (previo al viaje)
- Recibe comunicaciones del admin (solo lectura en esta fase — sin responder ni chat entre viajeros)

## Fuera de alcance (fase actual)

- Comunicacion entre usuarios / comunidad
- Rangos o niveles de viajero mas alla de aprobado/no aprobado

## Flujo completo

```
Visitante → [Registro] → Solicitante
                              │
                              ▼
                    Completa formulario de salud
                    (primerizo o recurrente)
                              │
                              ▼
                    Admin revisa y aprueba/rechaza
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
              Aprobado            Rechazado
                    │              (sin acceso)
                    ▼
              Viajero accede al panel
                    │
                    ▼
              Completa consentimiento
                    │
                    ▼
              Asiste a la ceremonia
```

## Acceso a paginas por rol

| Pagina | Visitante | Solicitante | Viajero | Admin |
|---|---|---|---|---|
| Landing (/, /nosotros, /viajes, /contenidos) | ✓ | ✓ | ✓ | ✓ |
| Login / Registro | ✓ | ✓ | ✓ | ✓ |
| Formulario de salud | — | ✓ | ✓ | — |
| Panel de usuario | — | — | ✓ | — |
| Panel de admin | — | — | — | ✓ |
| Consentimiento | — | — | ✓ | — |
