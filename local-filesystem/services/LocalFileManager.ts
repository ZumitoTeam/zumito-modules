import { promises as fs } from 'fs';
import path from 'path';
import { FileManager, type AssetInfo } from '@zumito-team/file-manager';
import { ServiceContainer, ZumitoFramework } from 'zumito-framework';

export interface LocalFileManagerConfig {
    basePath: string;
    publicUrlBase?: string;
}

export class LocalFileManager extends FileManager {
    private basePath: string;
    private publicUrlBase: string | null;

    constructor(
        config: LocalFileManagerConfig,
        private framework: ZumitoFramework = ServiceContainer.getService(ZumitoFramework),
    ) {
        super();
        this.basePath = path.resolve(config.basePath);
        this.publicUrlBase = config.publicUrlBase || null;
    }

    async get(key: string): Promise<Buffer | null> {
        try {
            const filePath = this.resolvePath(key);
            return await fs.readFile(filePath);
        } catch (error: any) {
            if (error.code === 'ENOENT') return null;
            throw error;
        }
    }

    async put(key: string, data: Buffer, contentType?: string): Promise<string> {
        const filePath = this.resolvePath(key);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, data);
        return this.getUrl(key);
    }

    async delete(key: string): Promise<void> {
        try {
            const filePath = this.resolvePath(key);
            await fs.unlink(filePath);
        } catch (error: any) {
            if (error.code === 'ENOENT') return;
            throw error;
        }
    }

    async list(prefix?: string): Promise<AssetInfo[]> {
        const results: AssetInfo[] = [];
        const searchPath = prefix ? this.resolvePath(prefix) : this.basePath;

        try {
            await this.walkDir(searchPath, results);
        } catch (error: any) {
            if (error.code === 'ENOENT') return [];
            throw error;
        }

        return results;
    }

    async getUrl(key: string): Promise<string> {
        if (this.publicUrlBase) {
            return `${this.publicUrlBase.replace(/\/$/, '')}/${key}`;
        }
        return `file://${this.resolvePath(key)}`;
    }

    async exists(key: string): Promise<boolean> {
        try {
            const filePath = this.resolvePath(key);
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    private resolvePath(key: string): string {
        const safeKey = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
        return path.join(this.basePath, safeKey);
    }

    private async walkDir(dir: string, results: AssetInfo[]): Promise<void> {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                await this.walkDir(fullPath, results);
            } else {
                const stat = await fs.stat(fullPath);
                const key = path.relative(this.basePath, fullPath);
                results.push({
                    key,
                    size: stat.size,
                    lastModified: stat.mtime,
                });
            }
        }
    }
}
