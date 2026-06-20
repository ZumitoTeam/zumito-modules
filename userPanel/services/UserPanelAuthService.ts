import { DiscordAuthService } from "@zumito-team/discord-auth";

export class UserPanelAuthService extends DiscordAuthService {

    constructor() {
        super({
            cookieName: 'panel_token',
            routePrefix: '/panel',
            loginRedirectPath: '/panel',
            cookieHttpOnly: true,
            fetchFullUser: true,
            purpose: 'panel',
        });
    }
}
