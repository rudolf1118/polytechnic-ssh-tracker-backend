import { studentService } from '../services/studentService.js';
import { parse } from 'url';

const handleStudentsRoutes = async (req, res, action) => { 
    const { method, url } = req;
    const parsedUrl = parse(url, true);
    const { pathname, query } = parsedUrl;

    if (method === 'GET') {
        const students = await studentService.getStudents();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(students));
    } else if (method === 'POST' && pathname === '/api/students') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const studentData = JSON.parse(body);
            const newStudent = await studentService.createStudent(studentData);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(newStudent));
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
}

export const handleAPIRoutes = (req, res) => {
    const parsedUrl = parse(req.url, true); // true → to get query as an object
    const { pathname, query } = parsedUrl;
    // if (req.method === 'GET' && pathname === '/api/search') {

    // }
    // if (req.method === 'GET' && pathname === '/') {
    //     res.statusCode = 200;
    //     res.end('Welcome to the homepage!');
    // } else if (req.method === 'GET' && req.url === '/about') {
    //     res.statusCode = 200;
    //     res.end('This is the about page.');
    // } else {
    //     const idMatch = req.url.match(/^\/id\/([a-zA-Z0-9_-]+)$/);
    //     if (req.method === 'GET' && idMatch) {
    //         const id = idMatch[1];
    //         res.statusCode = 200;
    //         res.setHeader('Content-Type', 'application/json');
    //         res.end(JSON.stringify({ message: `You requested ID: ${id}` }));
    //         return;
    //     }

    //     res.statusCode = 404;
    //     res.end('Page not found');
    // }
    if (pathname.startsWith("/api")) {
        pathname = pathname.split("/").slice(2).join("/");
        const [controller, action] = pathname.split("/");
        if (controller === "students") {
            return handleStudentsRoutes(req, res, action);
        }
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