import { FrameworkEvent } from 'zumito-framework';
import { ServiceContainer } from 'zumito-framework';
import { AnalyticsCollector } from '../../services/AnalyticsCollector.js';

export class MessageCreate extends FrameworkEvent {
    once = false;
    source = 'discord';

    private collector = ServiceContainer.getService(AnalyticsCollector) as AnalyticsCollector;

    async execute({ message }: any): Promise<void> {
        if (!message.guildId) return;
        if (message.author?.bot) return;
        await this.collector.recordMessage(message.guildId);
    }
}
