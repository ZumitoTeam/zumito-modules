import { Route, RouteMethod, ServiceContainer } from 'zumito-framework';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { AnalyticsCollector } from '../services/AnalyticsCollector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class AdminAnalyticsCommands extends Route {
    method = RouteMethod.get;
    path = '/admin/analytics/commands';

    private collector = ServiceContainer.getService(AnalyticsCollector) as AnalyticsCollector;

    async execute(req: any, res: any): Promise<void> {
        const { AdminAuthService } = await import('@zumito-team/admin-module/services/AdminAuthService.js');
        const auth = await ServiceContainer.getService(AdminAuthService).isLoginValid(req);
        if (!auth?.isValid) return res.redirect('/admin/login');

        const daysBack = parseInt(req.query.days as string) || 7;
        const commandsPerDay = await this.collector.getCommandsPerDay(null, daysBack);
        const topCommands = await this.collector.getTopCommands(null, daysBack, 15);
        const slowestCommands = await this.collector.getSlowestCommands(null, daysBack, 10);

        const content = await ejs.renderFile(
            path.resolve(__dirname, '../views/admin-analytics-commands.ejs'),
            { commandsPerDay, topCommands, slowestCommands, daysBack },
        );

        const { AdminViewService } = await import('@zumito-team/admin-module/services/AdminViewService.js');
        const view = ServiceContainer.getService(AdminViewService);
        const html = await view.render({
            title: 'Analiticas - Comandos',
            content,
            reqPath: this.path,
            user: { name: 'Admin' },
        });
        res.send(html);
    }
}
