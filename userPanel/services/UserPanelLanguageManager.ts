import { type Request, type Response } from "express";
import { ServiceContainer, TranslationManager } from "zumito-framework";

export class UserPanelLanguageManager {

    constructor(
        private translationManager = ServiceContainer.getService(TranslationManager),
        
    ) {}

    public getLanguageVariables(req: Request, res: Response) {
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
        const t = (key: string, params?: Record<string, any>) => this.translationManager.get(key, lang, params);
        return {
            lang,
            t,
            availableLanguages,
            defaultLanguage,
        }
    }

}