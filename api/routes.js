// import { studentService, authService, sessionService, activityService } from "../controller/controllers.js";
import { authController } from "../di/index.js";
import { parse } from 'url';
import { handleBody, handleResponse } from '../utils/response.js';
import decorator from '../utils/decorator.js';
import { studentService, authService, activityService } from "../di/index.js";
import Router from './route.js';
import studentRouter from './router/student.router.js';
import authRouter from './router/auth.router.js';
import activityRouter from './router/activity.router.js';
import { catchError } from '../exceptions/exception.filter.js';

export const handleAPIRoutes = async (req, res) => {
    try {
        const parsedUrl = parse(req.url, true);
        let { pathname, query } = parsedUrl;
        
        if (!pathname.startsWith("/api")) {
            return handleResponse(res, 404, "Not Found");
        }

        const parts = pathname.split("/").slice(2);
        const [controller, action] = parts;
        
        // Public routes that don't need API key
        if (controller === "ping") {
            console.log("ping");
            return handleResponse(res, 200, "Pong");
        }
        
        if (controller === "health") {
            return handleResponse(res, 200, "OK");
        }
        
        // Route to appropriate controller
        switch (controller) {
            case "student":
                return await studentRouter.handle(req, res, action, query);
            case "activity":
                return await activityRouter.handle(req, res, action, query);
            case "auth":
                return await authRouter.handle(req, res, action, query);
            default:
                return handleResponse(res, 404, "Not Found");
        }
    } catch (error) {
        return catchError(error, req, res);
    }
};