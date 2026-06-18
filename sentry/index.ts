import { Module, ServiceContainer, ZumitoFramework } from 'zumito-framework';
import { SentryService, type SentryServiceConfig } from './services/SentryService.js';

export { SentryService, type SentryServiceConfig } from './services/SentryService.js';

export class SentryModule extends Module {
    constructor(config: SentryServiceConfig) {
        super(import.meta.url);

        const framework = ServiceContainer.getService(ZumitoFramework);
        const sentryService = new SentryService(framework);
        sentryService.init(config);

        ServiceContainer.addService(SentryService, [], true, sentryService);
    }
}
