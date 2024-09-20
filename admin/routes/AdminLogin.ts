import { Route, RouteMethod } from "zumito-framework";
import { AdminLoginCallback } from "./AdminLoginCallback";

export class AdminLogin extends Route {

    method = RouteMethod.get;
    path = '/admin/login';
    
    execute(req, res) {
        const clientId = process.env.DISCORD_CLIENT_ID;
        if (!clientId) throw new Error('DISCORD_CLIET_ID .env var not defined');
        const domain = req.get('host');
        const callbackUrl = `https://${domain}/admin/login/callback`;
        res.redirect(`https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURI(callbackUrl)}&scope=identify`);
    }
}