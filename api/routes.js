import { studentService, authService } from '../controller/controllers.js';
import { parse } from 'url';
import { handleBody } from '../utils/response.js';

const handleStudentsRoutes = async (req, res, conf) => { 
    const { action, query } = conf;
    const parsedUrl = parse(action, true);
    const { method } = req;
    const { pathname } = parsedUrl;
    console.log(query)
    // * action example search?id=123
    if (method === 'GET') {
        if (pathname === 'search' && query) {
            const { firstName, lastName, username, id } = query;
            if (firstName && lastName) {
                return studentService.getStudentByNameSurname({ params: { firstName, lastName } }, res);
            }
            else if (username) {
                return studentService.getStudent({ params: { username } } , res, 'username');
            }
            else if (id) {
                return studentService.getStudent({ params: { id } }, res, 'id');
            }
            else {
                return studentService.unhandledError(req, res, 'id or username is required');
            }
        }
    }
    else if (method === "POST") {
        if (pathname === 'create') {
            const student = req.body;
            return studentService.createStudent(student);
        }
        else if (pathname === 'update') {
            const student = req.body;
            return studentService.updateStudent(student);
        }
    }
}

const handleAuthRoutes = async (req, res, conf) => { 
    const { action, query } = conf;
    const parsedUrl = parse(action, true);
    const { pathname } = parsedUrl;
    const { method } = req;
    // * action example search?id=123
    if (method === 'GET') {
    }
    else if (method === "POST") {
        const body = await handleBody(req);
        req.body = body;
        if (pathname === 'login') {
            return await authService.login(req, res);
        }
        else if (pathname === 'updatePassword') {
            return await studentService.updatePassword(req, res);
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
        case "students":
            return handleStudentsRoutes(req, res, {action, query});
        case "activities":
            return handleActivitiesRoutes(req, res, {action, query});
        case "auth":
            return handleAuthRoutes(req, res, {action, query});
        default:
            
        }
    }
    else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Not Found" }));
        return;
    }
};