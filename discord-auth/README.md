# discord-auth

Reusable Discord OAuth2 authentication module for Zumito Framework. Provides a configurable `DiscordAuthService` that handles the full login flow: Discord OAuth2 redirect, code exchange, user data fetching, JWT creation/signing, and cookie-based session management.

Both [`admin`](../admin) and [`userPanel`](../userPanel) modules use this shared service.

## Features

- **Single service, multiple consumers** — Admin and User Panel share the same auth logic via different configs (cookie names, token purpose, user data granularity).
- **Token purpose validation** — Each consumer sets a `purpose` claim in the JWT. Cross-module token reuse is rejected at verification time.
- **Configurable per consumer:** cookie name, prefix, httpOnly, JWT expiration, scope, whether to store full user profile or just ID.
- **Error handling** — Validates `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, and `SECRET_KEY` before processing. Returns clear error messages on failure.

## Usage

Create a service extending `DiscordAuthService`:

```ts
import { DiscordAuthService } from 'discord-auth';

export class MyAuthService extends DiscordAuthService {
    constructor() {
        super({
            cookieName: 'my_token',
            routePrefix: '/myapp',
            loginRedirectPath: '/myapp',
            cookieHttpOnly: true,
            fetchFullUser: false,
            purpose: 'myapp',
        });
    }
}
```

Then create thin route files:

```ts
// Login route
class MyLogin extends Route {
    path = '/myapp/login';
    async execute(req, res) {
        const auth = ServiceContainer.getService(MyAuthService);
        if (await auth.isLoginValid(req).then(r => r.isValid)) return res.redirect('/myapp');
        res.redirect(auth.getDiscordAuthUrl(process.env.HOST ?? req.get('host')));
    }
}

// Callback route
class MyCallback extends Route {
    path = '/myapp/login/callback';
    async execute(req, res) {
        await ServiceContainer.getService(MyAuthService).handleCallback(req, res);
    }
}

// Logout route
class MyLogout extends Route {
    path = '/myapp/logout';
    async execute(req, res) {
        ServiceContainer.getService(MyAuthService).clearAuthCookie(res);
        res.redirect('/myapp');
    }
}
```

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `cookieName` | `string` | required | Cookie name (e.g., `'admin_token'`, `'panel_token'`). |
| `routePrefix` | `string` | required | Route prefix for login/callback URLs (e.g., `'/admin'`, `'/panel'`). |
| `loginRedirectPath` | `string` | required | Where to redirect after successful login. |
| `cookieHttpOnly` | `boolean` | required | Whether the cookie is httpOnly. |
| `fetchFullUser` | `boolean` | required | Store full Discord user object (`true`) or just the ID (`false`). |
| `purpose` | `string` | required | Claim embedded in JWT to prevent cross-module token reuse. |
| `scope` | `string` | `'identify'` | Discord OAuth2 scope. |
| `jwtExpirationTime` | `string` | `'2h'` | JWT expiration time. |
| `cookieMaxAge` | `number` | `30 * 24 * 60 * 60 * 1000` | Cookie max age in ms (30 days). |
| `cookiePath` | `string` | `'/'` | Cookie path. |
| `cookieSecure` | `boolean` | `false` | Cookie secure flag. |
| `cookieSameSite` | `'lax' \| 'strict' \| 'none'` | `'lax'` | Cookie SameSite attribute. |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DISCORD_CLIENT_ID` | Yes | Discord application client ID. |
| `DISCORD_CLIENT_SECRET` | Yes | Discord application client secret. |
| `SECRET_KEY` | Yes | Secret key for JWT signing (shared across modules using this service). |
| `HOST` | No | Fallback host for redirect URIs (uses `req.get('host')` if not set). |
| `FRONTEND_URL` | No | Override for the OAuth2 redirect URI. |

## API

### `isLoginValid(req): Promise<{ isValid: boolean, data?: any }>`

Reads the configured cookie from the request, verifies the JWT signature and expiration, and validates the `purpose` claim matches the service config.

### `getDiscordAuthUrl(host: string): string`

Builds the Discord OAuth2 authorize URL for the configured scope and redirect URI.

### `handleCallback(req, res): Promise<void>`

Handles the full OAuth2 callback flow: validates env vars, exchanges the authorization code for tokens, fetches the Discord user profile, creates a signed JWT with the purpose claim, sets the cookie, and redirects to `loginRedirectPath`.

### `clearAuthCookie(res): void`

Clears the authentication cookie.

### `setAuthCookie(res, jwt: string): void`

Sets the authentication cookie with configured options.

### `createJWT(payload): Promise<string>`

Creates and signs a JWT with `HS256` algorithm.

## Security

- **Token purpose validation**: Each consumer includes a `purpose` claim in the JWT. A token issued for `'panel'` will be rejected when verified by the Admin module (expecting `'admin'`), and vice versa.
- **Full user data vs ID only**: Admin module stores only the Discord user ID (`fetchFullUser: false`). User Panel stores the full profile for display purposes (`fetchFullUser: true`).

## Dependencies

- `jose` — JWT signing and verification.
- `zumito-framework`
