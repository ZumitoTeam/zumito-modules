import { Route, RouteMethod, ServiceContainer } from 'zumito-framework';
import { AdminAuthService } from '@zumito-team/admin-module/services/AdminAuthService.js';
import { ReactionService } from '../services/ReactionService';

export class AdminReactionsImageDelete extends Route {
    method = RouteMethod.post;
    path = '/admin/reactions/category/:key/images/delete';

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
            res.redirect('/admin/reactions/images?status=image-error');
            return;
        }

        try {
            await this.reactionService.removeImage(key, url);
            res.redirect('/admin/reactions/images?status=image-deleted');
        } catch (error) {
            console.error('[AdminReactionsImageDelete] Unable to delete image:', error);
            res.redirect('/admin/reactions/images?status=image-error');
        }
    }
}

export default AdminReactionsImageDelete;
