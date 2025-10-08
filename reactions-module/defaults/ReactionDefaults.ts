export type TranslationMap = Record<string, string>;

export interface ReactionImageDefault {
    url: string;
    source: string;
    description?: TranslationMap;
}

export interface ReactionCategoryDefault {
    key: string;
    order: number;
    displayName: TranslationMap;
    mentionTemplate: TranslationMap;
    simpleTemplate: TranslationMap;
    images: ReactionImageDefault[];
}

export const DEFAULT_REACTION_CATEGORIES: ReactionCategoryDefault[] = [
    {
        key: 'kiss',
        order: 1,
        displayName: {
            es: 'Beso',
            en: 'Kiss',
        },
        mentionTemplate: {
            es: '%user% besó a %user2%',
            en: '%user% kissed %user2%',
        },
        simpleTemplate: {
            es: '%user% quiere besarse consigo mismo',
            en: '%user% wants to kiss themselves',
        },
        images: [
            {
                url: 'https://cdn.nekotina.com/images/Y9x6ayCJl.gif',
                source: 'Anime desconocido',
            },
        ],
    },
    {
        key: 'angry',
        order: 2,
        displayName: {
            es: 'Enojado',
            en: 'Angry',
        },
        mentionTemplate: {
            es: '%user% se enojó con %user2%',
            en: '%user% got angry with %user2%',
        },
        simpleTemplate: {
            es: '%user% está enojado',
            en: '%user% is angry',
        },
        images: [
            {
                url: 'https://cdn.nekotina.com/images/vf7aXW3B.gif',
                source: 'Anime desconocido',
            },
        ],
    },
    {
        key: 'happy',
        order: 3,
        displayName: {
            es: 'Feliz',
            en: 'Happy',
        },
        mentionTemplate: {
            es: '%user% se alegró con %user2%',
            en: '%user% got happy with %user2%',
        },
        simpleTemplate: {
            es: '%user% está feliz',
            en: '%user% is happy',
        },
        images: [
            {
                url: 'https://cdn.nekotina.com/images/9lNrBcYZ.gif',
                source: 'Anime desconocido',
            },
        ],
    },
];
