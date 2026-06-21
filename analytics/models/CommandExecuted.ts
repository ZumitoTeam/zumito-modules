import { Collection, Field } from 'zumito-framework';

@Collection({ name: 'analytics_commands_executed' })
export class CommandExecuted {
    @Field({ type: 'string', primary: true, unique: true })
    id!: string;

    @Field({ type: 'string' })
    guild_id!: string;

    @Field({ type: 'string' })
    command_name!: string;

    @Field({ type: 'string' })
    type!: 'slash' | 'prefix';

    @Field({ type: 'number', default: 0 })
    execution_time_ms!: number;

    @Field({ type: 'boolean', default: false })
    error!: boolean;

    @Field({ type: 'string' })
    executed_at!: string;
}
