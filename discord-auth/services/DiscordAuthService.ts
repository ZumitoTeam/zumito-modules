import * as jose from 'jose';

export interface DiscordAuthConfig {
    cookieName: string;
    routePrefix: string;
    loginRedirectPath: string;
    cookieHttpOnly: boolean;
    fetchFullUser: boolean;
    purpose: string;
    scope?: string;
    jwtExpirationTime?: string;
    cookieMaxAge?: number;
    cookiePath?: string;
    cookieSecure?: boolean;
    cookieSameSite?: 'lax' | 'strict' | 'none';
}

export class DiscordAuthService {
    readonly config: Required<Pick<DiscordAuthConfig, 'scope' | 'jwtExpirationTime' | 'cookieMaxAge' | 'cookiePath' | 'cookieSecure' | 'cookieSameSite'>> 
        & Omit<DiscordAuthConfig, 'scope' | 'jwtExpirationTime' | 'cookieMaxAge' | 'cookiePath' | 'cookieSecure' | 'cookieSameSite'>;

    constructor(config: DiscordAuthConfig) {
        this.config = {
            scope: 'identify',
            jwtExpirationTime: '2h',
            cookieMaxAge: 30 * 24 * 60 * 60 * 1000,
            cookiePath: '/',
            cookieSecure: false,
            cookieSameSite: 'lax',
            ...config,
        };
    }

    async isLoginValid(req: any): Promise<{ isValid: boolean; data?: any }> {
        const token = req.cookies?.[this.config.cookieName];
        if (!token) return { isValid: false, data: { reason: 'No token provided' } };

        let jwt: any;
        try {
            const secret = new TextEncoder().encode(process.env.SECRET_KEY);
            const { payload } = await jose.jwtVerify(token, secret);
            jwt = payload;
        } catch (e) {
            return {
                isValid: false,
                data: {
                    reason: 'Invalid or expired token',
                    error: e instanceof Error ? e.message : e,
                },
            };
        }

        const now = Math.floor(Date.now() / 1000);
        if (!jwt.exp || now >= jwt.exp) {
            return { isValid: false, data: { reason: 'Token expired' } };
        }

        if (!jwt.purpose || jwt.purpose !== this.config.purpose) {
            return { isValid: false, data: { reason: 'Token purpose mismatch' } };
        }

        return { isValid: true, data: jwt };
    }

    getDiscordAuthUrl(host: string): string {
        const clientId = process.env.DISCORD_CLIENT_ID;
        if (!clientId) throw new Error('DISCORD_CLIENT_ID env var not defined');
        const callbackUrl = `https://${host}${this.config.routePrefix}/login/callback`;
        return `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURI(callbackUrl)}&scope=${this.config.scope}`;
    }

    getRedirectUri(host: string): string {
        return process.env.FRONTEND_URL ?? `https://${host}${this.config.routePrefix}/login/callback`;
    }

    async exchangeCode(code: string, redirectUri: string): Promise<any> {
        const params = {
            client_id: process.env.DISCORD_CLIENT_ID ?? '',
            client_secret: process.env.DISCORD_CLIENT_SECRET ?? '',
            code: code ?? '',
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
            scope: this.config.scope,
        };

        const response = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams(params).toString(),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        return await response.json();
    }

    async fetchDiscordUser(accessToken: string): Promise<{ id: string; [key: string]: any } | null> {
        try {
            const response = await fetch('https://discord.com/api/users/@me', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.error('Error fetching Discord user:', e);
        }
        return null;
    }

    async createJWT(payload: Record<string, any>): Promise<string> {
        const secret = new TextEncoder().encode(process.env.SECRET_KEY);
        return await new jose.SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(this.config.jwtExpirationTime)
            .sign(secret);
    }

    setAuthCookie(res: any, jwt: string): void {
        res.cookie(this.config.cookieName, jwt, {
            httpOnly: this.config.cookieHttpOnly,
            sameSite: this.config.cookieSameSite,
            maxAge: this.config.cookieMaxAge,
            path: this.config.cookiePath,
            secure: this.config.cookieSecure,
        });
    }

    clearAuthCookie(res: any): void {
        res.clearCookie(this.config.cookieName, { path: this.config.cookiePath });
    }

    async handleCallback(req: any, res: any): Promise<void> {
        if (!process.env.DISCORD_CLIENT_ID) {
            res.status(500).send('DISCORD_CLIENT_ID is not configured.');
            return;
        }
        if (!process.env.DISCORD_CLIENT_SECRET) {
            res.status(500).send('DISCORD_CLIENT_SECRET is not configured.');
            return;
        }
        if (!process.env.SECRET_KEY) {
            res.status(500).send('SECRET_KEY is not configured.');
            return;
        }

        const host = process.env.HOST ?? req.get('host');
        const redirectUri = this.getRedirectUri(host);
        const code = req.query.code;

        const oauthData = await this.exchangeCode(code, redirectUri);

        const discordUser = await this.fetchDiscordUser(oauthData.access_token);
        if (!discordUser) {
            console.error('Failed to fetch Discord user data during login callback');
            res.status(500).send('Failed to authenticate with Discord. Please try again.');
            return;
        }

        const payload: Record<string, any> = {
            purpose: this.config.purpose,
            discordToken: oauthData.access_token,
            discordRefreshToken: oauthData.refresh_token,
            expires_in: oauthData.expires_in,
        };

        if (this.config.fetchFullUser) {
            payload.discordUserData = discordUser;
        } else {
            payload.discordUserId = discordUser.id;
        }

        const jwt = await this.createJWT(payload);
        this.setAuthCookie(res, jwt);

        res.redirect(this.config.loginRedirectPath);
    }
}
