import { DatabaseModel } from 'zumito-framework';

export class Guild extends DatabaseModel {
    getModel(schema: any) {
        return {
            logChannel: {
                type: schema.String,
                required: false
            },
        };
    }

    define(model: any, models: any): void {
        // Register model validations, relationships and methods.
    }
}
