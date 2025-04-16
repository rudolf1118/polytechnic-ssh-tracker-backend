const Activity = require('../schemas/activity.schema');

class ActivityController {
    
    async getActivities(req, res) {
        try {
        const activities = await this.activityService.getActivities();
        res.status(200).json(activities);
        } catch (error) {
        res.status(500).json({ message: error.message });
        }
    }
    
    async createActivity(req, res) {
        try {
        const activity = await this.activityService.createActivity(req.body);
        res.status(201).json(activity);
        } catch (error) {
        res.status(500).json({ message: error.message });
        }
    }
}