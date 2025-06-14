import Router from '../route.js';
import { studentService } from '../../di/index.js';
import decorator from '../../utils/decorator.js';

const studentRouter = new Router();

// Search route handler
studentRouter.get('search', async (req, res, query) => {
    const { firstName, lastName, username, id, group } = query;
    if (firstName && lastName) {
        return await decorator.withAuth(req, res, studentService.getStudentByNameSurname.bind(studentService, { params: { firstName, lastName } }, res));
    } else if (username) {
        return await decorator.withAuth(req, res, studentService.getStudent.bind(studentService, { params: { username } }, res, 'username'));
    } else if (group) {
        return await decorator.withAuth(req, res, studentService.getStudentsByGroup.bind(studentService, { params: { group } }, res));
    } else if (id) {
        return await decorator.withAuth(req, res, studentService.getStudent.bind(studentService, { params: { id } }, res, 'id'));
    }
    return await decorator.withAuth(req, res, studentService.unhandledError.bind(studentService, req, res, 'id or username is required'));
});

// Me route handler
studentRouter.get('me', async (req, res) => {
    return await decorator.withAuth(req, res, studentService.getMe.bind(studentService, req, res));
});

// Create route handler
studentRouter.post('create', async (req, res) => {
    const student = req.body;
    return await decorator.withAuth(req, res, studentService.createStudent.bind(studentService, student));
});

export default studentRouter;
