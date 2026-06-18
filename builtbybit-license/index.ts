import { Module } from "zumito-framework";
import { LicenseConfig } from "./definitions/LicenseConfig.js";
import { LicenseVerifier } from "./services/LicenseVerifier.js";

export interface BuiltByBitLicenseModuleOptions {
    commandWhitelist?: string[];
    commandBlacklist?: string[];
    commandRenames?: { [key: string]: string };

    /**
     * BuiltByBit license configuration.
     */
    license?: LicenseConfig;

    /**
     * Shorthand: pass a license key string directly.
     */
    licenseKey?: string;
}

export class BuiltByBitLicenseModule extends Module {

    private verifier: LicenseVerifier | null = null;
    private intervalHandle: ReturnType<typeof setInterval> | null = null;

    constructor(path: string, options?: BuiltByBitLicenseModuleOptions) {
        super(path, options);

        const config = this.resolveConfig(options);
        if (config) {
            this.verifier = new LicenseVerifier(config);
        }
    }

    async onAllReady() {
        if (!this.verifier) {
            console.warn("[BuiltByBit] No license configuration provided, skipping verification.");
            return;
        }

        const valid = await this.verifier.verify();

        if (valid) {
            const config = this.resolveConfig(this.parameters as BuiltByBitLicenseModuleOptions);
            if (config?.checkInterval && config.checkInterval > 0) {
                this.startPeriodicCheck(config.checkInterval);
            }
        }
    }

    private resolveConfig(options?: BuiltByBitLicenseModuleOptions): LicenseConfig | null {
        if (!options) return null;

        if (options.license) {
            return options.license;
        }

        if (options.licenseKey) {
            return { licenseKey: options.licenseKey };
        }

        return null;
    }

    private startPeriodicCheck(intervalMs: number) {
        this.intervalHandle = setInterval(async () => {
            console.log("[BuiltByBit] Running periodic license check...");
            const valid = await this.verifier!.verify();
            if (!valid) {
                this.stopPeriodicCheck();
            }
        }, intervalMs);
    }

    private stopPeriodicCheck() {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
    }
}

export { LicenseConfig } from "./definitions/LicenseConfig.js";
export { LicenseVerifier } from "./services/LicenseVerifier.js";
