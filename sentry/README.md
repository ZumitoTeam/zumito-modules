# @zumito-team/sentry

Integración de [Sentry](https://sentry.io) para reporte centralizado de todos los errores del framework Zumito.

Captura automáticamente errores de comandos (prefix/slash), rutas API, carga de módulos y cualquier otro error que pase por el `ErrorHandler` del framework.

## Instalación

```bash
npm install @zumito-team/sentry
```

## Uso

### Como módulo de Zumito

```ts
// zumito.config.ts
import { SentryModule } from '@zumito-team/sentry';

export const config = {
    bundles: [
        {
            path: 'node_modules/@zumito-team/sentry',
            options: {
                dsn: 'https://<key>@sentry.io/<project>',
                environment: 'production',
                release: '1.0.0',
                sampleRate: 1.0,
                tracesSampleRate: 0.2,
            },
        },
    ],
};
```

### Configuración directa

```ts
import { SentryModule, SentryService, ServiceContainer } from '@zumito-team/sentry';

new SentryModule({
    dsn: 'https://<key>@sentry.io/<project>',
    environment: 'production',
});

const sentry = ServiceContainer.getService(SentryService);
```

### Envío manual de errores

```ts
import * as Sentry from '@sentry/node';

Sentry.captureException(new Error('Custom error'));
Sentry.captureMessage('Something happened', 'warning');
```

## Contexto capturado automáticamente

El módulo enriquece cada error con:

| Contexto | Datos |
|---|---|
| **Tags** | `errorType`, `command`, `source` (slash/prefix), `guildId`, `channelId`, `endpoint`, `method`, `module`, `routePath` |
| **User** | ID y username del usuario de Discord que ejecutó el comando |
| **Extra** | Nombre y tipo del comando, ID de interacción/mensaje, contenido del mensaje (primeros 200 chars) |
| **API errors** | Endpoint y método HTTP |
| **Module errors** | Nombre del módulo que falló al cargar |

## Configuración

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `dsn` | `string` | sí | DSN del proyecto en Sentry |
| `environment` | `string` | no | Entorno (default: `NODE_ENV` o `development`) |
| `release` | `string` | no | Versión del release |
| `sampleRate` | `number` | no | Tasa de muestreo de errores (0-1, default: 1.0) |
| `tracesSampleRate` | `number` | no | Tasa de muestreo de trazas (0-1) |
| `debug` | `boolean` | no | Modo debug de Sentry (default: false) |

## Cambios requeridos en zumito-framework

Este módulo necesita que `CommandErrorOptions` incluya `interaction`/`message` para extraer el contexto completo (guild, usuario, canal). Asegúrate de usar una versión del framework que incluya estos campos.
