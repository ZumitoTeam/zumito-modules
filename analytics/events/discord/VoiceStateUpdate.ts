import { FrameworkEvent } from 'zumito-framework';
import { ServiceContainer } from 'zumito-framework';
import { AnalyticsCollector } from '../../services/AnalyticsCollector.js';

export class VoiceStateUpdate extends FrameworkEvent {
    once = false;
    source = 'discord';

    private collector = ServiceContainer.getService(AnalyticsCollector) as AnalyticsCollector;

    async execute({ oldState, newState }: any): Promise<void> {
        const guildId = newState?.guild?.id || oldState?.guild?.id;
        if (!guildId) return;

        const userId = newState?.id || oldState?.id;
        if (!userId) return;

        const oldChannelId = oldState?.channelId || null;
        const newChannelId = newState?.channelId || null;

        if (oldChannelId === newChannelId) return;

        if (oldChannelId) {
            await this.collector.recordVoiceLeave(guildId, oldChannelId, userId);
        }

        if (newChannelId) {
            await this.collector.recordVoiceJoin(guildId, newChannelId, userId);
        }
    }
}
