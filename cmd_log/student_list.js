import { studentService } from "../controller/controllers.js"
import { initializeServerDB, closeServerDB } from "../server.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parameter = process.argv[2]
import ora from 'ora';

export const studentList = async (filter) => {
    const spinner = ora('Connecting to database...').start();
    try {
        await initializeServerDB();
        spinner.text = 'Fetching student list...';

        const list = await studentService.studentService.find().lean();
        spinner.succeed('Data fetched successfully!\n');

        let count = 0;
        list.forEach((student) => {
            count++;
            console.log(
            `\x1b[36mID:\x1b[0m ${student._id.toString()}\n` +
            `\x1b[33mFirst Name (EN):\x1b[0m ${student.firstNameEN}\n` +
            `\x1b[33mLast Name (EN):\x1b[0m ${student.lastNameEN}\n` +
            `\x1b[32mFirst Name (AM):\x1b[0m ${student.firstNameAM}\n` +
            `\x1b[32mLast Name (AM):\x1b[0m ${student.lastNameAM}\n` +
            `\x1b[35mUsername:\x1b[0m ${student.username}\n` +
            `\x1b[34mCreated At:\x1b[0m ${student.createdAt}\n` +
            `\x1b[31mModified At:\x1b[0m ${student.modifyAt}\n` +
            `\x1b[33mActivities:\x1b[0m ${student.activities}\n` +
            `\x1b[35mGroup:\x1b[0m ${student.group}\n` +
            `\x1b[36m----------------------------------------\x1b[0m`
            );
        });
        await closeServerDB();
        process.exit(0);
    } catch (error) {
        spinner.fail('Failed to fetch data.');
        console.error('Error fetching student list:', error);
        await closeServerDB();
        process.exit(1);
    }
}

if (!parameter) await studentList();
if (parameter === "updateGroups") { 
    await initializeServerDB();
    const data = fs.readFileSync(path.join(__dirname, '../db_example/students_with_group.json'), 'utf-8')
    if (data) {
        const parsed = JSON.parse(data);
        for (const student of parsed) {
            const result = await studentService.updateStudentsGroup(student);
            console.log(result);
        }
    }
    await closeServerDB();
}
if (parameter === "updateActivitiesOfStudent") { 
    await initializeServerDB();
    const students = await studentService.studentService.find().lean();
    for (const student of students) {
            const result = await studentService.updateActivitiesOfStudent__(student);
            console.log(result);
        }
    await closeServerDB();
}

if (parameter === 'addStudents') {
    await initializeServerDB();
    const data = fs.readFileSync(path.join(__dirname, '../db_example/students_with_group.json'), 'utf-8')
    if (data) {
        const parsed = JSON.parse(data);
        for (const student of parsed) {
            const result = await studentService.createStudentFromScratch(student);
            console.log(result);
        }
    }
    await closeServerDB();
}