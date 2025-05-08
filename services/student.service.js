import { comparePassword } from '../utils/passwordComparing.js';
export class StudentService {
    constructor(configuration) {
        this.studentModel = configuration.StudentModel;
    }

    async findById(id) {
        try {
            const student = await this.studentModel.findById(id);
            if (!student) {
                return { status: 404, message: 'Student not found' };
            }
            return { status: 200, message: 'Student found', data: student };
        } catch (error) {
            return { status: 500, message: 'Something went wrong', error: error.message };
        }
    }

    async findOne(parameter, session = null) {
        try {
            const query = this.studentModel.findOne({ ...parameter });
            if (session) query.session(session);
            const student = await query.exec();
            if (!student) {
                return { message: "Student not found" };
            }
            return { message: "Student found", student };
        } catch (error) {
            return { message: "Something went wrong", error: error.message };
        }
    }
}
