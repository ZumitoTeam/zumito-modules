import { Route, RouteMethod, ServiceContainer } from 'zumito-framework';
import { AdminAuthService } from '@zumito-team/admin-module/services/AdminAuthService.js';
import { ReactionService, type ReactionCategoryInput } from '../services/ReactionService';

function toArray<T>(value: T | T[] | undefined | null): T[] {
    if (Array.isArray(value)) {
        return value;
    }
    if (value === undefined || value === null) {
        return [];
    }
    return [value];
}

function buildTranslations(localesInput: unknown, valuesInput: unknown): Record<string, string> {
    const locales = toArray(localesInput as string | string[] | undefined);
    const values = toArray(valuesInput as string | string[] | undefined);
    const translations: Record<string, string> = {};

    for (let index = 0; index < Math.min(locales.length, values.length); index += 1) {
        const locale = typeof locales[index] === 'string' ? locales[index].trim() : '';
        const value = typeof values[index] === 'string' ? values[index].trim() : '';
        if (!locale || !value) {
            continue;
        }
        translations[locale] = value;
    }

    return translations;
}

export class AdminReactionsCategorySave extends Route {
    method = RouteMethod.post;
    path = '/admin/reactions/category';

    private readonly adminAuthService: AdminAuthService;
    private readonly reactionService: ReactionService;

    constructor(
        adminAuthService: AdminAuthService = ServiceContainer.getService(AdminAuthService),
        reactionService: ReactionService = ServiceContainer.getService(ReactionService),
    ) {
        super();
        this.adminAuthService = adminAuthService;
        this.reactionService = reactionService;
    }

    async execute(req: any, res: any): Promise<void> {
        const auth = await this.adminAuthService.isLoginValid(req).catch(() => ({ isValid: false }));
        if (!auth?.isValid) {
            res.status(401).send('Unauthorized');
            return;
        }

        const key = typeof req.body?.key === 'string' ? req.body.key.trim() : '';
        if (!key) {
            res.redirect('/admin/reactions?status=category-error');
            return;
        }

        try {
            const payload: ReactionCategoryInput = {
                key,
                displayName: buildTranslations(req.body?.displayNameLocales, req.body?.displayNameValues),
                mentionTemplate: buildTranslations(req.body?.mentionLocales, req.body?.mentionValues),
                simpleTemplate: buildTranslations(req.body?.simpleLocales, req.body?.simpleValues),
            };

            await this.reactionService.upsertCategory(payload);
            res.redirect('/admin/reactions?status=category-saved');
        } catch (error) {
            console.error('[AdminReactionsCategorySave] Unable to save category:', error);
            res.redirect('/admin/reactions?status=category-error');
        }
    }
}

export default AdminReactionsCategorySave;
