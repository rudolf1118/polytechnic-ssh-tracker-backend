import { authService } from "../controller/controllers.js";
import { handleResponse } from "./response.js";
class Decorator {
    constructor() {
        this.decorators = [];
    }
    
    async withAuth(req, res, handler) {
            try {
                await authService.checkToken_(req, res, false);
                return (await handler(req, res));
            } catch (error) {
                if (error) {
                    return handleResponse(res, 401, error.message);
                }
                return handleResponse(res, 500, "Something went wrong");
            }
    }
}

export default new Decorator();