import { Route, RouteMethod, ServiceContainer } from 'zumito-framework';
import { AdminAuthService } from '@zumito-team/admin-module/services/AdminAuthService.js';
import { ReactionService, type ReactionImageInput } from '../services/ReactionService';

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

export class AdminReactionsImageAdd extends Route {
    method = RouteMethod.post;
    path = '/admin/reactions/category/:key/images';

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

        const key = typeof req.params?.key === 'string' ? req.params.key.trim() : '';
        const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
        const source = typeof req.body?.source === 'string' ? req.body.source.trim() : '';

        if (!key || !url || !source) {
            res.redirect('/admin/reactions/images?status=image-error');
            return;
        }

        try {
            const description = buildTranslations(req.body?.descriptionLocales, req.body?.descriptionValues);
            const payload: ReactionImageInput = {
                url,
                source,
                description,
            };
            await this.reactionService.addImage(key, payload);
            res.redirect('/admin/reactions/images?status=image-added');
        } catch (error) {
            console.error('[AdminReactionsImageAdd] Unable to add image:', error);
            res.redirect('/admin/reactions/images?status=image-error');
        }
    }
}

export default AdminReactionsImageAdd;
