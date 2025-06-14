import { catchError } from '../exceptions/exception.filter.js';
import { NotFoundException } from '../exceptions/exceptions.js';

class Router {
    constructor() {
        this.getRoutes = new Map();
        this.postRoutes = new Map();
    }

    get(path, handler) {
        this.getRoutes.set(path, handler);
        return this;
    }

    post(path, handler) {
        this.postRoutes.set(path, handler);
        return this;
    }

    async handle(req, res, pathname, query) {
        try {
            const method = req.method;
            let handler;

            if (method === 'GET') {
                handler = this.getRoutes.get(pathname);
            } else if (method === 'POST') {
                handler = this.postRoutes.get(pathname);
            }

            if (!handler) {
                throw new NotFoundException(`Cannot ${method} ${pathname}`);
            }

            const result = await handler(req, res, query);
            return result;
        } catch (error) {
            return catchError(error, req, res);
        }
    }
}

export default Router;