import Activity from '../schemas/activity.schema.js';
import { studentService } from './controllers.js';
import { formatDuration } from '../utils/helper.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { handleResponse } from '../utils/response.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, '../db_example/students.json');

class ActivityController {
    constructor(configuration) {
        this.activityService = configuration.activityService;
    }

    async getActivities(req, res) {
        try {
            const activities = await this.activityService.find();
            if (!activities) {
                return handleResponse(res, 404, "No activities found");
            }
            return handleResponse(res, 200, "Activities found", activities);
        } catch (error) {
            return handleResponse(res, 500, error.message);
        }
    }

    async getActivity(req, res, key) {
        try {
            const value = req?.params[key];
            if (!value) throw new Error(`${key} is required`);

            const query = key === 'id'
                ? this.activityService.findById(value)
                : this.activityService.find({ [key]: value }).exec();

            const activity = await query;

            if (!activity) {
                return handleResponse(res, 404, "Activity not found");
            }

            return handleResponse(res, 200, "Activity found", activity);
        } catch (error) {
            return handleResponse(res, 500, error.message);
        }
    }

    async getActivityByNameSurname(req, res) {
        try {
            const { firstName, lastName } = req.params;
            if (!firstName || !lastName) throw new Error("firstName and lastName are required");

            const activity = await this.activityService.find({ firstName, lastName }).exec();
            if (!activity) {
                return handleResponse(res, 404, "Activity not found");
            }

            return handleResponse(res, 200, "Activity found", activity);
        } catch (error) {
            return handleResponse(res, 500, error.message);
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
    async createActivityFromScratch(students, activities) {
        try {
            const students_ = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const student_usernames = students.map((student) => student?.username);
            let userActivity = [];

            student_usernames.forEach(async (name) => {
                const activitiesOfStudent = activities[name];
                if (!activitiesOfStudent) return;

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

                const that_student = students_.find((student) => student.id === name);
                const create = new Activity({
                    username: name,
                    firstName: that_student.firstNameEN,
                    lastName: that_student.lastNameEN,
                    studentId: students.find((student) => student.username === name)._id,
                    createdAt: new Date(),
                    lastUpdatedAt: new Date(),
                    durationOfActivity: formatDuration(duration) || duration,
                    activities: userActivity
                });

                await create.save();

                const student = await studentService.studentService.findOneAndUpdate(
                    { username: name },
                    { $push: { activities: create._id } },
                    { new: true }
                ).exec();

                console.log(create, student);
            });

            console.log("Saved");
        } catch (error) {
            throw error;
        }
    }

    async updateActivityOfStudents(student) {
        try {
            const { username } = student;
            const existingActivity = await this.activityService.findOne({ username });

            if (!existingActivity) {
                return {
                    status: 404,
                    message: "Activity not found"
                };
            }

            const updatedActivityOfStudent = await studentService.studentService.findOneAndUpdate(
                { username },
                { $set: { activities: [] } }, // Set the activities array to an empty array
                { new: true }
            ).exec();

            if (!updatedActivityOfStudent) {
                return {
                    status: 500,
                    message: "Activity not updated"
                };
            }

            return {
                status: 200,
                message: "Activity updated successfully",
                data: updatedActivityOfStudent
            };
        } catch (error) {
            console.error("Error updating activity:", error.message);
            return {
                status: 500,
                message: "An error occurred while updating the activity"
            };
        }
    }

    async updateActivity(req, res) {
        try {
            const { username, id } = req.body;
            const existingActivity = id
                ? await this.activityService.findById(id)
                : await this.activityService.findOne({ username });

            if (!existingActivity) {
                return handleResponse(res, 404, "Activity not found");
            }

            const updatedActivityOfStudent = await studentService.studentService.findOneAndUpdate(
                { username: existingActivity.username },
                { $set: { activities: [] } }, // Set the activities array to an empty array
                { new: true }
            ).exec();

            if (!updatedActivityOfStudent) {
                return handleResponse(res, 500, "Activity not updated");
            }

            return handleResponse(res, 200, "Activity updated successfully", updatedActivityOfStudent);
        } catch (error) {
            console.error("Error updating activity:", error.message);
            return handleResponse(res, 500, "An error occurred while updating the activity");
        }
    }

    async unhandledError(req, res, message) {
        try {
            return handleResponse(res, 500, message);
        } catch (error) {
            return handleResponse(res, 500, error.message);
        }
    }
}

export default new ActivityController({ activityService: Activity });