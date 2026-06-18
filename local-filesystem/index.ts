import { Module, ServiceContainer } from 'zumito-framework';
import { LocalFileManager, type LocalFileManagerConfig } from './services/LocalFileManager.js';

export { LocalFileManager, type LocalFileManagerConfig } from './services/LocalFileManager.js';
export { FileManager, type AssetInfo } from '@zumito-team/file-manager';

export class LocalFilesystemModule extends Module {
    constructor(config?: LocalFileManagerConfig) {
        super(import.meta.url);

        if (config) {
            ServiceContainer.addService(LocalFileManager, [], true, new LocalFileManager(config));
        } else {
            ServiceContainer.addService(LocalFileManager, [], true);
        }
    }
}
