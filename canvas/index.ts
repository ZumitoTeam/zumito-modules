import { Module } from 'zumito-framework';

export { CanvasUtils, type CanvasConfig } from './utils/CanvasUtils';

export class CanvasModule extends Module {
    constructor() {
        super(import.meta.url);
        console.log('CanvasModule');
    }
}