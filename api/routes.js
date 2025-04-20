import { studentService, authService, activityService } from '../controller/controllers.js';
import { parse } from 'url';
import { handleBody, handleResponse } from '../utils/response.js';
import decorator from '../utils/decorator.js';

const handleStudentsRoutes = async (req, res, conf) => { 
    const { action, query } = conf;
    const parsedUrl = parse(action, true);
    const { method } = req;
    const { pathname } = parsedUrl;
    // * action example search?id=123
    if (method === 'GET') {
        if (pathname === 'search' && query) {
            const { firstName, lastName, username, id } = query;
            if (firstName && lastName) {
                return await decorator.withAuth(req, res, studentService.getStudentByNameSurname.bind(studentService, { params: { firstName, lastName } }));
            }
            else if (username) {
                return await decorator.withAuth(req, res, studentService.getStudent.bind(studentService, { params: { username } }, res, 'username'));
            }
            else if (id) {
                return await decorator.withAuth(req, res, studentService.getStudent.bind(studentService, { params: { id } }, res, 'id'));
            }
            else {
                return await decorator.withAuth(req, res, studentService.unhandledError.bind(studentService, req, res, 'id or username is required'));
            }
        }
        else {
            return handleResponse(res, 404, "Endpoint not found");
        }
    }
    else if (method === "POST") {
        if (pathname === 'create') {
            const student = req.body;
            return await decorator.withAuth(req, res, studentService.createStudent.bind(studentService, student));
        }
        // * not implemented yet
        // else if (pathname === 'update') {
        //     const student = req.body;
        //     return await decorator.withAuth(req, res, studentService.updateStudent.bind(studentService, student));
        // }
        else {
            return handleResponse(res, 404, "Endpoint not found");
        }
    }
}

const handleAuthRoutes = async (req, res, conf) => { 
    const { action, query } = conf;
    const parsedUrl = parse(action, true);
    const { pathname } = parsedUrl;
    const { method } = req;

    if (method === 'GET') {
        if (pathname === 'connect') {
            return await decorator.withAuth(req, res, authService.setConnection.bind(authService));
        }
        if (pathname === 'disconnect') {
            return await decorator.withAuth(req, res, authService.disconnect.bind(authService));
        }
        else {
            return handleResponse(res, 404, "Endpoint not found");
        }
    }
    else if (method === "POST") {
        const body = await handleBody(req);
        req.body = body;
        if (pathname === 'login') {
            return await authService.login(req, res);
        }
        else if (pathname === 'updatePassword') {
            // return await studentService.updatePassword(req, res);
            return await decorator.withAuth(req, res, studentService.updatePassword);
        }
        else {
            return handleResponse(res, 404, "Endpoint not found");
        }
    }
}

const handleActivityRoutes = async (req, res, conf) => { 
    const { action, query } = conf;
    const parsedUrl = parse(action, true);
    const { method } = req;
    const { pathname } = parsedUrl;

    // * action example search?id=123
    if (method === 'GET') {
        console.log(pathname)
        if (pathname === 'search' && query) {
            const { firstName, lastName, username, id } = query;
            if (firstName && lastName) {
                return await decorator.withAuth(req, res, activityService.getActivityByNameSurname.bind(activityService, { params: { firstName, lastName } }));
            }
            else if (username) {
                return await decorator.withAuth(req, res, activityService.getActivity.bind(activityService, { params: { username } }, 'username'));
            }
            if (id) {
                return await decorator.withAuth(req, res, activityService.getActivity.bind(activityService, { params: { id } }, 'id'));
            } else {
                return await decorator.withAuth(req, res, activityService.unhandledError.bind(activityService, req, res, 'id or username is required'));
            }
        }
        else if (pathname === 'getTopParticipants') {
            const { limit } = query;
            return await decorator.withAuth(req, res, activityService.countTheBest.bind(activityService, req, res, limit));
        }
        else {
            return handleResponse(res, 404, "Endpoint not found");
        }
    }
    else if (method === "POST") {
        if (pathname === 'create') {
            const student = req.body;
            return await decorator.withAuth(req, res, activityService.createActivity.bind(activityService, student));
        }
        else if (pathname === 'update') {
            const body = await handleBody(req);
            req.body = body;
            return await decorator.withAuth(req, res, activityService.updateActivity.bind(activityService, req, res));
        }
        else if (pathname === 'sync') {
            const body = await handleBody(req);
            req.body = body;
            return await decorator.withAuth(req, res, activityService.fetchActivityAndUpdate.bind(activityService, req, res));
        }
        else {
            return handleResponse(res, 404, "Endpoint not found");
        }
    }

}

export const handleAPIRoutes = (req, res) => {
    const parsedUrl = parse(req.url, true);
    let { pathname, query: {...query} } = parsedUrl;
    if (pathname.startsWith("/api")) {
        pathname = pathname.split("/").slice(2)
        const [controller, action] = pathname;
        switch (controller) {
        case "student":
            return handleStudentsRoutes(req, res, {action, query});
        case "activity":
            return handleActivityRoutes(req, res, {action, query});
        case "auth":
            return handleAuthRoutes(req, res, {action, query});
        default:
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Not Found" }));
            return ;
        }
    }
    else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Not Found" }));
        return;
    }
};