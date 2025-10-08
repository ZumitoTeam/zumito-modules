import { ServiceContainer, ZumitoFramework } from 'zumito-framework';
import {
    DEFAULT_REACTION_CATEGORIES,
    type ReactionCategoryDefault,
    type ReactionImageDefault,
    type TranslationMap,
} from '../defaults/ReactionDefaults';

const COLLECTION_NAME = 'reaction_categories';
const FALLBACK_LOCALE = 'en';

export interface ReactionImageInput {
    url: string;
    source: string;
    description?: TranslationMap;
}

export interface ReactionImage extends ReactionImageInput {
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ReactionCategoryInput {
    key: string;
    displayName?: TranslationMap;
    mentionTemplate: TranslationMap;
    simpleTemplate: TranslationMap;
}

export interface ReactionCategoryDocument {
    key: string;
    displayName?: TranslationMap;
    mentionTemplate?: TranslationMap;
    simpleTemplate?: TranslationMap;
    images?: ReactionImage[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ReactionCategory extends ReactionCategoryDocument {
    displayName: TranslationMap;
    mentionTemplate: TranslationMap;
    simpleTemplate: TranslationMap;
    images: ReactionImage[];
    usesDefaultImages: boolean;
    defaultImages: ReactionImageDefault[];
    defaultDisplayName?: TranslationMap;
    defaultMentionTemplate?: TranslationMap;
    defaultSimpleTemplate?: TranslationMap;
}

export class ReactionService {
    private readonly framework: ZumitoFramework;

    constructor(framework: ZumitoFramework = ServiceContainer.getService(ZumitoFramework)) {
        this.framework = framework;
    }

    private get collection(): any {
        const database = (this.framework as any)?.database;
        if (!database?.collection) {
            throw new Error('Database connection not available for ReactionService');
        }

        return database.collection(COLLECTION_NAME);
    }

    async ensureIndexes(): Promise<void> {
        try {
            await this.collection.createIndex({ key: 1 }, { unique: true });
        } catch (error) {
            console.warn('[ReactionService] Unable to ensure indexes:', error);
        }
    }

    async listCategories(): Promise<ReactionCategory[]> {
        const documents: ReactionCategoryDocument[] = await this.collection.find({}).toArray();
        const defaultMap = this.getDefaultMap();
        const merged: ReactionCategory[] = [];

        for (const defaultCategory of DEFAULT_REACTION_CATEGORIES) {
            const document = documents.find((item) => item.key === defaultCategory.key);
            merged.push(this.mergeCategory(document, defaultCategory));
        }

        for (const document of documents) {
            if (defaultMap.has(document.key)) {
                continue;
            }
            merged.push(this.mergeCategory(document, undefined));
        }

        return merged.sort((a, b) => {
            const aOrder = defaultMap.get(a.key)?.order ?? 9999;
            const bOrder = defaultMap.get(b.key)?.order ?? 9999;

            if (aOrder !== bOrder) {
                return aOrder - bOrder;
            }

            return a.key.localeCompare(b.key);
        });
    }

    async getCategory(key: string): Promise<ReactionCategory | null> {
        const normalizedKey = this.normalizeKey(key);
        if (!normalizedKey) {
            return null;
        }

        const document: ReactionCategoryDocument | null = await this.collection.findOne({ key: normalizedKey });
        const defaultCategory = this.getDefaultMap().get(normalizedKey);

        if (!document && !defaultCategory) {
            return null;
        }

        return this.mergeCategory(document ?? undefined, defaultCategory);
    }

    async upsertCategory(input: ReactionCategoryInput): Promise<ReactionCategory> {
        const key = this.normalizeKey(input?.key);
        if (!key) {
            throw new Error('Category key is required');
        }

        const displayName = this.sanitizeTranslations(input?.displayName);
        const mentionTemplate = this.sanitizeTranslations(input?.mentionTemplate);
        const simpleTemplate = this.sanitizeTranslations(input?.simpleTemplate);

        if (Object.keys(mentionTemplate).length === 0) {
            throw new Error('Mention template translations cannot be empty');
        }

        if (Object.keys(simpleTemplate).length === 0) {
            throw new Error('Simple template translations cannot be empty');
        }

        const now = new Date();
        await this.collection.updateOne(
            { key },
            {
                $set: {
                    key,
                    displayName,
                    mentionTemplate,
                    simpleTemplate,
                    updatedAt: now,
                },
                $setOnInsert: { createdAt: now },
            },
            { upsert: true },
        );

        const category = await this.getCategory(key);
        if (!category) {
            throw new Error('Failed to persist reaction category');
        }

        return category;
    }

    async deleteCategory(key: string): Promise<boolean> {
        const normalizedKey = this.normalizeKey(key);
        if (!normalizedKey) {
            return false;
        }

        const result = await this.collection.deleteOne({ key: normalizedKey });
        return result.deletedCount === 1;
    }

    async addImage(categoryKey: string, imageInput: ReactionImageInput): Promise<ReactionCategory> {
        const key = this.normalizeKey(categoryKey);
        if (!key) {
            throw new Error('Category key is required');
        }

        const existingCategory = await this.getCategory(key);
        if (!existingCategory) {
            throw new Error('Category does not exist');
        }

        const image = this.sanitizeImage(imageInput);
        const now = new Date();
        const payload: ReactionImage = {
            ...image,
            createdAt: now,
        };

        const result = await this.collection.updateOne(
            { key },
            {
                $push: { images: payload },
                $set: { updatedAt: now },
            },
        );

        if (result.matchedCount === 0 && result.upsertedCount === 0) {
            throw new Error('Unable to add image to category');
        }

        return this.getCategory(key) as Promise<ReactionCategory>;
    }

    async updateImage(
        categoryKey: string,
        imageUrl: string,
        updates: Partial<Pick<ReactionImageInput, 'source' | 'description'>>,
    ): Promise<ReactionCategory | null> {
        const key = this.normalizeKey(categoryKey);
        const url = imageUrl?.trim();

        if (!key || !url) {
            throw new Error('Category key and image URL are required');
        }

        const sanitizedUpdates: Record<string, unknown> = {};

        if (updates?.source !== undefined) {
            const source = updates.source?.trim();
            if (!source) {
                throw new Error('Image source cannot be empty');
            }
            sanitizedUpdates['images.$.source'] = source;
        }

        if (updates?.description !== undefined) {
            sanitizedUpdates['images.$.description'] = this.sanitizeTranslations(updates.description);
        }

        if (Object.keys(sanitizedUpdates).length === 0) {
            return this.getCategory(key);
        }

        sanitizedUpdates['images.$.updatedAt'] = new Date();

        const result = await this.collection.updateOne(
            { key, 'images.url': url },
            {
                $set: {
                    ...sanitizedUpdates,
                    updatedAt: new Date(),
                },
            },
        );

        if (result.matchedCount === 0) {
            throw new Error('Image not found in category');
        }

        return this.getCategory(key);
    }

    async removeImage(categoryKey: string, imageUrl: string): Promise<ReactionCategory | null> {
        const key = this.normalizeKey(categoryKey);
        const url = imageUrl?.trim();

        if (!key || !url) {
            throw new Error('Category key and image URL are required');
        }

        await this.collection.updateOne(
            { key },
            {
                $pull: { images: { url } },
                $set: { updatedAt: new Date() },
            },
        );

        return this.getCategory(key);
    }

    async getImagesForCategory(key: string): Promise<ReactionImage[]> {
        const category = await this.getCategory(key);
        if (!category) {
            return [];
        }
        return category.images ?? [];
    }

    async getRandomImage(key: string): Promise<ReactionImage | null> {
        const images = await this.getImagesForCategory(key);
        if (images.length === 0) {
            return null;
        }
        const index = Math.floor(Math.random() * images.length);
        return images[index];
    }

    getDefaultCategory(key: string): ReactionCategoryDefault | undefined {
        return this.getDefaultMap().get(this.normalizeKey(key));
    }

    getTemplateForLocale(map: TranslationMap, locale?: string, fallback: string = FALLBACK_LOCALE): string | undefined {
        if (!map || Object.keys(map).length === 0) {
            return undefined;
        }

        if (locale && map[locale]) {
            return map[locale];
        }

        if (fallback && map[fallback]) {
            return map[fallback];
        }

        const [first] = Object.values(map);
        return first;
    }

    private mergeCategory(
        document: ReactionCategoryDocument | undefined,
        defaultCategory: ReactionCategoryDefault | undefined,
    ): ReactionCategory {
        const displayName = this.mergeTranslations(defaultCategory?.displayName, document?.displayName);
        const mentionTemplate = this.mergeTranslations(defaultCategory?.mentionTemplate, document?.mentionTemplate);
        const simpleTemplate = this.mergeTranslations(defaultCategory?.simpleTemplate, document?.simpleTemplate);

        const hasAdminImages = Boolean(document?.images?.length);
        const adminImages = hasAdminImages
            ? (document?.images ?? []).map((image) => ({
                  ...image,
                  description: this.sanitizeTranslations(image.description),
              }))
            : [];

        const defaultImages = (defaultCategory?.images ?? []).map((image) => ({
            ...image,
            description: this.sanitizeTranslations(image.description),
        }));

        const images = hasAdminImages ? adminImages : defaultImages;

        return {
            key: document?.key ?? defaultCategory?.key ?? '',
            displayName,
            mentionTemplate,
            simpleTemplate,
            images,
            usesDefaultImages: !hasAdminImages && Boolean(defaultCategory),
            defaultImages,
            defaultDisplayName: defaultCategory?.displayName,
            defaultMentionTemplate: defaultCategory?.mentionTemplate,
            defaultSimpleTemplate: defaultCategory?.simpleTemplate,
            createdAt: document?.createdAt,
            updatedAt: document?.updatedAt,
        };
    }

    private mergeTranslations(
        defaultTranslations?: TranslationMap,
        overrideTranslations?: TranslationMap,
    ): TranslationMap {
        const base = this.sanitizeTranslations(defaultTranslations);
        const overrides = this.sanitizeTranslations(overrideTranslations);
        return { ...base, ...overrides };
    }

    private getDefaultMap(): Map<string, ReactionCategoryDefault> {
        return new Map(DEFAULT_REACTION_CATEGORIES.map((category) => [category.key, category]));
    }

    private sanitizeImage(input: ReactionImageInput): ReactionImageInput {
        const url = input?.url?.trim();
        const source = input?.source?.trim();

        if (!url) {
            throw new Error('Image URL is required');
        }

        if (!source) {
            throw new Error('Image source is required');
        }

        return {
            url,
            source,
            description: this.sanitizeTranslations(input?.description),
        };
    }

    private sanitizeTranslations(map?: TranslationMap): TranslationMap {
        if (!map || typeof map !== 'object') {
            return {};
        }

        const sanitized: TranslationMap = {};
        for (const [locale, value] of Object.entries(map)) {
            const trimmedLocale = locale.trim();
            const trimmedValue = typeof value === 'string' ? value.trim() : '';
            if (!trimmedLocale || !trimmedValue) {
                continue;
            }

            sanitized[trimmedLocale] = trimmedValue;
        }

        return sanitized;
    }

    private normalizeKey(key?: string): string {
        return typeof key === 'string' ? key.trim().toLowerCase() : '';
    }
}

export default ReactionService;
