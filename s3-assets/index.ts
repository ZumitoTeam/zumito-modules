import { S3Client } from '@aws-sdk/client-s3';
import { Module, ServiceContainer } from 'zumito-framework';
import { S3FileManager, type S3FileManagerConfig } from './services/S3FileManager.js';

export { S3FileManager, type S3FileManagerConfig } from './services/S3FileManager.js';
export { FileManager, type AssetInfo } from '@zumito-team/file-manager';

export class S3AssetsModule extends Module {
    constructor(clientOrConfig?: S3Client | S3FileManagerConfig) {
        super(import.meta.url);

        if (clientOrConfig) {
            ServiceContainer.addService(S3FileManager, [], true, new S3FileManager(clientOrConfig));
        } else {
            ServiceContainer.addService(S3FileManager, [], true);
        }
    }
}
