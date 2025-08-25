import { Route, RouteMethod, ServiceContainer } from 'zumito-framework';
import { Client } from 'zumito-framework/discord';
import ejs from 'ejs';
import path from 'path';
import { AdminViewService } from '../services/AdminViewService';
import { AdminAuthService } from '../services/AdminAuthService';

export class AdminServers extends Route {
    method = RouteMethod.get;
    path = '/admin/servers';

    private client: Client;
    private adminAuthService: AdminAuthService;

    constructor() {
        super();
        this.client = ServiceContainer.getService(Client);
        this.adminAuthService = ServiceContainer.getService(AdminAuthService);
    }

    async execute(req: any, res: any) {
        if (!await this.adminAuthService.isLoginValid(req).then(r => r.isValid)) return res.redirect('/admin/login');

        const guilds = this.client.guilds.cache.map(g => ({
            id: g.id,
            name: g.name,
            icon: g.iconURL?.({ size: 64 }) || ''
        }));

        const content = await ejs.renderFile(
            path.resolve(__dirname, '../views/servers.ejs'),
            { guilds }
        );

        const adminView = new AdminViewService();
        const html = await adminView.render({
            title: 'Servers',
            content,
            reqPath: this.path,
            user: req.user || { name: 'Admin' }
        });

        res.send(html);
    }
}
