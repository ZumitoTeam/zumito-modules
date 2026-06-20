import { Collection, Field } from 'zumito-framework';

@Collection({ name: 'analytics_channel_message_stats' })
export class ChannelMessageStats {
    @Field({ type: 'string', primary: true, unique: true })
    id!: string;

    @Field({ type: 'string' })
    guild_id!: string;

    @Field({ type: 'string' })
    channel_id!: string;

    @Field({ type: 'string' })
    date!: string;

    @Field({ type: 'number', default: 0 })
    message_count!: number;

    @Field({ type: 'number', default: 0 })
    unique_authors!: number;
}
