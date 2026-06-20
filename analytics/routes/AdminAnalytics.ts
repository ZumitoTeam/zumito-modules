import { Route, RouteMethod, ServiceContainer } from 'zumito-framework';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { Client } from 'zumito-framework/discord';
import { AnalyticsCollector } from '../services/AnalyticsCollector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class AdminAnalytics extends Route {
    method = RouteMethod.get;
    path = '/admin/analytics';

    constructor(
        private collector: AnalyticsCollector = ServiceContainer.getService(AnalyticsCollector) as AnalyticsCollector,
        private client: Client = ServiceContainer.getService(Client),
    ) {
        super();
    }

    async execute(req: any, res: any): Promise<void> {
        const { AdminAuthService } = await import('@zumito-team/admin-module/services/AdminAuthService.js');
        const auth = await ServiceContainer.getService(AdminAuthService).isLoginValid(req);
        if (!auth?.isValid) return res.redirect('/admin/login');

        const daysBack = parseInt(req.query.days as string) || 7;

        const summary = await this.collector.getGlobalStatsSummary(daysBack);
        const guildGrowth = await this.collector.getGuildGrowth(daysBack);
        const messagesPerDay = await this.collector.getMessagesPerDay(daysBack);
        const commandsPerDay = await this.collector.getCommandsPerDay(null, daysBack);
        const topCommands = await this.collector.getTopCommands(null, daysBack);
        const slowestCommands = await this.collector.getSlowestCommands(null, daysBack);

        const chartData = {
            guildGrowth,
            messagesPerDay,
            commandsPerDay,
            topCommands,
            slowestCommands,
        };

        const { TranslationManager } = await import('zumito-framework');
        const tm = ServiceContainer.getService(TranslationManager) as any;
        const t = (key: string, params?: any) => tm.get(key, 'en', params);

        const content = await ejs.renderFile(
            path.resolve(__dirname, '../views/admin-analytics.ejs'),
            {
                summary,
                chartData,
                slowestCommands: slowestCommands.length > 0 ? slowestCommands : undefined,
                t,
                daysBack,
            },
        );

        const { AdminViewService } = await import('@zumito-team/admin-module/services/AdminViewService.js');
        const view = ServiceContainer.getService(AdminViewService);
        const html = await view.render({
            title: 'Analiticas',
            content,
            reqPath: this.path,
            user: { name: 'Admin' },
        });

        res.send(html);
    }
}
