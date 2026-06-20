import { Route, RouteMethod, ServiceContainer } from "zumito-framework";
import { UserPanelAuthService } from "../services/UserPanelAuthService";

export class UserPanelLogout extends Route {

    method = RouteMethod.get;
    path = '/panel/logout';

    constructor(
        private auth = ServiceContainer.getService(UserPanelAuthService)
    ) {
        super();
    }

    async execute(req: any, res: any) {
        this.auth.clearAuthCookie(res);
        res.redirect('/panel');
    }
}
