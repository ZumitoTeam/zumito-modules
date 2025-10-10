import {
    Command,
    CommandArgDefinition,
    CommandChoiceDefinition,
    CommandParameters,
    CommandType,
    ServiceContainer,
} from 'zumito-framework';
import {
    EmbedBuilder,
    GuildMember,
    MessageFlags,
    User,
} from 'zumito-framework/discord';
import { ReactionService } from '../services/ReactionService';

const DEFAULT_EMBED_COLOR = 0x5865f2;

export class Reaction extends Command {
    type = CommandType.any;
    args: CommandArgDefinition[] = [
        {
            name: 'category',
            type: 'string',
            optional: false,
        },
        {
            name: 'member',
            type: 'user',
            optional: true,
        },
    ];

    private readonly reactionService: ReactionService;

    constructor(
        reactionService: ReactionService = ServiceContainer.getService(ReactionService),
    ) {
        super();
        this.reactionService = reactionService;
    }

    async execute({ interaction, message, args, guildSettings, trans }: CommandParameters): Promise<void> {
        const respondingInteraction = interaction ?? null;
        const respondingMessage = message ?? null;

        const author = respondingInteraction?.user ?? respondingMessage?.author;
        if (!author) {
            return;
        }

        const categoryArg = args.get('category');
        const categoryKey = typeof categoryArg === 'string' ? categoryArg.trim() : categoryArg?.toString().trim();
        if (!categoryKey) {
            await this.sendReply(respondingInteraction, respondingMessage, {
                content: trans('reaction.errors.categoryRequired'),
            }, true);
            return;
        }

        const category = await this.reactionService.getCategory(categoryKey);
        if (!category) {
            await this.sendReply(respondingInteraction, respondingMessage, {
                content: trans('reaction.errors.notFound', { category: categoryKey }),
            }, true);
            return;
        }

        const locale = this.resolveLocale(guildSettings);
        const targetArg = args.get('member');
        const targetUser = this.resolveUserArgument(targetArg);
        const isSelfTarget = !targetUser || targetUser.id === author.id;

        const templateSource = isSelfTarget ? category.simpleTemplate : category.mentionTemplate;
        const template = this.reactionService.getTemplateForLocale(templateSource, locale)
            ?? this.reactionService.getTemplateForLocale(templateSource, 'en');

        if (!template) {
            await this.sendReply(respondingInteraction, respondingMessage, {
                content: trans('reaction.errors.noTemplate', { category: categoryKey }),
            }, true);
            return;
        }

        const randomImage = await this.reactionService.getRandomImage(category.key);
        if (!randomImage) {
            await this.sendReply(respondingInteraction, respondingMessage, {
                content: trans('reaction.errors.noImage', { category: categoryKey }),
            }, true);
            return;
        }

        const displayName =
            this.reactionService.getTemplateForLocale(category.displayName, locale) ??
            this.reactionService.getTemplateForLocale(category.displayName, 'en') ??
            category.key;

        const description = this.applyTemplate(
            template,
            author,
            isSelfTarget ? undefined : targetUser,
        );

        const imageDescription = randomImage.description
            ? this.reactionService.getTemplateForLocale(randomImage.description, locale)
                ?? this.reactionService.getTemplateForLocale(randomImage.description, 'en')
            : undefined;

        const embed = new EmbedBuilder()
            .setColor(DEFAULT_EMBED_COLOR)
            .setTitle(displayName)
            .setDescription(imageDescription ? `${description}\n\n*${imageDescription}*` : description)
            .setImage(randomImage.url)
            .setTimestamp(new Date())
            .setFooter({
                text: trans('reaction.success.footer', { source: randomImage.source }),
            })
            .setAuthor({
                name: author.displayName ?? author.tag ?? author.username ?? author.id,
                iconURL: author.displayAvatarURL({ size: 128 }),
            });

        const allowedMentions = this.getAllowedMentions(author, targetUser, isSelfTarget);

        await this.sendReply(respondingInteraction, respondingMessage, {
            embeds: [embed],
            allowedMentions,
        });
    }

    private resolveLocale(guildSettings?: any): string {
        if (!guildSettings) {
            return 'en';
        }
        return guildSettings.lang ?? guildSettings.language ?? guildSettings.locale ?? 'en';
    }

    private resolveUserArgument(arg: unknown): User | null {
        if (!arg) {
            return null;
        }

        if (arg instanceof User) {
            return arg;
        }

        if (arg instanceof GuildMember) {
            return arg.user as User;
        }

        if (typeof arg === 'object' && arg !== null) {
            if ('user' in arg && (arg as GuildMember).user) {
                return (arg as GuildMember).user as User;
            }
            if ('id' in arg && typeof (arg as User).id === 'string' && 'username' in arg) {
                return arg as User;
            }
        }

        return null;
    }

    private applyTemplate(template: string, author: User, target?: User): string {
        const authorMention = `<@${author.id}>`;
        const targetMention = target ? `<@${target.id}>` : '';

        return template
            .replace(/%user%/g, authorMention)
            .replace(/%user2%/g, targetMention || authorMention);
    }

    private getAllowedMentions(author: User, target: User | null, isSelfTarget: boolean) {
        const users = new Set<string>([author.id]);
        if (target && !isSelfTarget) {
            users.add(target.id);
        }
        return {
            users: Array.from(users),
            repliedUser: false,
        };
    }

    private async sendReply(
        interaction: CommandParameters['interaction'],
        message: CommandParameters['message'],
        payload: any,
        ephemeral = false,
    ): Promise<void> {
        if (interaction) {
            const data = ephemeral
                ? { ...payload, flags: MessageFlags.Ephemeral }
                : payload;

            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(data);
            } else {
                await interaction.reply(data);
            }
            return;
        }

        if (message) {
            await message.reply({
                ...payload,
                allowedMentions: {
                    repliedUser: false,
                    ...(payload?.allowedMentions ?? {}),
                },
            });
        }
    }
}
