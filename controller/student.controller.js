import Student from '../schemas/student.schema.js';
import { handleResponse, getUserIdFromToken } from '../utils/response.js';
import { authService, activityService } from './controllers.js';
import { encrypt } from '../utils/crypto.js';
import { hidePassword } from '../utils/helper.js';

class StudentController {

    constructor(configuration) {
        this.studentService = configuration.studentService;
    }

    async getStudents(req, res) {
        try {
            const students = await this.studentService.find();
            if (!students) {
                return handleResponse(res, 404, "No students found");
            }
            return handleResponse(res, 200, "Students found", hidePassword(students));
        } catch (error) {
            return handleResponse(res, 500, error.message);
        }
    }

    async checkRole(username) {
        try {
            const student = await this.studentService.find({ username });
            if (!student) {
                return {
                    status: 404,
                    message: "Student not found"
                };
            }
            if (student.role === "admin") {
                return {
                    status: 200,
                    message: "Student is admin",
                    data: { student },
                    role: "admin"
                };
            }
            return {
                status: 200,
                message: "Student is admin",
                data: { student },
                role: "user"
            };
        } catch (error) {
            throw new Error(JSON.stringify({
                status: 500,
                message: "An error occurred while checking the role",
                error: error.message
            }));
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
            console.log(this.studentService)
            const query = key === 'id'
                ? this.studentService.findById(value).lean()
                : this.studentService.find({ [key]: value }).lean();

            const student = await query;

            if (!student) {
                return handleResponse (res, 404, "Student not found");
            }

            return handleResponse(res, 200, "Student found", hidePassword(student));
        } catch (error) {
            return handleResponse(res, 500, error.message);
        }
    }

    async getMe(req, res) {
        try {
            const { authorization } = req.headers;
            const token = authorization.split(" ")[1];
            const user_id = getUserIdFromToken(token);
            const student = await this.studentService.findById(user_id).lean();
            if (!student) {
                return handleResponse(res, 404, "Student not found");
            }
            return handleResponse(res, 200, "Student found", hidePassword(student));
        } catch (error) {
            return handleResponse(res, 500, error.message);
        }
    }

    async getStudentsByGroup(param, res) {
        try {
            const { group } = param.params;
            let students;
            if (group === 'all') {
                students = await this.studentService.find().lean();
            } else {
                students = await this.studentService.find({ group }).lean();
            }
            if (!students) {
                return handleResponse(res, 404, "Students not found");
            }
            return handleResponse(res, 200, "Students found", hidePassword(students));
        } catch (error) {
            return handleResponse(res, 500, error.message);
        }
    }
    async updatePassword(req, res) {
        try {
            const { username, password, newPassword} = req.body;
            if (!username || !password) {
                return handleResponse(res, 400, "id and password are required");
            }

            const student = await this.studentService.find({ username }).lean();
            if (!student) {
                return handleResponse(res, 404, "Student not found");
            }
            const currentPassword = student.password ? newPassword : password;
            const toChange = await authService.comparePassword(username, currentPassword, res);
            if (toChange) {
                const {iv, encryptedData} = encrypt(newPassword);
                student.password = iv + ":" + encryptedData;
                await student.save();
                return handleResponse(res, 200, "Password updated", student);
            } else {
                return handleResponse(res, 401, "Password is invalid, make sure it is the right one!");
            }
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
            }).lean();

            if (!student) {
                return handleResponse (res, 404, "Student not found");
            }

            return handleResponse(res, 200, "Student found", hidePassword(student));
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
                lastUpdatedAt: student.modifyAt,
                password: "",
                group: student.group,
                activities: []
            });

            console.log(created);
            await created.save();
            console.log("saved");
        } catch (error) {
            throw new Error(`Error creating student: ${error.message}`);
        }
    }
    async updateActivitiesOfStudent__(student) {
        try {
            const { username, id } = student;
            const activitiesFromDB = await activityService.activityService.find({ studentId: id }).lean();
            
            const { id: _id } = activitiesFromDB[0];
            const updatedStudent = await this.studentService.findOneAndUpdate(
                { username },
                { $set: { activities: _id } },
                { new: true }
            ).lean();

            if (!updatedStudent) {
                throw new Error("Failed to update student activities");
            }

            return {
                status: 200,
                message: "Student activities updated successfully",
                data: updatedStudent
            };
        } catch (error) {
            console.error("Error updating student activities:", error.message);
            return {
                status: 500,
                message: "An error occurred while updating the student activities"
            };
            
        }
    }
    async updateStudentsGroup(student) {
        try {
            const { id } = student;
            console.log("OLD", student);
            const existingStudent = await this.studentService.findOne({ username:id }).lean();
            console.log(existingStudent)
            if (!existingStudent) {
                return {
                    status: 404,
                    message: "Student not found"
                };
            }
            const updatedStudent = await this.studentService.findOneAndUpdate(
            { username:id },
            { $set: { group: student.group } },
            { new: true } // Return the updated document
            ).lean();
            console.log(updatedStudent);
            if (!updatedStudent) {
            return {
                status: 500,
                message: "Student not updated"
            };
            }
            return {
            status: 200,
            message: "Student updated successfully",
            data: updatedStudent
            };
        } catch (error) {
            console.error("Error updating student group:", error.message);
            return {
            status: 500,
            message: "An error occurred while updating the student group"
            };
        }
    }
}

export default new StudentController({ studentService: Student });
