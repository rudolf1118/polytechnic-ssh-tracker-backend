import Router from '../route.js';
import { authController, authService, studentService } from '../../di/index.js';
import decorator from '../../utils/decorator.js';
import { handleBody } from '../../utils/response.js';
import { UnauthorizedException, BadRequestException } from '../../exceptions/exceptions.js';

const authRouter = new Router();

// Connect route handler
authRouter.get('connect', async (req, res) => {
    return await authController.setConnection(req, res);
});

// Disconnect route handler
authRouter.get('disconnect', async (req, res) => {
    return await decorator.withAuth(req, res, authService.disconnect.bind(authService));
});

// Verify route handler
authRouter.get('verify', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        throw new UnauthorizedException('No token provided');
    }
    return await authService.checkToken(req, res);
});

// Login route handler
authRouter.post('login', async (req, res) => {
    try {
        const body = await handleBody(req);
        if (!body.username || !body.password) {
            throw new BadRequestException('Username and password are required');
        }
        req.body = body;
        return await authController.login(req, res);
    } catch (error) {
        if (error.message === 'Invalid JSON') {
            throw new BadRequestException('Invalid request body');
        }
        throw error;
    }
});

// Update password route handler
authRouter.post('updatePassword', async (req, res) => {
    try {
        const body = await handleBody(req);
        if (!body.oldPassword || !body.newPassword) {
            throw new BadRequestException('Old password and new password are required');
        }
        req.body = body;
        return await decorator.withAuth(req, res, studentService.updatePassword);
    } catch (error) {
        if (error.message === 'Invalid JSON') {
            throw new BadRequestException('Invalid request body');
        }
        throw error;
    }
});

// Execute route handler
authRouter.post('execute', async (req, res) => {
    return await decorator.withAuth(req, res, authService.executeSSHCommand.bind(authService, req, res));
});

export default authRouter;