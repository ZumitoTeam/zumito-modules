import { LicenseConfig } from "../definitions/LicenseConfig.js";

const DEFAULT_API_URL = "https://api.builtbybit.com/v1/licenses";

export class LicenseVerifier {
    private config: LicenseConfig;

    constructor(config: LicenseConfig) {
        if (!config.licenseKey) {
            throw new Error("[BuiltByBit] licenseKey is required");
        }
        this.config = {
            apiUrl: DEFAULT_API_URL,
            retryAttempts: 0,
            retryDelay: 5000,
            exitOnInvalid: true,
            exitCode: 1,
            ...config,
        };
    }

    async verify(): Promise<boolean> {
        const attempts = (this.config.retryAttempts ?? 0) + 1;
        let lastError: Error | undefined;

        for (let i = 0; i < attempts; i++) {
            try {
                const valid = await this.performRequest();
                if (valid) {
                    if (this.config.onValid) {
                        await this.config.onValid();
                    }
                    return true;
                }

                const reason = "License validation returned invalid";
                if (this.config.onInvalid) {
                    await this.config.onInvalid(reason);
                }

                if (this.config.exitOnInvalid) {
                    this.exit(reason);
                }
                return false;
            } catch (err: any) {
                lastError = err;
                if (i < attempts - 1) {
                    console.warn(
                        `[BuiltByBit] Verification attempt ${i + 1} failed, retrying in ${this.config.retryDelay}ms...`
                    );
                    await this.delay(this.config.retryDelay ?? 5000);
                }
            }
        }

        if (lastError) {
            console.error(`[BuiltByBit] All verification attempts failed: ${lastError.message}`);
            if (this.config.onError) {
                await this.config.onError(lastError);
            }
            if (this.config.exitOnInvalid) {
                this.exit(lastError.message);
            }
        }
        return false;
    }

    private async performRequest(): Promise<boolean> {
        const headers: Record<string, string> = {
            "Accept": "application/json",
            "User-Agent": "ZumitoFramework-BuiltByBit/1.0",
            ...this.config.requestHeaders,
        };

        const url = `${this.config.apiUrl}/${encodeURIComponent(this.config.licenseKey)}`;

        const response = await fetch(url, {
            method: "GET",
            headers,
        });

        const body = await response.json().catch(() => null);

        if (this.config.validateResponse) {
            return await this.config.validateResponse(body, response.status);
        }

        return this.defaultValidate(body, response.status);
    }

    private defaultValidate(body: any, status: number): boolean {
        if (status !== 200) return false;

        if (body === null || body === undefined) return false;

        if (typeof body.valid === "boolean") return body.valid;
        if (typeof body.success === "boolean") return body.success;
        if (typeof body.status === "string") return body.status === "active";

        return true;
    }

    private exit(reason: string) {
        console.error(`[BuiltByBit] Exiting: ${reason}`);
        process.exit(this.config.exitCode ?? 1);
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
