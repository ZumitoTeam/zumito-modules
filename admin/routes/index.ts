import { Route, RouteMethod } from 'zumito-framework';
import ejs from 'ejs';


export class Index extends Route {
    method = RouteMethod.get;
    path = "/admin";

    execute(req, res) {
        res.send(
            ejs.renderFile('<%= people.join(", "); %>')
        );
    }

}