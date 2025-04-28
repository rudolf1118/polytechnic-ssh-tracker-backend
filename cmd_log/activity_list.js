import { activityService, studentService } from "../controller/controllers.js"
import { initializeServerDB, closeServerDB } from "../server.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import log from '../utils/log.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parameter = process.argv[2]

export const activityList = async (filter) => {
    try {
        await initializeServerDB();
        const { username } = filter || {};
        const filterCriteria = {};
        if (filter) {
            if (typeof filter === 'string') {
            const filters = filter.includes('&') ? filter.split('&') : [filter];
            if (filters.length > 1) {
                filterCriteria.$and = filters.map(pair => {
                    const [key, value] = pair.split('=');
                    if (key && value) {
                        return { [key]: value };
                    }
                    return null;
                }).filter(Boolean);
            } else {
                filters.forEach(pair => {
                    const [key, value] = pair.split('=');
                    if (key && value) {
                        filterCriteria[key] = value;
                    }
                });
            }
            } else if (typeof filter === 'object') {
            Object.assign(filterCriteria, filter);
            }
        }
        const list = await activityService.activityService.find(Object.keys(filterCriteria).length ? filterCriteria : null).lean();
        // console.table(list)
        let count = 0;
        list.forEach((student) => {
            count++;
            student._doc.activities.sort((a, b) => {
                const timeA = typeof a === 'string' ? a.match(/\((\d{2}):(\d{2})\)/) : null;
                const timeB = typeof b === 'string' ? b.match(/\((\d{2}):(\d{2})\)/) : null;
                const minutesA = timeA ? parseInt(timeA[1]) * 60 + parseInt(timeA[2]) : 0;
                const minutesB = timeB ? parseInt(timeB[1]) * 60 + parseInt(timeB[2]) : 0;
                return minutesA - minutesB;
            });
            console.log(
            `\x1b[36mID:\x1b[0m ${student._doc._id.buffer.toString('hex')}\n` +
            `\x1b[33mUsername:\x1b[0m ${student._doc.username}\n` +
            `\x1b[33mFirst Name (EN):\x1b[0m ${student._doc.firstName}\n` +
            `\x1b[32mLast Name (EN):\x1b[0m ${student._doc.lastName}\n` +
            `\x1b[33mStudent ID:\x1b[0m ${student._doc.studentId}\n` +
            `\x1b[34mCreated At:\x1b[0m ${student._doc.createdAt}\n` +
            `\x1b[31mLast Updated At:\x1b[0m ${student._doc.lastUpdatedAt}\n` +
            `\x1b[32mDuration Of Activity:\x1b[0m ${student._doc.durationOfActivity}\n` +
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
if (parameter.includes('=')) {
    const filterToPass = parameter.split('=');
    const filterObj = { [filterToPass[0].toString()]: filterToPass[1] };
    await activityList(filterObj);
}
if (parameter === "addActivities") { 
    await initializeServerDB();
    const data = fs.readFileSync(path.join(__dirname, '../db_example/test_db_groupedByUsername.json'), 'utf-8')
    if (data) {
        const parsed = JSON.parse(data);
        const students = await studentService.studentService.find().lean();
        const result = await activityService.createActivityFromScratch(students, parsed);
    }
}
if (parameter === 'updateActivities') {
    await initializeServerDB();
        const students = await studentService.studentService.find().lean();
        for (const student of students) {
            const result = await activityService.updateActivityOfStudents(student);
        }
}
if (parameter === 'updateActivities_') {
    await initializeServerDB();
        const students = await studentService.studentService.find().lean();
        for (const student of students) {
            const result = await activityService.updateActivityOfStudents(student);
        }
}

if (parameter === 'sync_activities') {
    await initializeServerDB();
    const res = await activityService.fetchActivityAndUpdate_cmd();
    console.log(res);
    process.exit(0);
}
if (parameter === 'getTopParticipants') {
    await initializeServerDB();

    log.info("Please specify the number of top participants you want to see (e.g. 1, 3, 5):");

    const topCount = await new Promise(resolve => {
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.once('data', (input) => {
            process.stdin.pause();
            const number = parseInt(input.trim(), 10);
            if (!isNaN(number) && number > 0) {
            resolve(number);
            } else {
            console.log("Invalid input. Using default top=5");
            resolve(5);
            }
        });
    });

    const { data } = await activityService.countTheBest_(topCount);
    log.success(`Top ${topCount} Participants:`);
    data .forEach((student, index) => {
        log.info(`NO ${index + 1}.`);
        log.info(`\x1b[33mUsername:\x1b[0m ${student.username}`);
        log.info(`\x1b[32mFull Name:\x1b[0m ${student.fullName}`);
        log.info(`\x1b[36mTotal Sessions:\x1b[0m ${student.totalSessions}`);
        log.info(`\x1b[34mTotal Duration:\x1b[0m ${student.totalDuration}`);
        log.info(`\x1b[35mUnique IPs:\x1b[0m ${student.uniqueIPs}`);
        log.info(`\x1b[31mScore:\x1b[0m ${student.score}`);
        log.info('----------------------------------------');
    });
    closeServerDB();
    process.exit(0);
}