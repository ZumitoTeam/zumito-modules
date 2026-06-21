import { Collection, Field } from 'zumito-framework';

@Collection({ name: 'analytics_guild_config' })
export class GuildAnalyticsConfig {
    @Field({ type: 'string', primary: true, unique: true })
    guild_id!: string;

    @Field({ type: 'boolean', default: true })
    enabled!: boolean;

    @Field({ type: 'boolean', default: true })
    track_messages!: boolean;

    @Field({ type: 'boolean', default: true })
    track_voice!: boolean;

    @Field({ type: 'boolean', default: true })
    track_members!: boolean;

    @Field({ type: 'boolean', default: true })
    track_commands!: boolean;

    @Field({ type: 'boolean', default: false })
    track_command_performance!: boolean;

    @Field({ type: 'boolean', default: false })
    track_per_channel_voice!: boolean;

    @Field({ type: 'boolean', default: false })
    track_per_channel_messages!: boolean;

    @Field({ type: 'number' })
    retention_days!: number;

    @Field({ type: 'boolean', default: false })
    public_stats_page!: boolean;
}
