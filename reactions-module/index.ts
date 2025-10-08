import { Module, ServiceContainer } from 'zumito-framework';
import { NavigationService } from '@zumito-team/admin-module/services/NavigationService.js';
import { ReactionService } from './services/ReactionService';

export class ReactionsModule extends Module {
    requeriments = {
        modules: [] as string[],
        services: ['NavigationService'],
        custom: [] as string[],
    };

    constructor(modulePath: string = import.meta.url) {
        super(modulePath);
        ServiceContainer.addService(ReactionService, [], true);
    }

    async initialize(): Promise<void> {
        await super.initialize();
        const reactionService = ServiceContainer.getService(ReactionService);
        await reactionService.ensureIndexes();

        try {
            const navigationService = ServiceContainer.getService(NavigationService);
            navigationService.registerItem({
                id: 'reactions',
                icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-discord-white/60 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3v.75h.75a2.25 2.25 0 0 1 0 4.5h-.75v.75a3 3 0 0 1-3 3H9.75l-3 3v-3h-.75a3 3 0 0 1-3-3v-1.5a3 3 0 0 1 3-3h.75v-.75a3 3 0 0 1 3-3z"/></svg>`,
                label: 'Reacciones',
                url: '/admin/reactions',
                order: 6,
                category: 'modules',
                sidebar: {
                    showDropdown: false,
                    sections: [
                        {
                            label: 'Reacciones',
                            items: [{ label: 'Categorías', url: '/admin/reactions' }],
                        },
                    ],
                },
            });
        } catch (error) {
            console.warn('[ReactionsModule] Navigation service not available:', error);
        }
    }
}

export { ReactionService } from './services/ReactionService';
export { DEFAULT_REACTION_CATEGORIES } from './defaults/ReactionDefaults';
export { AdminReactionsPage } from './routes/AdminReactionsPage';
export { AdminReactionsCategorySave } from './routes/AdminReactionsCategorySave';
export { AdminReactionsCategoryDelete } from './routes/AdminReactionsCategoryDelete';
export { AdminReactionsImageAdd } from './routes/AdminReactionsImageAdd';
export { AdminReactionsImageUpdate } from './routes/AdminReactionsImageUpdate';
export { AdminReactionsImageDelete } from './routes/AdminReactionsImageDelete';
