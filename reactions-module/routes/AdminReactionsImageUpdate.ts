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

type ImageUpdatePayload = Partial<Pick<ReactionImageInput, 'source' | 'description'>>;

export class AdminReactionsImageUpdate extends Route {
    method = RouteMethod.post;
    path = '/admin/reactions/category/:key/images/update';

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

        if (!key || !url) {
            res.redirect('/admin/reactions?status=image-error');
            return;
        }

        try {
            const updates: ImageUpdatePayload = {};

            if (typeof req.body?.source === 'string') {
                updates.source = req.body.source.trim();
            }

            if (req.body?.descriptionLocales !== undefined || req.body?.descriptionValues !== undefined) {
                updates.description = buildTranslations(req.body?.descriptionLocales, req.body?.descriptionValues);
            }

            await this.reactionService.updateImage(key, url, updates);
            res.redirect('/admin/reactions?status=image-updated');
        } catch (error) {
            console.error('[AdminReactionsImageUpdate] Unable to update image:', error);
            res.redirect('/admin/reactions?status=image-error');
        }
    }
}

export default AdminReactionsImageUpdate;
