export class AnalyticsModuleConfig {
    static defaultRetentionDays = 90;
    static cleanupIntervalHours = 24;
    static defaultTrackMessages = true;
    static defaultTrackVoice = true;
    static defaultTrackMembers = true;
    static defaultTrackCommands = true;
    static defaultTrackCommandPerformance = false;
    static defaultTrackPerChannelVoice = false;
    static defaultTrackPerChannelMessages = false;

    static configure(opts: Partial<typeof AnalyticsModuleConfig>) {
        Object.assign(this, opts);
    }
}
