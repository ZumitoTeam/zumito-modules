import { Collection, Field } from 'zumito-framework';

@Collection({ name: 'analytics_guild_daily_stats' })
export class GuildDailyStats {
    @Field({ type: 'string', primary: true, unique: true })
    id!: string;

    @Field({ type: 'string' })
    guild_id!: string;

    @Field({ type: 'string' })
    date!: string;

    @Field({ type: 'number', default: 0 })
    message_count!: number;

    @Field({ type: 'number', default: 0 })
    join_count!: number;

    @Field({ type: 'number', default: 0 })
    leave_count!: number;

    @Field({ type: 'number', default: 0 })
    voice_minutes!: number;

    @Field({ type: 'number', default: 0 })
    command_count!: number;

    @Field({ type: 'number', default: 0 })
    member_count!: number;
}
