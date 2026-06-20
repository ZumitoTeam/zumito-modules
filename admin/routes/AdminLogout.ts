import { Route, RouteMethod, ServiceContainer } from "zumito-framework";
import { AdminAuthService } from "../services/AdminAuthService";

export class AdminLogout extends Route {

    method = RouteMethod.get;
    path = '/admin/logout';

    constructor(
        private auth = ServiceContainer.getService(AdminAuthService)
    ) {
        super();
    }

    async execute(req: any, res: any) {
        this.auth.clearAuthCookie(res);
        res.redirect('/admin');
    }
}
