import Activity from '../models/activity.model.js';
import { formatDuration, parseLastStringToEndDate, addDurationToExisted, calculateTopParticipants, hidePassword   } from '../utils/helper.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { handleResponse, getUserIdFromToken } from '../utils/response.js';
import { connectAndExecuteSSH } from '../ssh_connection/execution.js';
import {ssh_password, ssh_username} from '../config.js';

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
            const activities = await this.activityService.find().lean();
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
                : this.activityService.find({ [key]: value }).lean();

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

            const activity = await this.activityService.find({ firstName, lastName }).lean();
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
            return handleResponse(res, 201, "Activity created successfully", activity);
        } catch (error) {
            return handleResponse(res, 500, "Activity not created");
        }
    }

    // * For filling DB
    async createActivityFromScratch(students, activities) {
    try {
        const students_ = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const student_usernames = students.map((student) => student?.username);

        for (const name of student_usernames) {
            let lastOnline = null;
            let userActivity = [];
            let totalSeconds = 0;

            const activitiesOfStudent = activities[name];
            if (!activitiesOfStudent) continue;

            for (const activity of activitiesOfStudent) {
                const { ip, hostname, date } = activity;
                const activity_toDB = { ip, hostname, date };

                const timeMatch = date.match(/\((\d+):(\d+)\)/);
                let sessionSeconds = 0;

                if (timeMatch) {
                    const [, minutes, seconds] = timeMatch.map(Number);
                    sessionSeconds = minutes * 60 + seconds;
                    totalSeconds += sessionSeconds;
                }

                activity_toDB.duration = formatDuration(sessionSeconds);

                const activityDate = parseLastStringToEndDate(date);
                if (!lastOnline || activityDate > lastOnline) lastOnline = activityDate;

                userActivity.push(activity_toDB);
            }

            const that_student = students_.find((student) => student.id === name);
            const studentId = students.find((student) => student.username === name)?._id;

            const create = new Activity({
                username: name,
                firstName: that_student?.firstNameEN || '',
                lastName: that_student?.lastNameEN || '',
                studentId,
                createdAt: new Date(),
                lastUpdatedAt: new Date(),
                durationOfActivity: formatDuration(totalSeconds),
                activities: userActivity,
                lastOnline,
            });

            await create.save();

            await this.studentService.studentService.findOneAndUpdate(
                { username: name },
                { $push: { activities: create._id } },
                { new: true }
            ).lean();

            console.log(`Created activity for ${name}`);
        }

        console.log("All activities created and linked successfully.");
    } catch (error) {
        console.error("Error in createActivityFromScratch:", error);
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
            
            const updatedActivityOfStudent = await this.studentService.studentService.findOneAndUpdate(
                { username },
                { $push: { activities: existingActivity?.id } }, 
                { $set: {modifyAt: new Date() } },
                { new: true }
            ).lean();

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
    
            const activities = await this.activityService.find().lean();
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
                        $set: { durationOfActivity: updatedDuration,  lastOnline: lastOnline, lastUpdatedAt: new Date() },
                        $push: { activities: { $each: newActivities } }
                    },
                    { new: true }
                ).lean();
                updated_count++;
                console.log(updated)
            
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

    async fetchActivityAndUpdate_cmd() {
        try {
            const username = ssh_username;
            const password = ssh_password;
            // const { username, password } = req?.body || {};
            if (!username || !password) {
                return {
                    status: 400,
                    message: "Credentials are required"
                }
            }
            let updated_count = 0;
            const to_update = []
    
            const { groupedBy } = await connectAndExecuteSSH({ username, password });
    
            const activities = await this.activityService.find().lean();
            if (!activities) {
                return {
                    status: 404,
                    message: "Activities not found"
                }
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
                        $set: { durationOfActivity: updatedDuration, lastOnline: lastOnline, lastUpdatedAt: new Date() },
                        $push: { activities: { $each: newActivities } }
                    },
                    { new: true }
                ).lean();
                updated_count++;
                to_update.push(updated._id)
                if (updated.activities?.length > 300) {
                    updated.activities.sort((a, b) => new Date(a.date) - new Date(b.date));
                    updated.activities = updated.activities.slice(-150);
                    await updated.save();
                }
            }

            return {
                status: 200,
                message: `Activities updated successfully count: ${updated_count}`,
                ids:`${to_update.map((activity) => activity.toString()).join(", ")}`
            }
        } catch (error) {
            console.error("Error fetching activity:", error.message);
            return {
                status: error?.status || 500,
                message: error?.message || "Something went wrong"
            }
        }
    }
    async fetchActivityAndUpdate_proto(req, res) {
        try {
            const {authorization} = req.headers;
            const token = authorization.split(" ")[1];
            const userId = getUserIdFromToken(token);
            const student = await this.studentService.findById(userId).lean();
            if (!student) {
                return {
                    status: 404,
                    message: "Student not found"
                }
            }
            else if (student.role !== 'admin'){
                return {
                    status: 403,
                    message: "You are not allowed to access this page"
                }
            }
            const username = ssh_username;
            const password = ssh_password;
            // const { username, password } = req?.body || {};
            if (!username || !password) {
                return {
                    status: 400,
                    message: "Credentials are required"
                }
            }
            let updated_count = 0;
            const to_update = []
    
            const { groupedBy } = await connectAndExecuteSSH({ username, password });
    
            const activities = await this.activityService.find().lean();
            if (!activities) {
                return {
                    status: 404,
                    message: "Activities not found"
                }
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
                        $set: { durationOfActivity: updatedDuration, lastOnline: lastOnline, lastUpdatedAt: new Date() },
                        $push: { activities: { $each: newActivities } }
                    },
                    { new: true }
                ).lean();
                updated_count++;
                to_update.push(updated._id)
                if (updated.activities?.length > 300) {
                    updated.activities.sort((a, b) => new Date(a.date) - new Date(b.date));
                    updated.activities = updated.activities.slice(-150);
                    await updated.save();
                }
            }

            return {
                status: 200,
                message: `Activities updated successfully count: ${updated_count}`,
                ids:`${to_update.map((activity) => activity.toString()).join(", ")}`
            }
        } catch (error) {
            console.error("Error fetching activity:", error.message);
            return {
                status: error?.status || 500,
                message: error?.message || "Something went wrong"
            }
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

            const updatedActivityOfStudent = await this.studentService.studentService.findOneAndUpdate(
                { username: existingActivity.username },
                { $set: { activities: [] } },
                { new: true }
            ).lean();

            if (!updatedActivityOfStudent) {
                return handleResponse(res, 500, "Activity not updated");
            }

            return handleResponse(res, 200, "Activity updated successfully", updatedActivityOfStudent);
        } catch (error) {
            console.error("Error updating activity:", error.message);
            return handleResponse(res, 500, "An error occurred while updating the activity");
        }
    }

    async countTheBest(req, res, params) {
        try {
            let { limit, group } = params;
            const activities_ = await this.activityService.find().lean();
            let activities = [];
            if (!activities_) {
                return handleResponse(res, 404, "Activities not found");
            }
            if (group !== "all") {
                for (const activity of activities_) {
                    const student = await this.studentService.studentService.findById(activity.studentId).lean();
                    if (!student) {
                        return handleResponse(res, 404, "Student not found");
                    }
                    if (student.group === group) {
                        activities.push(activity);
                    }
                }
            }
            else activities = activities_;
            if (limit > activities.length) {
                limit = activities.length;
            }
            const bestActivities = calculateTopParticipants(activities, limit || 10);

            if(!bestActivities) {
                return handleResponse(res, 404, "Best activities not found");
            }
            console.log(bestActivities)
            return handleResponse(res, 200, "Best activities found", bestActivities);
        } catch (error) {
            return handleResponse(res, 500, error.message);
        }
    }

    async countTheBest_(limit) {
        try {
            const activities = await this.activityService.find().lean();
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
    
    async update_recount_duplicates(req, res) {
        try {
            const activities = await this.activityService.find().lean();
            if (!activities || activities.length === 0) {
                return handleResponse(res, 404, "Activities not found");
            }
    
            for (const activity of activities) {
                const activityList = activity.activities || [];
                let totalDuration = "00:00:00";
                const uniqueActivities = Array.from(
                    new Map(activityList.map(item => [item.date, item])).values()
                ).sort((a, b) => new Date(a.date) - new Date(b.date));
    
                for (const act of uniqueActivities) {
                    const timeMatch = act.date.match(/\((\d+):(\d+)\)/);
                    let sessionSeconds = 0;
    
                    if (timeMatch) {
                        const [, minutes, seconds] = timeMatch.map(Number);
                        sessionSeconds = minutes * 60 + seconds;
                    }
                    act.duration = formatDuration(sessionSeconds);
                    totalDuration = addDurationToExisted(totalDuration, act.duration || "00:00:00");
                }
    
                activity.activities = uniqueActivities;
                console.log(activity.username, totalDuration);
                activity.durationOfActivity = totalDuration;
                await activity.save();
            }
    
            return handleResponse(res, 200, "Activities cleaned and durations updated successfully.");
        } catch (error) {
            console.error("Error in update_recount_duplicates:", error);
            return handleResponse(res, 500, error.message || "Internal Server Error");
        }
    }

    async getMe(req, res) {
        try {
            const { authorization } = req.headers;
            const token = authorization.split(" ")[1];
            const userId = getUserIdFromToken(token);

            const student = await this.activityService.find({ studentId: userId}).lean();
            if (!student) {
                return handleResponse(res, 404, "Student's activity not found");
            }

            return handleResponse(res, 200, "Student's activity found", hidePassword(student));
        } catch (error) {
            return handleResponse(res, 500, error.message);
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

// export default new ActivityController({ activityService: Activity, studentService: studentService.studentService });
export default ActivityController