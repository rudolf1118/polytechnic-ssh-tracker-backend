import { activityService, studentService } from "../controller/controllers.js"
import { initializeServerDB, closeServerDB } from "../server.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parameter = process.argv[2]

export const activityList = async (filter) => {
    try {
        await initializeServerDB();
        const {username} = filter;
        const list = await activityService.activityService.find(username ? { username} : null).exec();
        // console.table(list)
        let count = 0;
        list.forEach((student) => {
            count++;
            student._doc.activities.sort((a, b) => {
                const timeA = a.match(/\((\d{2}):(\d{2})\)/);
                const timeB = b.match(/\((\d{2}):(\d{2})\)/);
                const minutesA = parseInt(timeA[1]) * 60 + parseInt(timeA[2]);
                const minutesB = parseInt(timeB[1]) * 60 + parseInt(timeB[2]);
                return minutesA - minutesB;
            });
            console.log(
            `\x1b[36mID:\x1b[0m ${student._doc._id.buffer.toString('hex')}\n` +
            `\x1b[33mFirst Name (EN):\x1b[0m ${student._doc.firstNameEN}\n` +
            `\x1b[33mLast Name (EN):\x1b[0m ${student._doc.lastNameEN}\n` +
            `\x1b[32mFirst Name (AM):\x1b[0m ${student._doc.firstNameAM}\n` +
            `\x1b[32mLast Name (AM):\x1b[0m ${student._doc.lastNameAM}\n` +
            `\x1b[35mUsername:\x1b[0m ${student._doc.username}\n` +
            `\x1b[34mCreated At:\x1b[0m ${student._doc.createdAt}\n` +
            `\x1b[31mModified At:\x1b[0m ${student._doc.modifyAt}\n` +
            `\x1b[33mActivities:\x1b[0m ${student._doc.activities}\n` +
            `\x1b[35mGroup:\x1b[0m ${student._doc.group}\n` +
            `\x1b[36m----------------------------------------\x1b[0m`
            );
        });
        closeServerDB();
        process.exit(0);
    } catch (error) {
        console.error('Error fetching student list:', error);
        closeServerDB();
        throw error;
    }
}

if (!parameter) {
    await activityList()
};
if (parameter.includes('username') ) {
    const filterToPass = parameter.split('=');
    const filterObj = { [filterToPass[0].toString()]: filterToPass[1] };
    await activityList(filterObj);
}
if (parameter === "addActivities") { 
    await initializeServerDB();
    const data = fs.readFileSync(path.join(__dirname, '../db_example/test_db_groupedByUsername.json'), 'utf-8')
    if (data) {
        const parsed = JSON.parse(data);
        const students = await studentService.studentService.find().exec();
        const result = await activityService.createActivityFromScratch(students, parsed);
    }
}
if (parameter === 'updateActivities') {
    await initializeServerDB();
        const students = await studentService.studentService.find().exec();
        for (const student of students) {
            const result = await activityService.updateActivityOfStudents(student);
            console.log(result)
        }
}