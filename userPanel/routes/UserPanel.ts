import { Route, RouteMethod, ServiceContainer } from "zumito-framework";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import ejs from 'ejs';
import { Client } from "zumito-framework/discord";
import { PermissionFlagsBits } from "discord.js";
import { UserPanelViewService } from "../services/UserPanelViewService";
import { UserPanelAuthService } from "../services/UserPanelAuthService";
import { UserPanelLanguageManager } from "../services/UserPanelLanguageManager";

const __dirname = dirname(fileURLToPath(import.meta.url));

export class UserPanel extends Route {
    method = RouteMethod.get;
    path = '/panel';

    constructor(
        private client: Client = ServiceContainer.getService(Client),
        private userPanelAuthService = ServiceContainer.getService(UserPanelAuthService),
        private userPanelLanguageManager = ServiceContainer.getService(UserPanelLanguageManager),
    ) {
        super();
    }

    async execute(req, res) {
        const authData = await this.userPanelAuthService.isLoginValid(req).then(result => result);
        if (!authData.isValid) {
            return res.redirect('/panel/login');
        }
        const client = this.client;
        const botUser = client.user;
        const botAvatar = botUser?.avatarURL?.() || botUser?.displayAvatarURL?.() || '';
        const botName = botUser?.username || 'Zumito';
        const botId = botUser?.id || '';

        const userId = authData.data.discordUserData.id;
        
        // Filtrar solo los servidores donde el usuario es administrador
        const servers = [] as Array<{ id: string; name: string; icon: string; isOwner: boolean }>;
        for (const guild of client.guilds.cache.values()) {
            let member = guild.members.cache.get(userId);
            if (!member) {
                member = await guild.members.fetch(userId).catch(() => null);
            }
            if (member && (
                member.permissions.has(PermissionFlagsBits.Administrator) ||
                member.permissions.has(PermissionFlagsBits.ManageGuild) ||
                guild.ownerId === userId
            )) {
                servers.push({
                    id: guild.id,
                    name: guild.name,
                    icon: guild.iconURL?.() || '',
                    isOwner: guild.ownerId === userId,
                });
            }
        }
        const { lang, t, availableLanguages, defaultLanguage } = this.userPanelLanguageManager.getLanguageVariables(req, res);
        const content = await ejs.renderFile(
            path.resolve(__dirname, '../views/dashboard.ejs'),
            {
                servers,
                botName,
                botId,
                botAvatar,
                lang, t, availableLanguages, defaultLanguage
            }
        );
        const userPanelView = new UserPanelViewService();
        const html = await userPanelView.render({
            content,
            reqPath: req.path,
            req, res,
            options: {
                hideSidebar: true,
            },
        });
        res.send(html);
    }
}
