type BaseLogData = {
    context: 'bot' | 'other',
    title: string,
    description: string,
}

type GuildLogData = Omit<BaseLogData, 'context'> & {
    context: 'guild',
    guildId: string,
    channelId: string,
};

type DmLogData = Omit<BaseLogData, 'context'> & {
    context: 'dm',
    channelId: string,
};

export type LogData = GuildLogData | DmLogData | BaseLogData;