import { ServiceContainer, TranslationManager } from "zumito-framework";
import { Client } from "zumito-framework/discord";
import { UserPanelNavigationService } from "./UserPanelNavigationService";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import { UserPanelAuthService } from "./UserPanelAuthService";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class UserPanelViewService {
    private static layoutPath = path.resolve(__dirname, '../views/layouts/main.ejs');

    constructor(
        private client = ServiceContainer.getService(Client),
        private navigationService = ServiceContainer.getService(UserPanelNavigationService),
        private userPanelAuthService = ServiceContainer.getService(UserPanelAuthService),
        private translationManager = ServiceContainer.getService(TranslationManager),
    ) {}

    async render({
        content,
        reqPath,
        req, res,
        options = {},
    }: {
        content: string;
        reqPath: string;
        req: any; // Express request object
        res: any; // Express response object
        options?: {
            extra?: Record<string, any>,
            hideSidebar?: boolean,
        }
    }) {
        const guildId = req.params?.guildId;
        const navItems = guildId
            ? this.navigationService.getItemsWithGuildId(guildId)
            : this.navigationService.getItems();

        if (guildId) {
            reqPath = reqPath.replace(/:guildId(?:\(.*?\))?/, guildId);
        }

        let selectedNavItem = navItems.find(item => item.url === reqPath);
        if (!selectedNavItem) {
            selectedNavItem = navItems.find(item =>
                item.sidebar && item.sidebar.sections &&
                item.sidebar.sections.some(section =>
                    section.items && section.items.some(child => child.url === reqPath)
                )
            );
        }
        const botName = this.client.user?.username || "Zumito";
        const tokenData = await this.userPanelAuthService.isLoginValid(req).then(result => result.data);

        const availableLanguages = this.translationManager.getLanguages();
        const defaultLanguage = this.translationManager.getDefaultLanguage();
        let lang = req.cookies?.panel_lang;
        if (!lang || !availableLanguages.includes(lang)) {
            const header = req.headers['accept-language'] as string | undefined;
            if (header) {
                const parts = header.split(',').map(p => p.split(';')[0].trim());
                lang = parts.map(p => p.slice(0, 2)).find(l => availableLanguages.includes(l));
            }
            if (!lang) lang = defaultLanguage;
            res.cookie('panel_lang', lang, {
                httpOnly: false,
                secure: false,
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: '/',
            });
        }
        const t = this.translationManager.getShortHandMethod('', lang);
        return await ejs.renderFile(
            UserPanelViewService.layoutPath,
            {
                content,
                tokenData,
                navItems,
                selectedNavItem,
                botName,
                reqPath,
                languages: availableLanguages,
                lang,
                t,
                ...options.extra,
                hideSidebar: options.hideSidebar || false,
            }
        );
    }
}
