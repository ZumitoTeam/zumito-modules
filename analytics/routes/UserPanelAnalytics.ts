import { Route, RouteMethod, ServiceContainer } from 'zumito-framework';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { Client, PermissionFlagsBits } from 'zumito-framework/discord';
import { AnalyticsCollector } from '../services/AnalyticsCollector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class UserPanelAnalytics extends Route {
    method = RouteMethod.get;
    path = '/panel/:guildId/analytics';

    constructor(
        private collector: AnalyticsCollector = ServiceContainer.getService(AnalyticsCollector) as AnalyticsCollector,
        private client: Client = ServiceContainer.getService(Client) as Client,
    ) {
        super();
    }

    async execute(req: any, res: any): Promise<void> {
        const { UserPanelAuthService } = await import('@zumito-team/user-panel-module/services/UserPanelAuthService');
        const { UserPanelViewService } = await import('@zumito-team/user-panel-module/services/UserPanelViewService');
        const { UserPanelLanguageManager } = await import('@zumito-team/user-panel-module/services/UserPanelLanguageManager');

        const authService = ServiceContainer.getService(UserPanelAuthService);
        const authData = await authService.isLoginValid(req);
        if (!authData.isValid) return res.redirect('/panel/login');

        const userId = authData.data.discordUserData.id;
        const guildId = req.params.guildId as string;
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return res.status(404).send('Server not found');

        let member = guild.members.cache.get(userId);
        if (!member) member = await guild.members.fetch(userId).catch(() => null);
        if (!member || !(
            member.permissions.has(PermissionFlagsBits.Administrator) ||
            member.permissions.has(PermissionFlagsBits.ManageGuild) ||
            guild.ownerId === userId
        )) {
            return res.status(403).send('No tienes permisos en este servidor');
        }

        const daysBack = parseInt(req.query.days as string) || 7;
        const langMgr = ServiceContainer.getService(UserPanelLanguageManager);
        const { t } = langMgr.getLanguageVariables(req, res);

        const stats = await this.collector.getGuildStats(guildId, daysBack);

        let guildSummary = {
            totalMessages: 0, totalJoins: 0, totalLeaves: 0,
            totalVoiceMinutes: 0, totalCommands: 0,
        };
        const joinsPerDay: { date: string; count: number }[] = [];
        const leavesPerDay: { date: string; count: number }[] = [];
        const messagesPerDay: { date: string; count: number }[] = [];
        const voicePerDay: { date: string; count: number }[] = [];

        for (const s of stats) {
            guildSummary.totalMessages += s.message_count;
            guildSummary.totalJoins += s.join_count;
            guildSummary.totalLeaves += s.leave_count;
            guildSummary.totalVoiceMinutes += s.voice_minutes;
            guildSummary.totalCommands += s.command_count;

            messagesPerDay.push({ date: s.date, count: s.message_count });
            joinsPerDay.push({ date: s.date, count: s.join_count });
            leavesPerDay.push({ date: s.date, count: s.leave_count });
            voicePerDay.push({ date: s.date, count: s.voice_minutes });
        }

        const commandsPerDay = await this.collector.getCommandsPerDay(guildId, daysBack);
        const topCommands = await this.collector.getTopCommands(guildId, daysBack);
        const slowestCommands = await this.collector.getSlowestCommands(guildId, daysBack);
        const channelVoice = await this.collector.getVoiceChannelStats(guildId, daysBack);

        const chartData = {
            messagesPerDay, joinsPerDay, leavesPerDay, voicePerDay,
            commandsPerDay, topCommands, slowestCommands, channelVoice,
        };

        const config = await this.collector.getConfig(guildId);

        const content = await ejs.renderFile(
            path.resolve(__dirname, '../views/user-analytics.ejs'),
            {
                guildSummary,
                chartData,
                slowestCommands: (config.track_command_performance && slowestCommands.length > 0) ? slowestCommands : undefined,
                channelVoice: (config.track_per_channel_voice && channelVoice.length > 0) ? channelVoice : undefined,
                t,
                daysBack,
            },
        );

        const view = ServiceContainer.getService(UserPanelViewService);
        const html = await view.render({ content, reqPath: req.path, req, res });
        res.send(html);
    }
}
