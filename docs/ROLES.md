# Roles y flujos

## Roles

### Administrador
- Gestiona viajes (crear, editar, cerrar cupos)
- Revisa solicitudes de salud (aprueba / rechaza)
- Ve todos los datos sensibles (formularios de salud)
- Comunica con viajeros via panel
- Accede al consentimiento informado de cualquier usuario

### Solicitante (pre-aprobacion)
- Se registra con email/password
- Completa formulario de salud (primerizo o recurrente segun historial)
- Espera revision del admin
- No tiene acceso al panel de usuario
- Recibe notificacion de aprobacion/rechazo

### Viajero (aprobado)
- Tiene al menos una solicitud en estado `approved`
- Accede al panel de usuario
- Ve sus viajes aprobados y proximos
- Completa consentimiento informado (previo al viaje)
- Recibe comunicaciones del admin

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
