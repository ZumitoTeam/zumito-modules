import { ServiceContainer } from "zumito-framework";
import { ZumitoFramework } from "zumito-framework";
import { DiscordAuthService } from "@zumito-team/discord-auth";

export class AdminAuthService extends DiscordAuthService {
    private framework: ZumitoFramework;

    constructor() {
        super({
            cookieName: 'admin_token',
            routePrefix: '/admin',
            loginRedirectPath: '/admin',
            cookieHttpOnly: false,
            fetchFullUser: false,
            purpose: 'admin',
        });
        this.framework = ServiceContainer.getService(ZumitoFramework);
    }

    async isSuperAdmin(discordUserId: string): Promise<boolean> {
        if (!discordUserId) return false;
        const models = (this.framework.database as any)?.models;
        if (!models?.AdminUser) return false;

        const admin = await models.AdminUser.findOne({ where: { discordUserId, isSuperAdmin: true } });
        return !!admin;
    }
}
