# @zumito-team/s3-assets

Implementación de `FileManager` para almacenamiento compatible con el protocolo S3. Funciona con **AWS S3**, **DigitalOcean Spaces**, **MinIO**, **Cloudflare R2** y cualquier servicio que hable S3.

## Instalación

```bash
npm install @zumito-team/s3-assets
```

## Uso

### Como módulo de Zumito

```ts
// zumito.config.ts
import { S3AssetsModule } from '@zumito-team/s3-assets';

export const config = {
    bundles: [
        {
            path: 'node_modules/@zumito-team/s3-assets',
            options: {
                bucket: 'my-bucket',
                region: 'nyc3',
                endpoint: 'https://nyc3.digitaloceanspaces.com',
                accessKeyId: 'DO00...',
                secretAccessKey: '...',
                publicUrlBase: 'https://my-bucket.nyc3.cdn.digitaloceanspaces.com',
            }
        }
    ]
};
```

### Con configuración directa

```ts
import { S3AssetsModule, ServiceContainer, S3FileManager } from '@zumito-team/s3-assets';

// DigitalOcean Spaces
new S3AssetsModule({
    bucket: 'my-bucket',
    region: 'nyc3',
    endpoint: 'https://nyc3.digitaloceanspaces.com',
    accessKeyId: 'DO00...',
    secretAccessKey: '...',
    publicUrlBase: 'https://my-bucket.nyc3.cdn.digitaloceanspaces.com',
});

const fm = ServiceContainer.getService(S3FileManager);
const url = await fm.put('images/avatar.png', buffer, 'image/png');
```

### Con MinIO

```ts
new S3AssetsModule({
    bucket: 'assets',
    endpoint: 'http://localhost:9000',
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
    forcePathStyle: true,
    publicUrlBase: 'http://localhost:9000/assets',
});
```

### Con cliente S3 personalizado (máxima flexibilidad)

```ts
import { S3Client } from '@aws-sdk/client-s3';

const client = new S3Client({
    region: 'auto',
    endpoint: 'https://<account-id>.r2.cloudflarestorage.com',
    credentials: {
        accessKeyId: '...',
        secretAccessKey: '...',
    },
});

new S3AssetsModule(client);

const fm = ServiceContainer.getService(S3FileManager);
fm.setBucket('my-bucket');
fm.setPublicUrlBase('https://cdn.example.com');
```

### Operaciones CRUD

```ts
const fm = ServiceContainer.getService(S3FileManager);

// Subir
const url = await fm.put('uploads/doc.pdf', pdfBuffer, 'application/pdf');

// Obtener
const data = await fm.get('uploads/doc.pdf');

// Verificar existencia
const ok = await fm.exists('uploads/doc.pdf');

// Listar con prefijo
const files = await fm.list('uploads/');

// Eliminar
await fm.delete('uploads/doc.pdf');
```

## Configuración

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `bucket` | `string` | sí | Nombre del bucket/espacio |
| `region` | `string` | no | Región (default: `us-east-1`) |
| `endpoint` | `string` | no | URL del endpoint S3 (obligatorio para MinIO/Spaces/R2) |
| `accessKeyId` | `string` | no | Access key |
| `secretAccessKey` | `string` | no | Secret key |
| `publicUrlBase` | `string` | no | Base para construir URLs públicas (ej: CDN) |
| `forcePathStyle` | `boolean` | no | Forzar path-style (por defecto se activa si hay endpoint) |
