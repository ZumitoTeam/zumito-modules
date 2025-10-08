import { Route, RouteMethod, ServiceContainer } from 'zumito-framework';
import { AdminAuthService } from '@zumito-team/admin-module/services/AdminAuthService.js';
import { AdminViewService } from '@zumito-team/admin-module/services/AdminViewService.js';
import { ReactionService, type ReactionCategory } from '../services/ReactionService';
import ejs from 'ejs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STATUS_MESSAGES: Record<
    string,
    { type: 'success' | 'error'; text: string }
> = {
    'category-saved': { type: 'success', text: 'Categoría guardada correctamente.' },
    'category-error': { type: 'error', text: 'No se pudo guardar la categoría.' },
    'category-deleted': {
        type: 'success',
        text: 'Categoría eliminada. Se usarán los valores por defecto si existían.',
    },
    'image-added': { type: 'success', text: 'Imagen agregada a la categoría.' },
    'image-updated': { type: 'success', text: 'Imagen actualizada correctamente.' },
    'image-deleted': { type: 'success', text: 'Imagen eliminada de la categoría.' },
    'image-error': { type: 'error', text: 'No se pudo procesar la imagen solicitada.' },
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class AdminReactionsPage extends Route {
    method = RouteMethod.get;
    path = '/admin/reactions';

    private readonly adminAuthService: AdminAuthService;
    private readonly adminViewService: AdminViewService;
    private readonly reactionService: ReactionService;

    constructor(
        adminAuthService: AdminAuthService = ServiceContainer.getService(AdminAuthService),
        adminViewService: AdminViewService = ServiceContainer.getService(AdminViewService),
        reactionService: ReactionService = ServiceContainer.getService(ReactionService),
    ) {
        super();
        this.adminAuthService = adminAuthService;
        this.adminViewService = adminViewService;
        this.reactionService = reactionService;
    }

    async execute(req: any, res: any): Promise<void> {
        const auth = await this.adminAuthService.isLoginValid(req).catch(() => ({ isValid: false }));

        if (!auth?.isValid) {
            res.redirect('/admin/login');
            return;
        }

        const categories: ReactionCategory[] = await this.reactionService.listCategories();
        const statusKey = typeof req.query?.status === 'string' ? req.query.status : null;
        const feedback = statusKey ? STATUS_MESSAGES[statusKey] ?? null : null;

        const content = await ejs.renderFile(
            path.resolve(__dirname, '../views/reactions.ejs'),
            {
                categories,
                feedback,
            },
        );

        const html = await this.adminViewService.render({
            title: 'Reacciones',
            content,
            reqPath: this.path,
            user: req.user || { name: 'Admin' },
        });

        res.send(html);
    }
}

export default AdminReactionsPage;
