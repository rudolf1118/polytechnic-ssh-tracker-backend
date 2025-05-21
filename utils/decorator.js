import authService from '../controller/auth.controller.js';
import { handleResponse } from './response.js';
import { HttpException } from '../exceptions/exceptions.js';

class Decorator {
    constructor() {}

    async withAuth(req, res, handler, isRes = true) {
        try {
            await authService.checkToken_(req, res);
            return await handler(req, res);
        } catch (error) {
            /*
                if (isRes) {
                    if (error) {
                        return handleResponse(res, 401, error.message);
                    }
                    return handleResponse(res, 500, "Something went wrong");
                }
                throw error;
                */
            if (error instanceof HttpException) {
                return handleResponse(res, error.status, error.message);
            }
            return handleResponse(res, 500, 'Something went wrong');
        }
    }

    async withBasicAuth(req, res, handler, isRes = true) {
        try {
            await authService.checkBasic(req, res);
            return await handler(req, res);
        } catch (error) {
            if (error instanceof HttpException) {
                return handleResponse(res, error.status, error.message);
            }
            return handleResponse(res, 500, 'Something went wrong');
        }
    }
    async withMasterApiKey(req, res, handler, isRes = true) {
        try {
            await authService.checkMasterApiKey(req, res);
            return await handler(req, res);
        } catch (error) {
            return handleResponse(res, 500, 'Something went wrong');
        }
    }
}

export default new Decorator();
