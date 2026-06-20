import { Command, CommandParameters, CommandType, ServiceContainer } from 'zumito-framework';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'zumito-framework/discord';
import { AnalyticsCollector } from '../services/AnalyticsCollector.js';

export class Stats extends Command {
    name = 'stats';
    categories = ['analytics', 'utility'];
    type = CommandType.any;
    dm = false;

    constructor(
        private collector: AnalyticsCollector = ServiceContainer.getService(AnalyticsCollector) as AnalyticsCollector,
    ) {
        super();
    }

    async execute({ message, interaction, framework, trans }: CommandParameters): Promise<void> {
        const target = message || interaction;
        if (!target) return;

        const guildId = message?.guildId || interaction?.guildId;
        if (!guildId) {
            await target.reply({ content: trans('noGuild'), ephemeral: true } as any);
            return;
        }

        const daysBack = 7;
        const stats = await this.collector.getGuildStats(guildId, daysBack);

        let totalMessages = 0, totalJoins = 0, totalLeaves = 0;
        let totalVoice = 0, totalCommands = 0;

        for (const s of stats) {
            totalMessages += s.message_count;
            totalJoins += s.join_count;
            totalLeaves += s.leave_count;
            totalVoice += s.voice_minutes;
            totalCommands += s.command_count;
        }

        const embed = new EmbedBuilder()
            .setTitle(trans('title'))
            .setDescription(trans('description', { days: daysBack }))
            .addFields(
                { name: trans('messages'), value: totalMessages.toString(), inline: true },
                { name: trans('commands'), value: totalCommands.toString(), inline: true },
                { name: trans('joins'), value: totalJoins.toString(), inline: true },
                { name: trans('leaves'), value: totalLeaves.toString(), inline: true },
                { name: trans('voice'), value: `${Math.round(totalVoice)} min`, inline: true },
            )
            .setColor(0x5865F2)
            .setTimestamp();

        const replyPayload = { embeds: [embed] } as any;

        if (message) {
            await message.reply(replyPayload);
        } else if (interaction) {
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply(replyPayload);
            } else {
                await interaction.reply({ ...replyPayload, ephemeral: true });
            }
        }
    }
}
