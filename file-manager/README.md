# @zumito-team/file-manager

Abstracción modular para gestores de archivos (FileManagers) en el ecosistema Zumito.

Define la clase abstracta `FileManager` que establece el contrato que cualquier implementación (S3, filesystem local, FTP, etc.) debe cumplir.

## API

### `FileManager` (abstracta)

```ts
abstract class FileManager {
    abstract get(key: string): Promise<Buffer | null>;
    abstract put(key: string, data: Buffer, contentType?: string): Promise<string>;
    abstract delete(key: string): Promise<void>;
    abstract list(prefix?: string): Promise<AssetInfo[]>;
    abstract getUrl(key: string): Promise<string>;
    abstract exists(key: string): Promise<boolean>;
}
```

### `AssetInfo`

```ts
interface AssetInfo {
    key: string;
    size: number;
    lastModified: Date;
    contentType?: string;
}
```

## Implementaciones disponibles

| Módulo | Descripción |
|---|---|
| `@zumito-team/s3-assets` | S3, DigitalOcean Spaces, MinIO, Cloudflare R2 |
| `@zumito-team/local-filesystem` | Sistema de archivos local |

## Crear una implementación propia

```ts
import { FileManager, type AssetInfo } from '@zumito-team/file-manager';

export class MyFileManager extends FileManager {
    async get(key: string): Promise<Buffer | null> { /* ... */ }
    async put(key: string, data: Buffer, contentType?: string): Promise<string> { /* ... */ }
    async delete(key: string): Promise<void> { /* ... */ }
    async list(prefix?: string): Promise<AssetInfo[]> { /* ... */ }
    async getUrl(key: string): Promise<string> { /* ... */ }
    async exists(key: string): Promise<boolean> { /* ... */ }
}
```
