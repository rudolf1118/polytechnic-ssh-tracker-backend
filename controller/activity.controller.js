import Activity from '../schemas/activity.schema.js';
import { studentService } from './controllers.js';
import { formatDuration } from '../utils/helper.js';
class ActivityController {
    
    constructor(configuration) {
        this.activityService = configuration.activityService;
    }

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
    // * For filling DB

    /*
        activities: [{ 
        ip: { type: String, required: true },
        hostname: { type: String, required: true },
        date: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        modifyAt: { type: Date, default: Date.now },
        rating: { type: Number, default: 0 },
        description: { type: String, default: '' },
        status: { type: String, default: 'active' },
        type: { type: String, default: 'default' },
    }],
    {
    "username": "c1",
    "ip": "178.160.245.34",
    "hostname": "pts/11",
    "date": "Tue Apr 15 09:45 - 10:12 (00:27)"
    },
    */
    async createActivityFromScratch(students, activities) {
        try {
            const student_usernames = students.map((student) => student?.username);
            let wholeDuration = 0;
            let userActivity = [];
            console.log(student_usernames.length)
            student_usernames.forEach(async (name)=>{
                const activitiesOfStudent = activities[name];
                if (!activitiesOfStudent) return ;
                let duration = 0;
                activitiesOfStudent.forEach((activity) => {
                    const activity_toDB = {};
                    const { ip, hostname, date } = activity;
                    activity_toDB.ip = ip;
                    activity_toDB.hostname = hostname;
                    activity_toDB.date = date;
                    const timeMatch = date.match(/\((\d+):(\d+)\)/);
                    if (timeMatch) {
                        const [_, minutes, seconds] = timeMatch.map(Number);
                        duration += minutes * 60 + seconds;
                    }
                    activity_toDB.duration = formatDuration(duration) || duration;
                    userActivity.push(activity_toDB);
                });
                const create = new Activity({
                    username: name,
                    studentId: students.find((student) => student.username === name)._id,
                    createdAt: new Date(),
                    lastUpdatedAt: new Date(),
                    durationOfActivity: formatDuration(duration) || duration,
                    activities: userActivity
                });
                console.log(create);
                await create.save();
                const student = await studentService.studentService.findOneAndUpdate(
                    { username: name },
                    { $push: { activities: create._id } },
                    { new: true }
                ).exec();
            });
            console.log("saved");
        } catch (error) {
            throw error;
        }
    }

    async updateActivityOfStudents(student) {
        try {
            const { username } = student;
            console.log(student)
            const existingActivity = await this.activityService.findOne({ username });
            if (!existingActivity) {
                return {
                    status: 404,
                    message: "Activity not found"
                };
            }
            const updatedActivityOfStudent = await studentService.studentService.findOneAndUpdate(
                { username },
                { $push: { activities: { _id: existingActivity._id } } },
                { $set: { modifyAt: new Date() } },
                { new: true }
            ).exec();
            console.log(updatedActivity)
            if (!updatedActivity) {
                return {
                    status: 500,
                    message: "Activity not updated"
                };
            }
            return {
                status: 200,
                message: "Activity updated successfully",
                data: updatedActivity
            };
        } catch (error) {
            console.error("Error updating activity:", error.message);
            return {
                status: 500,
                message: "An error occurred while updating the activity"
            };
        }
    }
}

export default new ActivityController({activityService: Activity});