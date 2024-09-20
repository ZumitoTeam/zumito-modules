import { DatabaseModel } from 'zumito-framework';

export class Guild extends DatabaseModel {
    getModel(schema: any) {
        return {
            title: {
                type: schema.String,
                required: true,
            },
            description: {
                type: schema.String,
                required: true,
            },
            createdAt: {
                type: schema.Date,
                required: true,
            }
        };
    }

    define(model: any, models: any): void {
        // Register model validations, relationships and methods.
    }
}
