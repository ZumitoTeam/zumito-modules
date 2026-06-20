import { FrameworkEvent } from 'zumito-framework';
import { ServiceContainer } from 'zumito-framework';
import { AnalyticsCollector } from '../../services/AnalyticsCollector.js';

export class CommandExecuted extends FrameworkEvent {
    once = false;
    source = 'framework';

    private collector = ServiceContainer.getService(AnalyticsCollector) as AnalyticsCollector;

    async execute(args: any): Promise<void> {
        const payload = args.object || args;
        if (!payload.guildId) return;
        await this.collector.recordCommand(payload);
    }
}
