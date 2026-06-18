export interface AssetInfo {
    key: string;
    size: number;
    lastModified: Date;
    contentType?: string;
}

export abstract class FileManager {
    abstract get(key: string): Promise<Buffer | null>;

    abstract put(key: string, data: Buffer, contentType?: string): Promise<string>;

    abstract delete(key: string): Promise<void>;

    abstract list(prefix?: string): Promise<AssetInfo[]>;

    abstract getUrl(key: string): Promise<string>;

    abstract exists(key: string): Promise<boolean>;
}
