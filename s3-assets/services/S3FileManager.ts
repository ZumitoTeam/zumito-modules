import {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { FileManager, type AssetInfo } from '@zumito-team/file-manager';
import { ServiceContainer, ZumitoFramework } from 'zumito-framework';

export interface S3FileManagerConfig {
    bucket: string;
    region?: string;
    endpoint?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    publicUrlBase?: string;
    forcePathStyle?: boolean;
}

export class S3FileManager extends FileManager {
    private client: S3Client;
    private bucket: string;
    private publicUrlBase: string | null;

    constructor(
        clientOrConfig: S3Client | S3FileManagerConfig,
        private framework: ZumitoFramework = ServiceContainer.getService(ZumitoFramework),
    ) {
        super();

        if (clientOrConfig instanceof S3Client) {
            this.client = clientOrConfig;
            this.bucket = '';
            this.publicUrlBase = null;
        } else {
            const config = clientOrConfig;
            this.bucket = config.bucket;

            this.client = new S3Client({
                region: config.region || 'us-east-1',
                endpoint: config.endpoint,
                credentials: config.accessKeyId
                    ? {
                          accessKeyId: config.accessKeyId,
                          secretAccessKey: config.secretAccessKey || '',
                      }
                    : undefined,
                forcePathStyle: config.forcePathStyle ?? !!config.endpoint,
            });

            this.publicUrlBase = config.publicUrlBase || null;
        }
    }

    setBucket(bucket: string): void {
        this.bucket = bucket;
    }

    setPublicUrlBase(url: string): void {
        this.publicUrlBase = url;
    }

    async get(key: string): Promise<Buffer | null> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });

            const response = await this.client.send(command);
            if (!response.Body) return null;

            return Buffer.from(await response.Body.transformToByteArray());
        } catch (error: any) {
            if (error.name === 'NoSuchKey') return null;
            throw error;
        }
    }

    async put(key: string, data: Buffer, contentType?: string): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: data,
            ContentType: contentType,
        });

        await this.client.send(command);
        return this.getUrl(key);
    }

    async delete(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        await this.client.send(command);
    }

    async list(prefix?: string): Promise<AssetInfo[]> {
        const command = new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: prefix,
        });

        const response = await this.client.send(command);
        if (!response.Contents) return [];

        return response.Contents.map((item) => ({
            key: item.Key!,
            size: item.Size ?? 0,
            lastModified: item.LastModified ?? new Date(),
            contentType: undefined,
        }));
    }

    async getUrl(key: string): Promise<string> {
        if (this.publicUrlBase) {
            return `${this.publicUrlBase.replace(/\/$/, '')}/${key}`;
        }

        const region = await this.client.config.region();
        return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
    }

    async exists(key: string): Promise<boolean> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });

            await this.client.send(command);
            return true;
        } catch (error: any) {
            if (error.name === 'NotFound') return false;
            throw error;
        }
    }
}
