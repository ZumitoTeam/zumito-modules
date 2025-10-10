import { Module, ServiceContainer } from 'zumito-framework';
import { UserPanelNavigationService } from '@zumito-team/user-panel-module/services/UserPanelNavigationService';
import { MusicService } from './services/MusicService';

export class MusicModule extends Module {
    requeriments = {
        modules: [] as string[],
        services: ['UserPanelNavigationService'],
        custom: [] as string[],
    };

    constructor(modulePath: string = import.meta.url) {
        super(modulePath);
        ServiceContainer.addService(MusicService, [], true);
    }

    async initialize(): Promise<void> {
        await super.initialize();
        try {
            const navigationService = ServiceContainer.getService(UserPanelNavigationService);
            navigationService.registerSubItems('dashboard', 'general', [
                { id: 'music', label: 'music.sidebarTitle', url: '/panel/:guildId/music' },
            ]);
        } catch (error) {
            console.warn('[MusicModule] UserPanelNavigationService not available:', error);
        }
    }
}

export { MusicService } from './services/MusicService';
export { UserPanelMusic } from './routes/UserPanelMusic';
