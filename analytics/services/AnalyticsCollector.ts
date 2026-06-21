import { DatabaseManager, ServiceContainer } from 'zumito-framework';
import { GuildDailyStats } from '../models/GuildDailyStats.js';
import { CommandDailyStats } from '../models/CommandDailyStats.js';
import { CommandExecuted } from '../models/CommandExecuted.js';
import { VoiceChannelDailyStats } from '../models/VoiceChannelDailyStats.js';
import { GuildAnalyticsConfig } from '../models/GuildAnalyticsConfig.js';
import { ChannelMessageStats } from '../models/ChannelMessageStats.js';
import { AnalyticsModuleConfig } from '../config.js';

interface VoiceSession {
    joinTime: number;
    channelId: string;
}

export interface CommandExecutedPayload {
    guildId: string;
    commandName: string;
    type: 'prefix' | 'slash';
    executionTimeMs: number;
    success: boolean;
}

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

export class AnalyticsCollector {

    private voiceSessions: Map<string, VoiceSession> = new Map();
    private dailyVoiceUsers: Map<string, Set<string>> = new Map();
    private dailyMessageAuthors: Map<string, Set<string>> = new Map();
    private dailyChannelMessageAuthors: Map<string, Set<string>> = new Map();
    private cleanupTimer: ReturnType<typeof setInterval> | null = null;

    constructor(
        private db: any = ServiceContainer.getService(DatabaseManager),
    ) {}

    private repo(name: any): any {
        return this.db.getRepository(name);
    }

    // ── Event recording ──────────────────────────────────────────

    private async ensuredConfig(guildId: string): Promise<GuildAnalyticsConfig> {
        const repo = this.repo(GuildAnalyticsConfig);
        const existing = await repo.findOne({ guild_id: guildId });
        if (existing) return existing;

        const defaults: GuildAnalyticsConfig = {
            guild_id: guildId,
            enabled: AnalyticsModuleConfig.defaultTrackMessages || AnalyticsModuleConfig.defaultTrackVoice || AnalyticsModuleConfig.defaultTrackMembers || AnalyticsModuleConfig.defaultTrackCommands,
            track_messages: AnalyticsModuleConfig.defaultTrackMessages,
            track_voice: AnalyticsModuleConfig.defaultTrackVoice,
            track_members: AnalyticsModuleConfig.defaultTrackMembers,
            track_commands: AnalyticsModuleConfig.defaultTrackCommands,
            track_command_performance: AnalyticsModuleConfig.defaultTrackCommandPerformance,
            track_per_channel_voice: AnalyticsModuleConfig.defaultTrackPerChannelVoice,
            track_per_channel_messages: AnalyticsModuleConfig.defaultTrackPerChannelMessages,
            retention_days: AnalyticsModuleConfig.defaultRetentionDays,
            public_stats_page: false,
        };
        await repo.insert(defaults);
        return defaults;
    }

    async recordMessage(guildId: string, channelId?: string, authorId?: string): Promise<void> {
        const config = await this.ensuredConfig(guildId);
        if (!config.enabled || !config.track_messages) return;
        await this.upsertGuildStats(guildId, { message_count: 1 });

        // Track unique authors per day
        if (authorId) {
            const authorKey = `${guildId}_${today()}`;
            if (!this.dailyMessageAuthors.has(authorKey)) {
                this.dailyMessageAuthors.set(authorKey, new Set());
            }
            this.dailyMessageAuthors.get(authorKey)!.add(authorId);
        }

        // Track per-channel stats
        if (channelId && config.track_per_channel_messages) {
            const date = today();
            const chanKey = `${guildId}_${channelId}_${date}`;
            const repo = this.repo(ChannelMessageStats);
            const existing = await repo.findOne({ id: chanKey });

            if (authorId) {
                if (!this.dailyChannelMessageAuthors.has(chanKey)) {
                    this.dailyChannelMessageAuthors.set(chanKey, new Set());
                }
                this.dailyChannelMessageAuthors.get(chanKey)!.add(authorId);
            }

            if (existing) {
                await repo.update({ id: chanKey }, {
                    message_count: existing.message_count + 1,
                    unique_authors: this.dailyChannelMessageAuthors.get(chanKey)?.size || 0,
                });
            } else {
                await repo.insert({
                    id: chanKey,
                    guild_id: guildId,
                    channel_id: channelId,
                    date,
                    message_count: 1,
                    unique_authors: 0,
                });
            }
        }
    }

    async recordMemberJoin(guildId: string): Promise<void> {
        const config = await this.ensuredConfig(guildId);
        if (!config.enabled || !config.track_members) return;
        await this.upsertGuildStats(guildId, { join_count: 1 });
    }

    async recordMemberLeave(guildId: string): Promise<void> {
        const config = await this.ensuredConfig(guildId);
        if (!config.enabled || !config.track_members) return;
        await this.upsertGuildStats(guildId, { leave_count: 1 });
    }

    async recordVoiceJoin(guildId: string, channelId: string, userId: string): Promise<void> {
        const key = `${guildId}_${userId}`;

        const existing = this.voiceSessions.get(key);
        if (existing && existing.channelId !== channelId) {
            const minutes = (Date.now() - existing.joinTime) / 60000;
            if (minutes > 0) {
                await this.recordVoiceMinutes(guildId, existing.channelId, minutes, new Set([userId]));
            }
        } else if (existing) {
            return;
        }

        this.voiceSessions.set(key, { joinTime: Date.now(), channelId });

        const dateKey = `${guildId}_${channelId}_${today()}`;
        if (!this.dailyVoiceUsers.has(dateKey)) {
            this.dailyVoiceUsers.set(dateKey, new Set());
        }
        this.dailyVoiceUsers.get(dateKey)!.add(userId);
    }

    async recordVoiceLeave(guildId: string, channelId: string, userId: string): Promise<void> {
        const key = `${guildId}_${userId}`;
        const session = this.voiceSessions.get(key);
        if (!session) return;

        const minutes = (Date.now() - session.joinTime) / 60000;
        this.voiceSessions.delete(key);

        if (minutes > 0) {
            await this.recordVoiceMinutes(guildId, channelId, minutes, new Set([userId]));
        }
    }

    async recordVoiceMinutes(guildId: string, channelId: string, minutes: number, userIds: Set<string>): Promise<void> {
        const config = await this.ensuredConfig(guildId);
        if (!config.enabled || !config.track_voice) return;

        const rounded = Math.round(minutes);
        if (rounded <= 0) return;

        await this.upsertGuildStats(guildId, { voice_minutes: rounded });

        if (config.track_per_channel_voice) {
            const date = today();
            const id = `${guildId}_${channelId}_${date}`;
            const repo = this.repo(VoiceChannelDailyStats);
            const existing = await repo.findOne({ id });

            if (existing) {
                await repo.update({ id }, {
                    total_minutes: existing.total_minutes + rounded,
                    unique_users: existing.unique_users + userIds.size,
                });
            } else {
                await repo.insert({
                    id,
                    guild_id: guildId,
                    channel_id: channelId,
                    date,
                    total_minutes: rounded,
                    unique_users: userIds.size,
                });
            }
        }
    }

    async recordCommand(payload: CommandExecutedPayload): Promise<void> {
        const config = await this.ensuredConfig(payload.guildId);
        if (!config.enabled || !config.track_commands) return;

        await this.upsertGuildStats(payload.guildId, { command_count: 1 });

        const date = today();
        const id = `${payload.guildId}_${payload.commandName}_${Date.now()}`;
        const repo = this.repo(CommandExecuted);

        await repo.insert({
            id,
            guild_id: payload.guildId,
            command_name: payload.commandName,
            type: payload.type,
            execution_time_ms: payload.executionTimeMs,
            error: !payload.success,
            executed_at: date,
        });
    }

    async recordMemberCount(guildId: string, memberCount: number): Promise<void> {
        const config = await this.ensuredConfig(guildId);
        if (!config.enabled || !config.track_members) return;

        const date = today();
        const id = `${guildId}_${date}`;
        const repo = this.repo(GuildDailyStats);
        const existing = await repo.findOne({ id });

        if (existing) {
            await repo.update({ id }, { member_count: memberCount });
        } else {
            await repo.insert({
                id,
                guild_id: guildId,
                date,
                message_count: 0,
                join_count: 0,
                leave_count: 0,
                voice_minutes: 0,
                command_count: 0,
                member_count: memberCount,
            });
        }
    }

    // ── Upsert helper ────────────────────────────────────────────

    private async upsertGuildStats(guildId: string, increments: Partial<GuildDailyStats>): Promise<void> {
        const date = today();
        const id = `${guildId}_${date}`;
        const repo = this.repo(GuildDailyStats);
        const existing = await repo.findOne({ id });

        if (existing) {
            const updates: any = {};
            for (const [key, val] of Object.entries(increments)) {
                updates[key] = (existing[key as keyof GuildDailyStats] as number) + (val as number);
            }
            await repo.update({ id }, updates);
        } else {
            await repo.insert({
                id,
                guild_id: guildId,
                date,
                message_count: increments.message_count || 0,
                join_count: increments.join_count || 0,
                leave_count: increments.leave_count || 0,
                voice_minutes: increments.voice_minutes || 0,
                command_count: increments.command_count || 0,
                member_count: increments.member_count || 0,
            });
        }
    }

    // ── Stats retrieval (public API) ─────────────────────────────

    async getGuildStats(guildId: string, daysBack: number): Promise<GuildDailyStats[]> {
        const repo = this.repo(GuildDailyStats);
        const dateMin = this.dateDaysAgo(daysBack);
        return repo.query()
            .where('guild_id', 'eq', guildId)
            .where('date', 'gte', dateMin)
            .sort('date', 'asc')
            .exec() as Promise<GuildDailyStats[]>;
    }

    async getGlobalStatsSummary(daysBack: number): Promise<{
        totalGuilds: number;
        totalMessages: number;
        totalCommands: number;
        totalVoiceMinutes: number;
        totalJoins: number;
        totalLeaves: number;
    }> {
        const repo = this.repo(GuildDailyStats);
        const dateMin = this.dateDaysAgo(daysBack);
        const rows = await repo.query()
            .where('date', 'gte', dateMin)
            .exec() as GuildDailyStats[];

        const guildIds = new Set<string>();
        let messages = 0, commands = 0, voice = 0, joins = 0, leaves = 0;
        for (const row of rows) {
            guildIds.add(row.guild_id);
            messages += row.message_count;
            commands += row.command_count;
            voice += row.voice_minutes;
            joins += row.join_count;
            leaves += row.leave_count;
        }
        return {
            totalGuilds: guildIds.size,
            totalMessages: messages,
            totalCommands: commands,
            totalVoiceMinutes: voice,
            totalJoins: joins,
            totalLeaves: leaves,
        };
    }

    async getGuildGrowth(daysBack: number): Promise<{ date: string; guildCount: number }[]> {
        const repo = this.repo(GuildDailyStats);
        const dateMin = this.dateDaysAgo(daysBack);
        const rows = await repo.query()
            .where('date', 'gte', dateMin)
            .sort('date', 'asc')
            .exec() as GuildDailyStats[];

        const byDate = new Map<string, Set<string>>();
        for (const row of rows) {
            if (!byDate.has(row.date)) byDate.set(row.date, new Set());
            byDate.get(row.date)!.add(row.guild_id);
        }
        return Array.from(byDate.entries())
            .map(([date, guilds]) => ({ date, guildCount: guilds.size }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    async getMessagesPerDay(daysBack: number): Promise<{ date: string; count: number }[]> {
        const repo = this.repo(GuildDailyStats);
        const dateMin = this.dateDaysAgo(daysBack);
        const rows = await repo.query()
            .where('date', 'gte', dateMin)
            .sort('date', 'asc')
            .exec() as GuildDailyStats[];

        const byDate = new Map<string, number>();
        for (const row of rows) {
            byDate.set(row.date, (byDate.get(row.date) || 0) + row.message_count);
        }
        return Array.from(byDate.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    private async getCommandExecutedRows(guildId: string | null, daysBack: number): Promise<CommandExecuted[]> {
        const repo = this.repo(CommandExecuted);
        const dateMin = this.dateDaysAgo(daysBack);
        let rows = await repo.query()
            .where('executed_at', 'gte', dateMin)
            .exec() as CommandExecuted[];
        if (guildId) {
            rows = rows.filter(r => r.guild_id === guildId);
        }
        return rows;
    }

    private async getCommandDailyStatsRows(guildId: string | null, daysBack: number): Promise<CommandDailyStats[]> {
        const repo = this.repo(CommandDailyStats);
        const dateMin = this.dateDaysAgo(daysBack);
        let rows = await repo.query()
            .where('date', 'gte', dateMin)
            .exec() as CommandDailyStats[];
        if (guildId) {
            rows = rows.filter(r => r.guild_id === guildId);
        }
        return rows;
    }

    async getCommandsPerDay(guildId: string | null, daysBack: number): Promise<{ date: string; count: number }[]> {
        const newRows = await this.getCommandExecutedRows(guildId, daysBack);
        const oldRows = await this.getCommandDailyStatsRows(guildId, daysBack);

        const byDate = new Map<string, number>();
        for (const row of newRows) {
            byDate.set(row.executed_at, (byDate.get(row.executed_at) || 0) + 1);
        }
        for (const row of oldRows) {
            byDate.set(row.date, (byDate.get(row.date) || 0) + row.usage_count);
        }
        return Array.from(byDate.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    async getCommandsPerDayByType(guildId: string | null, daysBack: number): Promise<{ date: string; slash: number; prefix: number }[]> {
        const newRows = await this.getCommandExecutedRows(guildId, daysBack);
        const oldRows = await this.getCommandDailyStatsRows(guildId, daysBack);

        const byDate = new Map<string, { slash: number; prefix: number }>();
        for (const row of newRows) {
            const entry = byDate.get(row.executed_at) || { slash: 0, prefix: 0 };
            if (row.type === 'slash') entry.slash += 1;
            else entry.prefix += 1;
            byDate.set(row.executed_at, entry);
        }
        for (const row of oldRows) {
            const entry = byDate.get(row.date) || { slash: 0, prefix: 0 };
            entry.prefix += row.usage_count;
            byDate.set(row.date, entry);
        }
        return Array.from(byDate.entries())
            .map(([date, counts]) => ({ date, ...counts }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    async getCommandsByType(guildId: string | null, daysBack: number): Promise<{ slash: number; prefix: number }> {
        const newRows = await this.getCommandExecutedRows(guildId, daysBack);
        const oldRows = await this.getCommandDailyStatsRows(guildId, daysBack);

        let slash = 0;
        let prefix = 0;
        for (const row of newRows) {
            if (row.type === 'slash') slash++;
            else prefix++;
        }
        for (const row of oldRows) {
            prefix += row.usage_count;
        }
        return { slash, prefix };
    }

    async getTopCommands(guildId: string | null, daysBack: number, limit: number = 10): Promise<{ command_name: string; usage_count: number }[]> {
        const newRows = await this.getCommandExecutedRows(guildId, daysBack);
        const oldRows = await this.getCommandDailyStatsRows(guildId, daysBack);

        const aggregated = new Map<string, number>();
        for (const row of newRows) {
            aggregated.set(row.command_name, (aggregated.get(row.command_name) || 0) + 1);
        }
        for (const row of oldRows) {
            aggregated.set(row.command_name, (aggregated.get(row.command_name) || 0) + row.usage_count);
        }
        return Array.from(aggregated.entries())
            .map(([command_name, usage_count]) => ({ command_name, usage_count }))
            .sort((a, b) => b.usage_count - a.usage_count)
            .slice(0, limit);
    }

    async getSlowestCommands(guildId: string | null, daysBack: number, limit: number = 10): Promise<{ command_name: string; avgExecutionTimeMs: number; total_executions: number }[]> {
        const newRows = await this.getCommandExecutedRows(guildId, daysBack);
        const oldRows = await this.getCommandDailyStatsRows(guildId, daysBack);

        const aggregated = new Map<string, { totalTime: number; count: number }>();
        for (const row of newRows) {
            const existing = aggregated.get(row.command_name);
            if (existing) {
                existing.totalTime += row.execution_time_ms;
                existing.count += 1;
            } else {
                aggregated.set(row.command_name, { totalTime: row.execution_time_ms, count: 1 });
            }
        }
        for (const row of oldRows) {
            const existing = aggregated.get(row.command_name);
            if (existing) {
                existing.totalTime += row.total_execution_time_ms;
                existing.count += row.usage_count;
            } else {
                aggregated.set(row.command_name, { totalTime: row.total_execution_time_ms, count: row.usage_count });
            }
        }
        return Array.from(aggregated.entries())
            .map(([command_name, data]) => ({
                command_name,
                avgExecutionTimeMs: data.count > 0 ? Math.round(data.totalTime / data.count) : 0,
                total_executions: data.count,
            }))
            .sort((a, b) => b.avgExecutionTimeMs - a.avgExecutionTimeMs)
            .slice(0, limit);
    }

    async getVoiceChannelStats(guildId: string, daysBack: number): Promise<VoiceChannelDailyStats[]> {
        const repo = this.repo(VoiceChannelDailyStats);
        const dateMin = this.dateDaysAgo(daysBack);
        return repo.query()
            .where('guild_id', 'eq', guildId)
            .where('date', 'gte', dateMin)
            .sort('date', 'asc')
            .exec() as Promise<VoiceChannelDailyStats[]>;
    }

    async getChannelMessageStats(guildId: string, daysBack: number): Promise<ChannelMessageStats[]> {
        const repo = this.repo(ChannelMessageStats);
        const dateMin = this.dateDaysAgo(daysBack);
        return repo.query()
            .where('guild_id', 'eq', guildId)
            .where('date', 'gte', dateMin)
            .sort('date', 'asc')
            .exec() as Promise<ChannelMessageStats[]>;
    }

    // ── Config ───────────────────────────────────────────────────

    async getConfig(guildId: string): Promise<GuildAnalyticsConfig> {
        return this.ensuredConfig(guildId);
    }

    async updateConfig(guildId: string, partial: Partial<GuildAnalyticsConfig>): Promise<void> {
        const repo = this.repo(GuildAnalyticsConfig);
        const existing = await repo.findOne({ guild_id: guildId });
        if (existing) {
            await repo.update({ guild_id: guildId }, partial);
        } else {
            await this.ensuredConfig(guildId);
            await repo.update({ guild_id: guildId }, partial);
        }
    }

    // ── Cleanup ──────────────────────────────────────────────────

    async runCleanup(): Promise<void> {
        const configRepo = this.repo(GuildAnalyticsConfig);

        const allConfigs = await configRepo.find();
        const guildRetention = new Map<string, number>();

        for (const c of allConfigs) {
            guildRetention.set(c.guild_id, c.retention_days || AnalyticsModuleConfig.defaultRetentionDays);
        }

        const statsRepo = this.repo(GuildDailyStats);
        const allStats = await statsRepo.find();
        const seenGuilds = new Set<string>();
        for (const s of allStats) {
            seenGuilds.add(s.guild_id);
        }

        for (const guildId of seenGuilds) {
            const retentionDays = guildRetention.get(guildId) || AnalyticsModuleConfig.defaultRetentionDays;
            const cutoffDate = this.dateDaysAgo(retentionDays);

            const oldStats = await statsRepo.query()
                .where('guild_id', 'eq', guildId)
                .where('date', 'lt', cutoffDate)
                .exec() as GuildDailyStats[];

            for (const stat of oldStats) {
                await statsRepo.delete({ id: stat.id });
            }

            const cmdRepo = this.repo(CommandDailyStats);
            const oldCmds = await cmdRepo.query()
                .where('guild_id', 'eq', guildId)
                .where('date', 'lt', cutoffDate)
                .exec() as CommandDailyStats[];

            for (const cmd of oldCmds) {
                await cmdRepo.delete({ id: cmd.id });
            }

            const cmdExRepo = this.repo(CommandExecuted);
            const oldExecs = await cmdExRepo.query()
                .where('guild_id', 'eq', guildId)
                .where('executed_at', 'lt', cutoffDate)
                .exec() as CommandExecuted[];

            for (const exec of oldExecs) {
                await cmdExRepo.delete({ id: exec.id });
            }

            const voiceRepo = this.repo(VoiceChannelDailyStats);
            const oldVoice = await voiceRepo.query()
                .where('guild_id', 'eq', guildId)
                .where('date', 'lt', cutoffDate)
                .exec() as VoiceChannelDailyStats[];

            for (const vc of oldVoice) {
                await voiceRepo.delete({ id: vc.id });
            }
        }
    }

    startCleanupScheduler(): void {
        if (this.cleanupTimer) return;
        const intervalMs = AnalyticsModuleConfig.cleanupIntervalHours * 60 * 60 * 1000;
        this.cleanupTimer = setInterval(() => {
            this.runCleanup().catch(err => console.error('[Analytics] Cleanup error:', err));
        }, intervalMs);
    }

    stopCleanupScheduler(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }

    clearVoiceSessions(): void {
        this.voiceSessions.clear();
    }

    // ── Helpers ──────────────────────────────────────────────────

    private dateDaysAgo(days: number): string {
        const d = new Date();
        d.setDate(d.getDate() - days);
        return d.toISOString().slice(0, 10);
    }
}
