import { Module } from 'zumito-framework';

export { FileManager, type AssetInfo } from './definitions/FileManager.js';

export class FileManagerModule extends Module {
    constructor() {
        super(import.meta.url);
    }
}
