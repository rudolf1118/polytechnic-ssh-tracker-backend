import { studentService, authService } from '../controller/controllers.js';
import { parse } from 'url';

const handleStudentsRoutes = async (req, res, action) => { 
    const parsedUrl = parse(action, true);
    const { pathname, query } = parsedUrl;
    // * action example search?id=123
    if (method === 'GET') {
        if (pathname === 'search' && query) {
            const { firstName, lastName, username, id } = query;
            if (firstName && lastName) {
                return studentService.getStudentByNameSurname(req, res);
            }
            else if (username) {
                return studentService.getStudent(req, res, 'username');
            }
            else if (id) {
                return studentService.getStudent(req, res, 'id');
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

const handleAuthRoutes = async (req, res, action) => { 
    const parsedUrl = parse(action, true);
    const { pathname, query } = parsedUrl;
    // * action example search?id=123
    if (method === 'GET') {
    }
    else if (method === "POST") {
        if (pathname === 'login') {
            return authService.login(req, res);
        }
        else if (pathname === 'updatePassword') {
            return studentService.updatePassword(req, res);
        }
    }
}



export const handleAPIRoutes = (req, res) => {
    const parsedUrl = parse(req.url, true); // true → to get query as an object
    const { pathname, query } = parsedUrl;

    if (pathname.startsWith("/api")) {
        pathname = pathname.split("/").slice(2).join("/");
        const [controller, action] = pathname.split("/");

        switch (controller) {
        case "students":
            return handleStudentsRoutes(req, res, action);
        case "activities":
            return handleActivitiesRoutes(req, res, action);
        case "auth":
            return handleAuthRoutes(req, res, action);
        default:
            return ;
        }
    }

    return new Promise((resolve, reject) => {
        resolve();
    });
};