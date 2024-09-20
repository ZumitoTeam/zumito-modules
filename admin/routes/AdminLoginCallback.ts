import { Route, RouteMethod } from "zumito-framework";

export class AdminLoginCallback extends Route {

    method = RouteMethod.get;
    path = '/admin/login/callback';
    
    async execute(req, res) {
        console.log({
            client_id: process.env.DISCORD_CLIENT_ID ?? '',
            client_secret: process.env.DISCORD_CLIENT_SECRET ?? '',
            code: req.query.code ?? '',
            grant_type: 'authorization_code',
            redirect_uri: process.env.FRONTEND_URL ?? `https://${req.get('host')}/admin`,
            scope: 'identify',
          });
        const tokenResponseData = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
              client_id: process.env.DISCORD_CLIENT_ID ?? '',
              client_secret: process.env.DISCORD_CLIENT_SECRET ?? '',
              code: req.query.code ?? '',
              grant_type: 'authorization_code',
              redirect_uri: process.env.FRONTEND_URL ?? `https://${req.get('host')}/admin`,
              scope: 'identify',
            }).toString(),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          });
        
          const oauthData = await tokenResponseData.json();
          return res.json(oauthData)
        res.send(200)
    }
}