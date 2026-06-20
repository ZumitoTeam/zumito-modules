import 'reflect-metadata';
import { Module, ServiceContainer } from 'zumito-framework';
import { AnalyticsCollector } from './services/AnalyticsCollector.js';
import { AnalyticsModuleConfig } from './config.js';

export class AnalyticsModule extends Module {
    static moduleName = 'analytics-module';
    static dependencies = [] as const;
    static optionalDependencies = ['admin-module', 'user-panel-module'] as const;

    constructor(modulePath: string = import.meta.url) {
        super(modulePath);
        ServiceContainer.addService(AnalyticsCollector, [], true);
    }

    async initialize(): Promise<void> {
        await super.initialize();

        try {
            const { NavigationService } = await import('@zumito-team/admin-module/services/NavigationService.js');
            const nav = ServiceContainer.getService(NavigationService);
            nav.registerItem({
                id: 'analytics',
                icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-discord-white/60 group-hover:text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 5 4-3"/></svg>`,
                label: 'Analiticas',
                url: '/admin/analytics',
                order: 8,
                category: 'modules',
                sidebar: {
                    showDropdown: false,
                    sections: [
                        {
                            label: 'Analiticas',
                            items: [
                                { label: 'Resumen', url: '/admin/analytics' },
                                { label: 'Mensajes', url: '/admin/analytics/messages' },
                                { label: 'Comandos', url: '/admin/analytics/commands' },
                                { label: 'Crecimiento', url: '/admin/analytics/growth' },
                            ],
                        },
                    ],
                },
            });
        } catch (e) {
            console.warn('[AnalyticsModule] Admin panel not available, skipping admin integration');
        }

        try {
            const { UserPanelNavigationService } = await import('@zumito-team/user-panel-module/services/UserPanelNavigationService');
            const nav = ServiceContainer.getService(UserPanelNavigationService);
            nav.registerItem({
                id: 'analytics',
                icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-discord-white/60 group-hover:text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 5 4-3"/></svg>`,
                label: 'analytics.sidebarTitle',
                url: '/panel/:guildId/analytics',
                order: 3,
                category: 'general',
                sidebar: {
                    showDropdown: false,
                    sections: [
                        {
                            id: 'analytics-overview',
                            label: 'analytics.overview',
                            items: [
                                { label: 'analytics.overview', url: '/panel/:guildId/analytics' },
                            ],
                        },
                        {
                            id: 'analytics-details',
                            label: 'analytics.detailedStats',
                            items: [
                                { label: 'analytics.messages', url: '/panel/:guildId/analytics/messages' },
                                { label: 'analytics.voice', url: '/panel/:guildId/analytics/voice' },
                                { label: 'analytics.commands', url: '/panel/:guildId/analytics/commands' },
                            ],
                        },
                    ],
                },
            });
        } catch (e) {
            console.warn('[AnalyticsModule] User panel not available, skipping user panel integration');
        }

        const collector = ServiceContainer.getService(AnalyticsCollector) as AnalyticsCollector;
        collector.startCleanupScheduler();
    }

    async onAllReady(): Promise<void> {
        const collector = ServiceContainer.getService(AnalyticsCollector) as AnalyticsCollector;
        collector.clearVoiceSessions();
    }
}

export { AnalyticsCollector } from './services/AnalyticsCollector.js';
export type { CommandExecutedPayload } from './services/AnalyticsCollector.js';
export { AnalyticsModuleConfig } from './config.js';
export { GuildDailyStats } from './models/GuildDailyStats.js';
export { CommandDailyStats } from './models/CommandDailyStats.js';
export { VoiceChannelDailyStats } from './models/VoiceChannelDailyStats.js';
export { ChannelMessageStats } from './models/ChannelMessageStats.js';
export { GuildAnalyticsConfig } from './models/GuildAnalyticsConfig.js';
