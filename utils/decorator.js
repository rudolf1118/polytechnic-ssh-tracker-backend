import { authService } from "../controller/controllers.js";
import { handleResponse } from "./response.js";
class Decorator {
    constructor() {
        this.decorators = [];
    }
    
    async withAuth(req, res,handler) {
            try {
                await authService.checkToken_(req, res, false);
                return (await handler(req, res));
            } catch (error) {
                console.error(error);
                return {
                    status: 500,
                    message: "Something went wrong",
                    error: error.message
                };
            }
    }
}

export default new Decorator();