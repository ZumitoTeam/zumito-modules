import { Collection, Field } from 'zumito-framework';

@Collection({ name: 'analytics_command_daily_stats' })
export class CommandDailyStats {
    @Field({ type: 'string', primary: true, unique: true })
    id!: string;

    @Field({ type: 'string' })
    guild_id!: string;

    @Field({ type: 'string' })
    command_name!: string;

    @Field({ type: 'string' })
    date!: string;

    @Field({ type: 'number', default: 0 })
    usage_count!: number;

    @Field({ type: 'number', default: 0 })
    total_execution_time_ms!: number;

    @Field({ type: 'number', default: 0 })
    error_count!: number;
}
