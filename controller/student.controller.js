import Student from '../schemas/student.schema.js';
import { handleResponse } from '../utils/response.js';

class StudentController {
    controller(configuration) {
        this.studentService = configuration.studentService;
    }

    async getStudents(req, res) {
        try {
            const students = await Student.find();
            if (!students) {
                return handleResponse(res, 404, "No students found");
            }
            return handleResponse(res, 200, "Students found", students);
        } catch (error) {
            return handleResponse(res, 500, error.message);
        }
    }

    async createStudent(req, res) {
        try {
            const student = await this.studentService.createStudent(req.body);
            return handleResponse(res, 201, "Student created", student);
        } catch (error) {
            return handleResponse(res, 500, error.message);
        }
    }

    async getStudent(req, res, key) {
        try {
            const value = req?.params[key];
            if (!value) throw new Error(`${key} is required`);

            const query = key === 'id'
                ? this.studentService.findById(value)
                : this.studentService.find({ [key]: value }).exec();

            const student = await query;

            if (!student) {
                return handleResponse (res, 404, "Student not found");
            }

            return handleResponse(res, 200, "Student found", student);
        } catch (error) {
            return handleResponse(res, 500, error.message);
        }
    }

    async getStudentByNameSurname(req, res) {
        try {
            const firstName = req?.params.firstName;
            const lastName = req?.params.lastName;

            if (!firstName || !lastName) throw new Error("firstName and lastName are required");

            const student = await this.studentService.find({
                firstNameEN: firstName,
                lastNameEN: lastName
            }).exec();

            if (!student) {
                return handleResponse (res, 404, "Student not found");
            }

            return handleResponse(res, 200, "Student found", student);
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
    // * for filling DB
    async createStudentFromScratch(student) {
        try {
            const created = new Student({
                username: student.id,
                firstNameAM: student.firstNameAM,
                lastNameAM: student.lastNameAM,
                firstNameEN: student.firstNameEN,
                lastNameEN: student.lastNameEN,
                createdAt: student.createdAt,
                modifyAt: student.modifyAt,
                activities: []
            });

            console.log(created);
            await created.save();
            console.log("saved");
        } catch (error) {
            throw new Error(`Error creating student: ${error.message}`);
        }
    }
}

export const studentService = new StudentController({ studentService: Student });