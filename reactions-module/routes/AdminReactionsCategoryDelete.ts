import { Route, RouteMethod, ServiceContainer } from 'zumito-framework';
import { AdminAuthService } from '@zumito-team/admin-module/services/AdminAuthService.js';
import { ReactionService } from '../services/ReactionService';

export class AdminReactionsCategoryDelete extends Route {
    method = RouteMethod.post;
    path = '/admin/reactions/category/:key/delete';

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
        if (!key) {
            res.redirect('/admin/reactions?status=category-error');
            return;
        }

        try {
            await this.reactionService.deleteCategory(key);
            res.redirect('/admin/reactions?status=category-deleted');
        } catch (error) {
            console.error('[AdminReactionsCategoryDelete] Unable to delete category:', error);
            res.redirect('/admin/reactions?status=category-error');
        }
    }
}

export default AdminReactionsCategoryDelete;
