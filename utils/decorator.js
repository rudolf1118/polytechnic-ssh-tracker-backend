import { authService } from "../controller/controllers.js";
import { handleResponse } from "./response.js";
class Decorator {
    constructor() {
    }
    
    async withAuth(req, res, handler, isRes = true) {
            try {
                await authService.checkToken_(req, res, false);
                return (await handler(req, res));
            } catch (error) {
                if (isRes) {
                    if (error) {
                        return handleResponse(res, 401, error.message);
                    }
                    return handleResponse(res, 500, "Something went wrong");
                }
                throw error;
            }
    }

    async withBasicAuth(req, res, handler, isRes = true) {
        try {
            await authService.checkBasic(req, res);
            return (await handler(req, res));
        } catch (error) {
            if (isRes) {
                if (error) {
                    return handleResponse(res, 401, error.message);
                }
                return handleResponse(res, 500, "Something went wrong");
            }
            throw error;
        }
    }
}

export default new Decorator();