# Analytics Module

**`@zumito-team/analytics-module`** provides configurable server analytics for your Zumito bot. Tracks messages, members, voice activity, and command usage with per-guild granularity. Includes optional web dashboard pages with Chart.js for both the admin and user panels.

## Installation

```bash
npm install @zumito-team/analytics-module
```

Add to your `zumito.config.ts`:

```ts
{
    path: path.join(__dirname, "node_modules", "@zumito-team", "analytics-module"),
}
```

## What it provides

### AnalyticsCollector service

Available via `ServiceContainer.getService(AnalyticsCollector)`. Other modules can query analytics data.

| Method | Description |
|---|---|
| `recordMessage(guildId)` | Track a message sent in a guild |
| `recordMemberJoin(guildId)` | Track a member joining |
| `recordMemberLeave(guildId)` | Track a member leaving |
| `recordVoiceJoin(guildId, channelId, userId)` | Track voice channel join |
| `recordVoiceLeave(guildId, channelId, userId)` | Track voice channel leave (auto-calculates duration) |
| `recordCommand(payload)` | Track a command execution (success/failure + execution time) |
| `recordMemberCount(guildId, count)` | Store current member count snapshot |
| `getGuildStats(guildId, daysBack)` | Get daily stats for a guild |
| `getGlobalStatsSummary(daysBack)` | Get aggregated global stats |
| `getGuildGrowth(daysBack)` | Get active guilds per day |
| `getMessagesPerDay(daysBack)` | Get messages per day (global) |
| `getCommandsPerDay(guildId, daysBack)` | Get commands per day |
| `getTopCommands(guildId, daysBack, limit)` | Get most used commands |
| `getSlowestCommands(guildId, daysBack, limit)` | Get commands sorted by avg execution time |
| `getVoiceChannelStats(guildId, daysBack)` | Get per-channel voice stats |
| `getConfig(guildId)` | Get guild analytics configuration |
| `updateConfig(guildId, partial)` | Update guild analytics configuration |
| `runCleanup()` | Run data retention cleanup manually |
| `startCleanupScheduler()` | Start automatic cleanup scheduler |
| `stopCleanupScheduler()` | Stop automatic cleanup scheduler |
| `clearVoiceSessions()` | Clear in-memory voice session tracking |

### Events tracked

| Event | Source | Description |
|---|---|---|
| `messageCreate` | discord | Message count per guild |
| `guildMemberAdd` | discord | Join count + member snapshot |
| `guildMemberRemove` | discord | Leave count + member snapshot |
| `voiceStateUpdate` | discord | Voice activity (minutes) per guild/channel |
| `commandExecuted` | framework | Command usage + execution time |

### Commands

| Command | Type | Description |
|---|---|---|
| `/stats` | Slash + Prefix | Shows server stats embed (last 7 days) |
| `/analytics-config` | Slash + Prefix (admin-only) | View/toggle analytics settings per guild |

### Admin Panel

- **`/admin/analytics`** — Global bot statistics: guild growth, messages/day, commands/day, top commands, slowest commands
- Date range selector: 7 / 30 / 90 days
- Chart.js visualizations (line, bar, horizontal bar charts)

### User Panel

- **`/panel/:guildId/analytics`** — Per-server statistics: messages, joins/leaves, voice activity, commands, top commands
- If `track_command_performance` enabled: slowest commands chart
- If `track_per_channel_voice` enabled: per-channel voice breakdown
- Date range selector: 7 / 30 / 90 days

## Configuration

### Global defaults

Import and configure global defaults before the module initializes:

```ts
import { AnalyticsModuleConfig } from '@zumito-team/analytics-module';

AnalyticsModuleConfig.configure({
    defaultRetentionDays: 90,
    cleanupIntervalHours: 24,
    defaultTrackMessages: true,
    defaultTrackVoice: true,
    defaultTrackMembers: true,
    defaultTrackCommands: true,
    defaultTrackCommandPerformance: false,
    defaultTrackPerChannelVoice: false,
});
```

| Setting | Default | Description |
|---|---|---|
| `defaultRetentionDays` | `90` | Days to keep data before auto-deletion |
| `cleanupIntervalHours` | `24` | How often cleanup runs |
| `defaultTrackMessages` | `true` | Track messages by default |
| `defaultTrackVoice` | `true` | Track voice activity by default |
| `defaultTrackMembers` | `true` | Track joins/leaves by default |
| `defaultTrackCommands` | `true` | Track command usage by default |
| `defaultTrackCommandPerformance` | `false` | Track execution time per command |
| `defaultTrackPerChannelVoice` | `false` | Track per-channel voice stats |

### Per-guild configuration

Use `/analytics-config` or the public API:

```ts
const collector = ServiceContainer.getService(AnalyticsCollector);
await collector.updateConfig(guildId, {
    enabled: true,
    track_commands: true,
    track_command_performance: true,  // enable execution time tracking
    retention_days: 180,              // 6 months for premium
});
```

Per-guild DB fields:

| Field | Type | Default |
|---|---|---|
| `guild_id` | `string` | Primary key |
| `enabled` | `boolean` | `true` |
| `track_messages` | `boolean` | `true` |
| `track_voice` | `boolean` | `true` |
| `track_members` | `boolean` | `true` |
| `track_commands` | `boolean` | `true` |
| `track_command_performance` | `boolean` | `false` |
| `track_per_channel_voice` | `boolean` | `false` |
| `retention_days` | `number` | Globally configured default (90) |
| `public_stats_page` | `boolean` | `false` |

## Extending

### Consuming AnalyticsCollector in other modules

```ts
import { AnalyticsCollector, type CommandExecutedPayload } from '@zumito-team/analytics-module';
import { ServiceContainer } from 'zumito-framework';

const collector = ServiceContainer.getService(AnalyticsCollector) as AnalyticsCollector;

// Query stats
const stats = await collector.getGuildStats(guildId, 30);

// Get top commands
const top = await collector.getTopCommands(null, 7, 5);

// Get global summary
const summary = await collector.getGlobalStatsSummary(7);
```

### Tracking custom events

```ts
// Track custom event as a message
await collector.recordMessage(guildId);

// Track a custom metric directly via DB
const db = ServiceContainer.getService(DatabaseManager);
const repo = db.getRepository(GuildDailyStats);
await repo.insert({ id: `${guildId}_${today()}`, guild_id: guildId, date: today(), message_count: 1 });
```

### Premium integration

Set a higher retention for premium guilds:

```ts
// In your premium module
await collector.updateConfig(guildId, { retention_days: 180 });
```

## Data models

### GuildDailyStats

Per-guild daily aggregate: `id` = `{guild_id}_{date}`

| Field | Type |
|---|---|
| `id` | `string` (PK) |
| `guild_id` | `string` |
| `date` | `string` (YYYY-MM-DD) |
| `message_count` | `number` |
| `join_count` | `number` |
| `leave_count` | `number` |
| `voice_minutes` | `number` |
| `command_count` | `number` |
| `member_count` | `number` |

### CommandDailyStats

Per-command daily stats: `id` = `{guild_id}_{command_name}_{date}`

| Field | Type |
|---|---|
| `id` | `string` (PK) |
| `guild_id` | `string` |
| `command_name` | `string` |
| `date` | `string` (YYYY-MM-DD) |
| `usage_count` | `number` |
| `total_execution_time_ms` | `number` |
| `error_count` | `number` |

### VoiceChannelDailyStats

Per-channel voice stats: `id` = `{guild_id}_{channel_id}_{date}`

| Field | Type |
|---|---|
| `id` | `string` (PK) |
| `guild_id` | `string` |
| `channel_id` | `string` |
| `date` | `string` (YYYY-MM-DD) |
| `total_minutes` | `number` |
| `unique_users` | `number` |

## Dependencies

- `zumito-framework`
- `ejs` — Template rendering
- `@zumito-team/admin-module` — Optional admin panel integration
- `@zumito-team/user-panel-module` — Optional user panel integration

## Related modules

- [**Admin Module**](/guides/modules/admin) — Panel where global bot stats appear
- [**User Panel**](/guides/modules/user-panel) — Panel where per-server stats appear
- [**Logger**](/guides/modules/logger) — Complementary event logging
