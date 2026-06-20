import { Route, RouteMethod, ServiceContainer } from "zumito-framework";
import { UserPanelAuthService } from "../services/UserPanelAuthService";

export class UserPanelLogin extends Route {

    method = RouteMethod.get;
    path = '/panel/login';

    constructor(
        private auth = ServiceContainer.getService(UserPanelAuthService)
    ) {
        super();
    }

    async execute(req: any, res: any) {
        if (await this.auth.isLoginValid(req).then(r => r.isValid)) return res.redirect('/panel');
        const host = process.env.HOST ?? req.get('host');
        res.redirect(this.auth.getDiscordAuthUrl(host));
    }
}
