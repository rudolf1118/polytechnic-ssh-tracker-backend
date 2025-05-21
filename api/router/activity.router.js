import Router from '../route.js';
import { activityService } from '../../di/index.js';
import decorator from '../../utils/decorator.js';
import { handleBody, handleResponse } from '../../utils/response.js';

const activityRouter = new Router();

// Search route handler
activityRouter.get('search', async (req, res, query) => {
    const { firstName, lastName, username, id, studentId } = query;
    if (firstName && lastName) {
        return await decorator.withAuth(req, res, activityService.getActivityByNameSurname.bind(activityService, { params: { firstName, lastName } }));
    } else if (username) {
        return await decorator.withAuth(req, res, activityService.getActivity.bind(activityService, { params: { username } }, res, 'username'));
    } else if (studentId) {
        return await decorator.withAuth(req, res, activityService.getActivity.bind(activityService, { params: { studentId } }, res, 'studentId'));
    } else if (id) {
        return await decorator.withAuth(req, res, activityService.getActivity.bind(activityService, { params: { id } }, res, 'id'));
    }
    return await decorator.withAuth(req, res, activityService.unhandledError.bind(activityService, req, res, 'id or username is required'));
});

// Me route handler
activityRouter.get('me', async (req, res) => {
    return await decorator.withAuth(req, res, activityService.getMe.bind(activityService, req, res));
});

// Get top participants route handler
activityRouter.get('getTopParticipants', async (req, res, query) => {
    const { limit, group } = query;
    return await decorator.withAuth(req, res, activityService.countTheBest.bind(activityService, req, res, { limit, group }));
});

// Sync bulk action route handler
activityRouter.get('sync_bulkAction', async (req, res) => {
    try {
        const res_ = await decorator.withBasicAuth(req, res, activityService.fetchActivityAndUpdate_cmd.bind(activityService, req, res), false);
        return handleResponse(res, 200, "Sync completed", res_);
    } catch (error) {
        console.error('Sync error:', error.message);
        return handleResponse(res, 400, "Sync Failed", { error: error.message });
    }
});

// Sync users activity route handler
activityRouter.get('syncUsersActivity', async (req, res) => {
    try {
        const res_ = await decorator.withAuth(req, res, activityService.fetchActivityAndUpdate_cmd.bind(activityService, req, res), false);
        return handleResponse(res, 200, "Sync completed", res_);
    } catch (error) {
        console.error('Sync error:', error.message);
        return handleResponse(res, 400, "Sync Failed", { error: error.message });
    }
});

// Create activity route handler
activityRouter.post('create', async (req, res) => {
    const body = await handleBody(req);
    req.body = body;
    return await decorator.withAuth(req, res, activityService.createActivity.bind(activityService, req, res));
});

// Update activity route handler
activityRouter.post('update', async (req, res) => {
    const body = await handleBody(req);
    req.body = body;
    return await decorator.withAuth(req, res, activityService.updateActivity.bind(activityService, req, res));
});

// Sync route handler
activityRouter.post('sync', async (req, res) => {
    const body = await handleBody(req);
    req.body = body;
    return await decorator.withAuth(req, res, activityService.fetchActivityAndUpdate.bind(activityService, req, res));
});

// Recount route handler
activityRouter.post('recount', async (req, res) => {
    return await decorator.withAuth(req, res, activityService.update_recount_duplicates.bind(activityService, req, res));
});

export default activityRouter; 