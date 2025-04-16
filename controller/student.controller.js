import Student from '../schemas/student.schema.js';
import { handleResponse } from '../utils/response.js';
import { authService } from './controllers.js';
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
            const { firstNameEN, lastNameEN, username } = req.body;
            if (!firstNameEN || !lastNameEN || !username) {
                return handleResponse(res, 400, "firstNameEN, lastNameEN and username are required");
            }
            const existingStudent = await this.studentService.findOne({ username });
            if (existingStudent) {
                return handleResponse(res, 409, "Student already exists");
            }
            // * Create new student
            const newStudent = new Student({
                username,
                firstNameEN,
                lastNameEN,
                activities: []
            }
            );
            await newStudent.save();
            return handleResponse(res, 201, "Student created", newStudent);
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

    async updatePassword(req, res) {
        try {
            const { username, password, oldPassword, newPassword} = req.body;
            if (!username || !password) {
                return handleResponse(res, 400, "id and password are required");
            }

            const student = await this.studentService.find({ username }).exec();
            if (!student) {
                return handleResponse(res, 404, "Student not found");
            }
            const currentPassword = student.password ? newPassword : password;
            const toChange = await authService.comparePassword(username, currentPassword);
            if (toChange) {
                const encrypted_password = await bcrypt.hash(newPassword, 10);
                student.password = encrypted_password;
            } else {
                return handleResponse(res, 401, "Password is invalid, make sure it is the right one!");
            }
            const encrypted_password = await bcrypt.hash(password, 10);
            student.password = encrypted_password;
            await student.save();
            return handleResponse(res, 200, "Password updated", student);
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

export default new StudentController({ studentService: Student });