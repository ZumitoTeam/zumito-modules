import { Module } from 'zumito-framework';
import { setStickmanfightConfig, StickmanfightModuleConfig } from './config/StickmanfightConfig';

export class StickmanfightModule extends Module {
    constructor(config?: StickmanfightModuleConfig) {
        super(import.meta.url);
        setStickmanfightConfig(config);
    }
}

export type { StickmanfightModuleConfig } from './config/StickmanfightConfig';
