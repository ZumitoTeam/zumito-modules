import fs from 'fs';
import path from 'path';

export interface DiscordDarkColors {
    100: string;
    200: string;
    300: string;
    400: string;
}

export interface DiscordPalette {
    primary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    foreground: string;
    dark: DiscordDarkColors;
}

const defaultPalette: DiscordPalette = {
    primary: '#5865F2',
    accent: '#EB459E',
    success: '#57F287',
    warning: '#FEE75C',
    danger: '#ED4245',
    foreground: '#FFFFFF',
    dark: {
        100: '#424549',
        200: '#36393f',
        300: '#282b30',
        400: '#1e2124'
    }
};

export class UserPanelColorsService {
    private colors: DiscordPalette = defaultPalette;

    constructor() {
        const envPath = process.env.USER_PANEL_COLORS_FILE;
        const envColors = process.env.USER_PANEL_COLORS;
        if (envColors) {
            this.loadFromString(envColors);
        } else if (envPath) {
            this.loadFromFile(envPath);
        }
    }

    loadFromFile(filePath: string) {
        try {
            const absolute = path.resolve(filePath);
            const content = fs.readFileSync(absolute, 'utf8');
            this.loadFromString(content);
        } catch {
            // ignore errors and keep defaults
        }
    }

    loadFromString(json: string) {
        try {
            const obj = JSON.parse(json);
            this.setColors(obj);
        } catch {
            // ignore invalid json
        }
    }

    setColors(colors: Partial<DiscordPalette>) {
        this.colors = {
            ...this.colors,
            ...colors,
            dark: {
                ...this.colors.dark,
                ...(colors.dark || {})
            }
        };
    }

    getColors(): DiscordPalette {
        return this.colors;
    }
}
