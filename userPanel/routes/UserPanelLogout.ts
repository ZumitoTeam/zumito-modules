import { Route, RouteMethod } from "zumito-framework";

export class UserPanelLogout extends Route {
    method = RouteMethod.get;
    path = '/panel/logout';

    async execute(req: any, res: any) {
        res.clearCookie('panel_token', { path: '/' });
        return res.redirect('/panel');
    }
}
