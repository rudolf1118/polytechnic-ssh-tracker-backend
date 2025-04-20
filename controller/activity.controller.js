import Activity from '../schemas/activity.schema.js';
import { studentService } from './controllers.js';
import { formatDuration, parseLastStringToEndDate, addDurationToExisted, calculateTopParticipants   } from '../utils/helper.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { handleResponse } from '../utils/response.js';
import { connectAndExecuteSSH } from '../ssh_connection/execution.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, '../db_example/students.json');

class ActivityController {
    constructor(configuration) {
        this.activityService = configuration.activityService;
        this.studentService = configuration.studentService;
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

            student_usernames.forEach(async (name) => {
                let lastOnline = "";
                let userActivity = [];
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
                    if (!lastOnline || parseLastStringToEndDate(date) > lastOnline) lastOnline = parseLastStringToEndDate(date);
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
                    activities: userActivity,
                    lastOnline,
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
                { $push: { activities: existingActivity?.id } }, 
                { $set: {modifyAt: new Date() } },
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

    async fetchActivityAndUpdate(req, res) {
        try {
            const { username, password } = req?.body || {};
            if (!username || !password) {
                return handleResponse(res, 400, "Credentials are required");
            }
            let updated_count = 0;
            const { groupedBy } = await connectAndExecuteSSH({ username, password });
    
            const activities = await this.activityService.find().exec();
            console.log(activities)
            if (!activities) {
                return handleResponse(res, 404, "Activities not found");
            }
    
            for (const activity_ of activities) {
                const studentUsername = activity_.username;
                const lastUpdatedAt = activity_.lastUpdatedAt;
            
                const activitiesOfStudent = groupedBy[studentUsername];
                if (!activitiesOfStudent) continue;
            
                let totalNewDuration = 0;
                let lastOnline;
                const newActivities = [];
            
                for (const activity of activitiesOfStudent) {
                    if (!lastOnline || parseLastStringToEndDate(activity.date) > lastOnline) lastOnline = parseLastStringToEndDate(activity.date);
                    if (parseLastStringToEndDate(activity.date) < lastUpdatedAt) continue;
            
                    const { ip, hostname, date } = activity;
                    const activity_toDB = { ip, hostname, date };
            
                    const timeMatch = date.match(/\((\d+):(\d+)\)/);
                    if (timeMatch) {
                        const [, minutes, seconds] = timeMatch.map(Number);
                        const duration = minutes * 60 + seconds;
                        activity_toDB.duration = formatDuration(duration);
                        totalNewDuration += duration;
                    }
            
                    newActivities.push(activity_toDB);
                }
            
                if (newActivities.length === 0) continue;
            
                const updatedDuration = addDurationToExisted(
                    activity_.durationOfActivity || "00:00:00",
                    formatDuration(totalNewDuration)
                );
            
                const updated = await this.activityService.findOneAndUpdate(
                    { username: studentUsername },
                    {
                        $set: { durationOfActivity: updatedDuration,  lastOnline: lastOnline },
                        $push: { activities: { $each: newActivities } }
                    },
                    { new: true }
                ).exec();
                updated_count++;
            
                if (updated.activities?.length > 300) {
                    updated.activities.sort((a, b) => new Date(a.date) - new Date(b.date));
                    updated.activities = updated.activities.slice(-150);
                    await updated.save();
                }
            }
    
            return handleResponse(res, 200, `Activities updated successfully, updated users count: ${updated_count}`);
        } catch (error) {
            console.error("Error fetching activity:", error.message);
            return handleResponse(res, error?.status || 500, error?.message || "Something went wrong");
        }
    }

    async fetchActivityAndUpdate_cmd(req, res) {
        try {
            const { username, password } = req?.body || {};
            if (!username || !password) {
                return handleResponse(res, 400, "Credentials are required");
            }
    
            const { groupedBy } = await connectAndExecuteSSH({ username, password });
    
            const activities = await this.activityService.find().exec();
            if (!activities) {
                return handleResponse(res, 404, "Activities not found");
            }
    
            for (const activity_ of activities) {
                const studentUsername = activity_.username;
                const lastUpdatedAt = activity_.lastUpdatedAt;
            
                const activitiesOfStudent = groupedBy[studentUsername];
                if (!activitiesOfStudent) continue;
            
                let totalNewDuration = 0;
                const newActivities = [];
            
                for (const activity of activitiesOfStudent) {
                    if (parseLastStringToEndDate(activity.date) < lastUpdatedAt) continue;
            
                    const { ip, hostname, date } = activity;
                    const activity_toDB = { ip, hostname, date };
            
                    const timeMatch = date.match(/\((\d+):(\d+)\)/);
                    if (timeMatch) {
                        const [, minutes, seconds] = timeMatch.map(Number);
                        const duration = minutes * 60 + seconds;
                        activity_toDB.duration = formatDuration(duration);
                        totalNewDuration += duration;
                    }
            
                    newActivities.push(activity_toDB);
                }
            
                if (newActivities.length === 0) continue;
            
                const updatedDuration = addDurationToExisted(
                    activity_.durationOfActivity || "00:00:00",
                    formatDuration(totalNewDuration)
                );
            
                const updated = await this.activityService.findOneAndUpdate(
                    { username: studentUsername },
                    {
                        $set: { durationOfActivity: updatedDuration },
                        $push: { activities: { $each: newActivities } }
                    },
                    { new: true }
                ).exec();
            
                if (updated.activities?.length > 300) {
                    updated.activities.sort((a, b) => new Date(a.date) - new Date(b.date));
                    updated.activities = updated.activities.slice(-150);
                    await updated.save();
                }
            }

            return handleResponse(res, 200, "Activities updated successfully");
        } catch (error) {
            console.error("Error fetching activity:", error.message);
            return handleResponse(res, error?.status || 500, error?.message || "Something went wrong");
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

    async countTheBest(req, res, limit) {
        try {
            const activities = await this.activityService.find().exec();
            if (!activities) {
                return handleResponse(res, 404, "Activities not found");
            }
            const bestActivities = calculateTopParticipants(activities, limit || 10);
            if(!bestActivities) {
                return handleResponse(res, 404, "Best activities not found");
            }
            return handleResponse(res, 200, "Best activities found", bestActivities);
        } catch (error) {
            return handleResponse(res, 500, error.message);
        }
    }

    async countTheBest_(limit) {
        try {
            const activities = await this.activityService.find().exec();
            if (!activities) {
                return {
                    status: 404,
                    message: "Activities not found"
                };
            }
            const bestActivities = calculateTopParticipants(activities, limit || 10);
            if (!bestActivities) {
                return {
                    status: 404,
                    message: "Best activities not found"
                };
            }
            return {
                status: 200,
                message: "Best activities found",
                data: bestActivities
            };
        } catch (error) {
            return {
                status: 500,
                message: error.message
            };
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

export default new ActivityController({ activityService: Activity, studentService: studentService.studentService });