export interface LicenseConfig {
    /**
     * BuiltByBit license key to verify (required).
     */
    licenseKey: string;

    /**
     * API endpoint URL. Defaults to BuiltByBit public license API.
     */
    apiUrl?: string;

    /**
     * The resource/product ID on BuiltByBit.
     * If provided, the request will include it for validation.
     */
    productId?: string;

    /**
     * Custom HTTP headers to include in the verification request.
     */
    requestHeaders?: Record<string, string>;

    /**
     * Number of retry attempts on network failure. Default: 0.
     */
    retryAttempts?: number;

    /**
     * Delay in ms between retries. Default: 5000.
     */
    retryDelay?: number;

    /**
     * Whether to exit the process if the license is invalid. Default: true.
     */
    exitOnInvalid?: boolean;

    /**
     * Exit code to use when killing the process. Default: 1.
     */
    exitCode?: number;

    /**
     * Custom function to validate the API response.
     * Receives the parsed JSON response body and must return true if the license is valid.
     * If not provided, a default validator checks for status 200 and a truthy `valid`/`success` field.
     */
    validateResponse?: (body: any, status: number) => boolean | Promise<boolean>;

    /**
     * Callback executed when the license is verified successfully.
     */
    onValid?: () => void | Promise<void>;

    /**
     * Callback executed when the license is invalid.
     * If `exitOnInvalid` is true, this runs before process exit.
     */
    onInvalid?: (reason?: string) => void | Promise<void>;

    /**
     * Callback executed when the verification request fails (network error, timeout, etc.).
     */
    onError?: (error: Error) => void | Promise<void>;

    /**
     * If set (> 0), the license will be re-verified periodically at this interval (in ms).
     * If the license becomes invalid during a periodic check, the configured behavior applies.
     */
    checkInterval?: number;
}
