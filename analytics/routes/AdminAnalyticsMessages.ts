import { Route, RouteMethod, ServiceContainer } from 'zumito-framework';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { Client } from 'zumito-framework/discord';
import { AnalyticsCollector } from '../services/AnalyticsCollector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class AdminAnalyticsMessages extends Route {
    method = RouteMethod.get;
    path = '/admin/analytics/messages';

    private collector = ServiceContainer.getService(AnalyticsCollector) as AnalyticsCollector;

    async execute(req: any, res: any): Promise<void> {
        const { AdminAuthService } = await import('@zumito-team/admin-module/services/AdminAuthService.js');
        const auth = await ServiceContainer.getService(AdminAuthService).isLoginValid(req);
        if (!auth?.isValid) return res.redirect('/admin/login');

        const daysBack = parseInt(req.query.days as string) || 7;
        const messagesPerDay = await this.collector.getMessagesPerDay(daysBack);

        const content = await ejs.renderFile(
            path.resolve(__dirname, '../views/admin-analytics-messages.ejs'),
            { messagesPerDay, daysBack },
        );

        const { AdminViewService } = await import('@zumito-team/admin-module/services/AdminViewService.js');
        const view = ServiceContainer.getService(AdminViewService);
        const html = await view.render({
            title: 'Analiticas - Mensajes',
            content,
            reqPath: this.path,
            user: { name: 'Admin' },
        });
        res.send(html);
    }
}
