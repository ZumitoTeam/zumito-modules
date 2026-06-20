import { Route, RouteMethod, ServiceContainer } from 'zumito-framework';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { AnalyticsCollector } from '../services/AnalyticsCollector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class AdminAnalyticsGrowth extends Route {
    method = RouteMethod.get;
    path = '/admin/analytics/growth';

    private collector = ServiceContainer.getService(AnalyticsCollector) as AnalyticsCollector;

    async execute(req: any, res: any): Promise<void> {
        const { AdminAuthService } = await import('@zumito-team/admin-module/services/AdminAuthService.js');
        const auth = await ServiceContainer.getService(AdminAuthService).isLoginValid(req);
        if (!auth?.isValid) return res.redirect('/admin/login');

        const daysBack = parseInt(req.query.days as string) || 30;
        const guildGrowth = await this.collector.getGuildGrowth(daysBack);
        const summary = await this.collector.getGlobalStatsSummary(daysBack);

        const totalGuilds = Math.max(summary.totalGuilds, guildGrowth.length > 0 ? guildGrowth[guildGrowth.length - 1].guildCount : 0);

        const content = await ejs.renderFile(
            path.resolve(__dirname, '../views/admin-analytics-growth.ejs'),
            { guildGrowth, totalGuilds, summary, daysBack },
        );

        const { AdminViewService } = await import('@zumito-team/admin-module/services/AdminViewService.js');
        const view = ServiceContainer.getService(AdminViewService);
        const html = await view.render({
            title: 'Analiticas - Crecimiento',
            content,
            reqPath: this.path,
            user: { name: 'Admin' },
        });
        res.send(html);
    }
}
