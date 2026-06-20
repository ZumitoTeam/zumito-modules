import { Route, RouteMethod, ServiceContainer } from "zumito-framework";
import { AdminAuthService } from "../services/AdminAuthService";

export class AdminLogin extends Route {

    method = RouteMethod.get;
    path = '/admin/login';

    constructor(
        private auth = ServiceContainer.getService(AdminAuthService)
    ) {
        super();
    }

    async execute(req: any, res: any) {
        if (await this.auth.isLoginValid(req).then(r => r.isValid)) return res.redirect('/admin');
        const host = process.env.HOST ?? req.get('host');
        res.redirect(this.auth.getDiscordAuthUrl(host));
    }
}
