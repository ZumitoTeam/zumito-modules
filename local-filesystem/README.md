# @zumito-team/local-filesystem

Implementación de `FileManager` para el sistema de archivos local.

## Instalación

```bash
npm install @zumito-team/local-filesystem
```

## Uso

```ts
import { LocalFilesystemModule, ServiceContainer, LocalFileManager } from '@zumito-team/local-filesystem';

new LocalFilesystemModule({
    basePath: './data/uploads',
    publicUrlBase: 'https://example.com/uploads',
});

const fm = ServiceContainer.getService(LocalFileManager);
const url = await fm.put('images/banner.png', buffer, 'image/png');
```

### Como módulo de Zumito

```ts
// zumito.config.ts
import { LocalFilesystemModule } from '@zumito-team/local-filesystem';

export const config = {
    bundles: [
        {
            path: 'node_modules/@zumito-team/local-filesystem',
        }
    ]
};
```

### Operaciones

```ts
const fm = ServiceContainer.getService(LocalFileManager);

await fm.put('data/config.json', Buffer.from(JSON.stringify({ key: 'value' })), 'application/json');

const data = await fm.get('data/config.json');

const files = await fm.list('data/');

await fm.delete('data/config.json');
```

## Configuración

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `basePath` | `string` | sí | Directorio raíz donde se almacenan los archivos |
| `publicUrlBase` | `string` | no | Base para construir URLs públicas |

## Seguridad

El `LocalFileManager` normaliza las rutas y bloquea accesos con `../` fuera del `basePath` configurado.
