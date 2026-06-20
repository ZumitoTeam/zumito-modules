import { Command, CommandParameters, CommandType, ServiceContainer } from 'zumito-framework';
import { EmbedBuilder, PermissionFlagsBits } from 'zumito-framework/discord';
import { AnalyticsCollector } from '../services/AnalyticsCollector.js';

export class AnalyticsConfig extends Command {
    name = 'analytics-config';
    categories = ['analytics', 'admin'];
    type = CommandType.any;
    dm = false;
    adminOnly = true;

    constructor(
        private collector: AnalyticsCollector = ServiceContainer.getService(AnalyticsCollector) as AnalyticsCollector,
    ) {
        super();
    }

    async execute({ message, interaction, trans, args }: CommandParameters): Promise<void> {
        const target = message || interaction;
        if (!target) return;

        const guildId = message?.guildId || interaction?.guildId;
        if (!guildId) {
            await target.reply({ content: trans('noGuild') } as any);
            return;
        }

        const config = await this.collector.getConfig(guildId);

        const subcommand = args instanceof Map ? args.get('action') : (typeof args === 'object' && 'action' in args ? args['action'] : undefined);

        if (!subcommand) {
            const embed = new EmbedBuilder()
                .setTitle(trans('configTitle'))
                .setDescription(trans('configDescription'))
                .addFields(
                    { name: trans('enabled'), value: config.enabled ? '✅ Yes' : '❌ No', inline: true },
                    { name: trans('trackMessages'), value: config.track_messages ? '✅' : '❌', inline: true },
                    { name: trans('trackVoice'), value: config.track_voice ? '✅' : '❌', inline: true },
                    { name: trans('trackMembers'), value: config.track_members ? '✅' : '❌', inline: true },
                    { name: trans('trackCommands'), value: config.track_commands ? '✅' : '❌', inline: true },
                    { name: trans('trackPerformance'), value: config.track_command_performance ? '✅' : '❌', inline: true },
                    { name: trans('trackPerChannelVoice'), value: config.track_per_channel_voice ? '✅' : '❌', inline: true },
                    { name: trans('retentionDays'), value: (config.retention_days || '90').toString(), inline: true },
                    { name: trans('publicStats'), value: config.public_stats_page ? '✅' : '❌', inline: true },
                )
                .setColor(0x5865F2);

            if (message) {
                await message.reply({ embeds: [embed] });
            } else if (interaction) {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ embeds: [embed] });
                } else {
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                }
            }
            return;
        }

        switch (subcommand) {
            case 'enable':
                await this.collector.updateConfig(guildId, { enabled: true });
                break;
            case 'disable':
                await this.collector.updateConfig(guildId, { enabled: false });
                break;
            case 'messages':
                await this.collector.updateConfig(guildId, { track_messages: !config.track_messages });
                break;
            case 'voice':
                await this.collector.updateConfig(guildId, { track_voice: !config.track_voice });
                break;
            case 'members':
                await this.collector.updateConfig(guildId, { track_members: !config.track_members });
                break;
            case 'commands':
                await this.collector.updateConfig(guildId, { track_commands: !config.track_commands });
                break;
            case 'performance':
                await this.collector.updateConfig(guildId, { track_command_performance: !config.track_command_performance });
                break;
            case 'retention': {
                const days = args instanceof Map ? args.get('days') : (typeof args === 'object' && 'days' in args ? args['days'] : null);
                if (days && typeof days === 'number') {
                    await this.collector.updateConfig(guildId, { retention_days: days });
                }
                break;
            }
            default:
                break;
        }

        const updated = await this.collector.getConfig(guildId);
        const embed = new EmbedBuilder()
            .setTitle(trans('configUpdated'))
            .addFields(
                { name: trans('enabled'), value: updated.enabled ? '✅ Yes' : '❌ No', inline: true },
                { name: trans('trackMessages'), value: updated.track_messages ? '✅' : '❌', inline: true },
                { name: trans('trackVoice'), value: updated.track_voice ? '✅' : '❌', inline: true },
                { name: trans('trackMembers'), value: updated.track_members ? '✅' : '❌', inline: true },
                { name: trans('trackCommands'), value: updated.track_commands ? '✅' : '❌', inline: true },
                { name: trans('trackPerformance'), value: updated.track_command_performance ? '✅' : '❌', inline: true },
                { name: trans('retentionDays'), value: (updated.retention_days || '90').toString(), inline: true },
            )
            .setColor(0x57F287);

        if (message) {
            await message.reply({ embeds: [embed] });
        } else if (interaction) {
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    }
}
