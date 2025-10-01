export interface StickmanfightModuleConfig {
    embedColor?: number;
}

let currentConfig: StickmanfightModuleConfig = {};

export function setStickmanfightConfig(config?: StickmanfightModuleConfig): void {
    currentConfig = config ?? {};
}

export function getStickmanfightEmbedColor(): number {
    return currentConfig.embedColor ?? 0x5865f2;
}
