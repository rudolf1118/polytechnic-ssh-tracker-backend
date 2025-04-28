import { studentService, authService, activityService } from '../controller/controllers.js';
import { parse } from 'url';
import { handleBody, handleResponse } from '../utils/response.js';
import decorator from '../utils/decorator.js';

const handleStudentsRoutes = async (req, res, conf) => { 
    const { action, query } = conf;
    const parsedUrl = parse(action, true);
    const { method } = req;
    const { pathname } = parsedUrl;
    console.log("A")
    // * action example search?id=123
    if (method === 'GET') {
        if (pathname === 'search' && query) {
            const { firstName, lastName, username, id, group } = query;
            if (firstName && lastName) {
                return await decorator.withAuth(req, res, studentService.getStudentByNameSurname.bind(studentService, { params: { firstName, lastName } }, res));
            }
            else if (username) {
                return await decorator.withAuth(req, res, studentService.getStudent.bind(studentService, { params: { username } }, res, 'username'));
            }
            else if (group) {
                return await decorator.withAuth(req, res, studentService.getStudentsByGroup.bind(studentService, { params: { group } }, res));
            }
            else if (id) {
                return await decorator.withAuth(req, res, studentService.getStudent.bind(studentService, { params: { id } }, res, 'id'));
            }
            else {
                return await decorator.withAuth(req, res, studentService.unhandledError.bind(studentService, req, res, 'id or username is required'));
            }
        }
        else if (pathname === 'me') {
            return await decorator.withAuth(req, res, studentService.getMe.bind(studentService, req, res));
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
    console.log(conf)
    const parsedUrl = parse(action, true);
    const { pathname } = parsedUrl;
    const { method } = req;

    if (method === 'GET') {
        if (pathname === 'connect') {
            return await decorator.withAuth(req, res, authService.setConnection.bind(authService), false);
        }
        if (pathname === 'disconnect') {
            return await decorator.withAuth(req, res, authService.disconnect.bind(authService));
        }
        else if (pathname === 'verify') {
            console.log(req.headers)
            return await authService.checkToken(req, res);
        }
        else {
            return handleResponse(res, 404, "Endpoint not found");
        }
    }
    else if (method === "POST") {
        const body = await handleBody(req);
        console.log(body)
        req.body = body;
        if (pathname === 'login') {
            return await authService.login(req, res);
        }
        else if (pathname === 'updatePassword') {
            // return await studentService.updatePassword(req, res);
            return await decorator.withAuth(req, res, studentService.updatePassword);
        }
        else if (pathname === 'execute') {
            return await decorator.withAuth(req, res, authService.executeSSHCommand.bind(authService, req, res));
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
        if (pathname === 'search' && query) {
            const { firstName, lastName, username, id, studentId} = query;
            if (firstName && lastName) {
                return await decorator.withAuth(req, res, activityService.getActivityByNameSurname.bind(activityService, { params: { firstName, lastName } }));
            }
            else if (username) {
                return await decorator.withAuth(req, res, activityService.getActivity.bind(activityService, { params: { username } }, res,'username'));
            }
            else if (studentId) {
                return await decorator.withAuth(req, res, activityService.getActivity.bind(activityService, { params: { studentId } }, res, 'studentId'));
            }
            else if (id) {
                return await decorator.withAuth(req, res, activityService.getActivity.bind(activityService, { params: { id } }, res, ' id'));
            } else {
                return await decorator.withAuth(req, res, activityService.unhandledError.bind(activityService, req, res, 'id or username is required'));
            }
        }
        else if (pathname === 'me') {
            return await decorator.withAuth(req, res, activityService.getMe.bind(activityService, req, res));
        }
        else if (pathname === 'getTopParticipants') {
            const { limit, group } = query;
            return await decorator.withAuth(req, res, activityService.countTheBest.bind(activityService, req, res, { limit, group }));
        }
        else if (pathname === 'sync_bulkAction') {
            try {
                const res_ = await decorator.withBasicAuth(req, res, activityService.fetchActivityAndUpdate_cmd.bind(activityService, req, res), false);
                return handleResponse(res, 200, "Sync completed", res_);
            } catch (error) {
                console.error('Sync error:', error.message);
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Sync Failed", error: error.message }));
                return ;
            }
        }
        else if (pathname === 'syncUsersActivity') {
            try {
                const res_ = await decorator.withAuth(req, res, activityService.fetchActivityAndUpdate_cmd.bind(activityService, req, res), false);
                return handleResponse(res, 200, "Sync completed", res_);
            } catch (error) {
                console.error('Sync error:', error.message);
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Sync Failed", error: error.message }));
                return ;
            }
        }
        else {
            return handleResponse(res, 404, "Endpoint not found");
        }
    }
    else if (method === "POST") {
        if (pathname === 'create') {
            const body = await handleBody(req);
            req.body = body;
            return await decorator.withAuth(req, res, activityService.createActivity.bind(activityService, req, res));
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
        else if (pathname === 'recount') {
            return await decorator.withAuth(req, res, activityService.update_recount_duplicates.bind(activityService, req, res));
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
        case "ping":
            console.log("ping");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Pong" }));
            return ;
        case "health":
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "OK" }));
            return ;
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