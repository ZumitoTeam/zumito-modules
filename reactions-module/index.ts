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
                icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-discord-white/60 group-hover:text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/><circle cx="15" cy="9" r="1.5" fill="currentColor"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M17 4.5c0-.83.67-1.5 1.5-1.5S20 3.67 20 4.5c0 1.5-1.5 2.5-1.5 2.5S17 6 17 4.5Z"/></svg>`,
                label: 'Reacciones',
                url: '/admin/reactions',
                order: 6,
                category: 'modules',
                sidebar: {
                    showDropdown: false,
                    sections: [
                        {
                            label: 'Reacciones',
                            items: [
                                { label: 'Categorías', url: '/admin/reactions' },
                                { label: 'Imágenes', url: '/admin/reactions/images' },
                            ],
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
export { AdminReactionsImagesPage } from './routes/AdminReactionsImagesPage';
export { AdminReactionsImageAdd } from './routes/AdminReactionsImageAdd';
export { AdminReactionsImageUpdate } from './routes/AdminReactionsImageUpdate';
export { AdminReactionsImageDelete } from './routes/AdminReactionsImageDelete';
