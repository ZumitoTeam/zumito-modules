import { FrameworkEvent } from 'zumito-framework';
import { ServiceContainer } from 'zumito-framework';
import { AnalyticsCollector } from '../../services/AnalyticsCollector.js';

export class GuildMemberRemove extends FrameworkEvent {
    once = false;
    source = 'discord';

    private collector = ServiceContainer.getService(AnalyticsCollector) as AnalyticsCollector;

    async execute({ guildmember }: any): Promise<void> {
        if (!guildmember?.guild?.id) return;
        const guildId = guildmember.guild.id;
        await this.collector.recordMemberLeave(guildId);

        try {
            const memberCount = guildmember.guild.memberCount;
            if (memberCount) {
                await this.collector.recordMemberCount(guildId, memberCount);
            }
        } catch (_) { /* ignore */ }
    }
}
