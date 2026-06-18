import * as Sentry from '@sentry/node';
import { ErrorType } from 'zumito-framework';
import type { ZumitoFramework } from 'zumito-framework';

export interface SentryServiceConfig {
    dsn: string;
    environment?: string;
    release?: string;
    sampleRate?: number;
    tracesSampleRate?: number;
    debug?: boolean;
}

export class SentryService {
    private initialized = false;

    constructor(
        private readonly framework: ZumitoFramework
    ) {}

    init(config: SentryServiceConfig): void {
        if (this.initialized) return;

        Sentry.init({
            dsn: config.dsn,
            environment: config.environment || process.env.NODE_ENV || 'development',
            release: config.release,
            sampleRate: config.sampleRate ?? 1.0,
            tracesSampleRate: config.tracesSampleRate,
            debug: config.debug ?? false,
            integrations: [
                Sentry.extraErrorDataIntegration(),
                Sentry.rewriteFramesIntegration(),
            ],
        });

        this.framework.eventEmitter.on('error', (error: any, options: any) => {
            this.captureError(error, options);
        });

        this.initialized = true;
    }

    private captureError(error: any, options: any): void {
        Sentry.withScope((scope) => {
            if (options?.type !== undefined) {
                scope.setTag('errorType', ErrorType[options.type] || String(options.type));
            }

            if (options?.command) {
                scope.setTag('command', options.command.name || 'unknown');
                scope.setContext('command', {
                    name: options.command.name,
                    type: options.command.type,
                    categories: options.command.categories,
                });
            }

            if (options?.interaction) {
                const interaction = options.interaction;
                scope.setTag('source', 'slash-command');

                if (interaction.guildId) {
                    scope.setTag('guildId', interaction.guildId);
                }
                if (interaction.user?.id) {
                    scope.setUser({ id: interaction.user.id, username: interaction.user.username });
                }
                if (interaction.channelId) {
                    scope.setTag('channelId', interaction.channelId);
                }

                scope.setContext('interaction', {
                    id: interaction.id,
                    commandName: interaction.commandName,
                    channelId: interaction.channelId,
                    guildId: interaction.guildId,
                });
            }

            if (options?.message) {
                const message = options.message;
                scope.setTag('source', 'prefix-command');

                if (message.guildId) {
                    scope.setTag('guildId', message.guildId);
                }
                if (message.author?.id) {
                    scope.setUser({ id: message.author.id, username: message.author.username });
                }
                if (message.channelId) {
                    scope.setTag('channelId', message.channelId);
                }

                scope.setContext('message', {
                    id: message.id,
                    content: message.content?.slice(0, 200),
                    channelId: message.channelId,
                    guildId: message.guildId,
                });
            }

            if (options?.endpoint) {
                scope.setTag('endpoint', options.endpoint);
                scope.setTag('method', options.method || 'unknown');
                scope.setContext('api', { endpoint: options.endpoint, method: options.method });
            }

            if (options?.moduleName) {
                scope.setTag('module', options.moduleName);
            }

            if (options?.path) {
                scope.setTag('routePath', options.path);
            }

            scope.setLevel('error');
            Sentry.captureException(error);
        });
    }
}
