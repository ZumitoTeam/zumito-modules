import { GuildDataGetter, ServiceContainer, ZumitoFramework } from "zumito-framework";
import { LogData } from "../definitions/LogData";
import { Channel, Client, EmbedBuilder, Guild, GuildBasedChannel, GuildTextBasedChannel } from 'zumito-framework/discord';

export class LogManager {
    
    client: Client;
    framework: ZumitoFramework;

    constructor(client: Client, framework: ZumitoFramework) {
        this.client = client;
        this.framework = framework;
    }

    async log(data: LogData) {
        let guild: Guild | undefined;
        let channel;
        let logChannel;
        if (data.context == "guild") {
            guild = this.client.guilds.cache.find(guild => guild.id == data.guildId);
            if (guild) {
                const guildDataGetter = ServiceContainer.getService(GuildDataGetter) as GuildDataGetter;
                const guildSettings: any = guildDataGetter.getGuildSettings(guild.id);
                if (guildSettings.logChannel) {
                    logChannel = guild?.channels.cache.find(channel => channel.id == data.channelId);
                }
            }
        }
        if (logChannel) {
            await this.logToChannel(logChannel, data);
        }
        const Logs = this.framework.database.models.Logs;
        let log = new Logs({
            title: data.title,
            description: data.description,
            created_at: new Date(),
        });
        await new Promise((resolve, reject) => {
            log.save((err) => {
                if (err) reject(err);
                resolve(guild);
            });
        })

    }

    async logToChannel(channel: GuildTextBasedChannel, log: LogData) {
        const logEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(log.title)
            .setDescription(log.description)
            .setTimestamp()
        
        await channel.send({
            embeds: [logEmbed]
        })
    }

}