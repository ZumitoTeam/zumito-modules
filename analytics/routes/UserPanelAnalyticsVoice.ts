import { Route, RouteMethod, ServiceContainer } from 'zumito-framework';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { Client, PermissionFlagsBits } from 'zumito-framework/discord';
import { AnalyticsCollector } from '../services/AnalyticsCollector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class UserPanelAnalyticsVoice extends Route {
    method = RouteMethod.get;
    path = '/panel/:guildId/analytics/voice';

    private collector = ServiceContainer.getService(AnalyticsCollector) as AnalyticsCollector;
    private client = ServiceContainer.getService(Client) as Client;

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
        if (!member || !(member.permissions.has(PermissionFlagsBits.Administrator) ||
            member.permissions.has(PermissionFlagsBits.ManageGuild) || guild.ownerId === userId)) {
            return res.status(403).send('No tienes permisos en este servidor');
        }

        const daysBack = parseInt(req.query.days as string) || 7;
        const langMgr = ServiceContainer.getService(UserPanelLanguageManager);
        const { t } = langMgr.getLanguageVariables(req, res);

        const stats = await this.collector.getGuildStats(guildId, daysBack);
        const channelVoice = await this.collector.getVoiceChannelStats(guildId, daysBack);

        let totalVoice = 0;
        const voicePerDay: { date: string; count: number }[] = [];
        for (const s of stats) {
            totalVoice += s.voice_minutes;
            voicePerDay.push({ date: s.date, count: s.voice_minutes });
        }

        const config = await this.collector.getConfig(guildId);

        const content = await ejs.renderFile(
            path.resolve(__dirname, '../views/user-analytics-voice.ejs'),
            { totalVoice, voicePerDay, channelVoice: config.track_per_channel_voice ? channelVoice : null, t, daysBack },
        );

        const view = ServiceContainer.getService(UserPanelViewService);
        const html = await view.render({ content, reqPath: req.path, req, res });
        res.send(html);
    }
}
