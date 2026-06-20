import { Collection, Field } from 'zumito-framework';

@Collection({ name: 'analytics_voice_channel_daily_stats' })
export class VoiceChannelDailyStats {
    @Field({ type: 'string', primary: true, unique: true })
    id!: string;

    @Field({ type: 'string' })
    guild_id!: string;

    @Field({ type: 'string' })
    channel_id!: string;

    @Field({ type: 'string' })
    date!: string;

    @Field({ type: 'number', default: 0 })
    total_minutes!: number;

    @Field({ type: 'number', default: 0 })
    unique_users!: number;
}
