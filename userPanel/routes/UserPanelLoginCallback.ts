import { Route, RouteMethod, ServiceContainer } from "zumito-framework";
import { UserPanelAuthService } from "../services/UserPanelAuthService";

export class UserPanelLoginCallback extends Route {

    method = RouteMethod.get;
    path = '/panel/login/callback';

    constructor(
        private auth = ServiceContainer.getService(UserPanelAuthService)
    ) {
        super();
    }

    async execute(req: any, res: any) {
        await this.auth.handleCallback(req, res);
    }
}
