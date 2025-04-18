import { handleResponse, getUserIdFromToken } from '../utils/response.js';
import { checkCredentials } from '../ssh_connection/execution.js';
import { studentService } from './controllers.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import tokenGenerator from '../jwt/generate_token.js';
import { instance as SSHConnection } from '../ssh_connection/client.js';
import jwt from 'jsonwebtoken';
import { jwt_secret } from '../config.js';

class AuthController {

    constructor(configuration) {
        this.student_service = configuration.studentService;
    }
    async comparePassword (username, password, res) {
        try {
            const result = await checkCredentials(username, password);
            console.log(result)
            if (!result) {
                return {status: 401, message: "Invalid username or password"};
            }
            else if (result) {
                return { res, status: 200, message: "Password is valid" };
            };
        } catch (error) {
            throw new Error ({res, status: 500, message: "Something went wrong", error})
        }
    }

    async comparePasswordDB (username, password) {
        try {
            const student = await this.student_service.findOne({ username });
            console.log(student)
            if (!student) {
                return false;
            }
            if (!student.password) {
                await studentService.updatePassword(username, password);
                return true;
            }

            if (student.password === password) {
                return true;
            }
            else return false;
        } catch (error) {
            return false;
        }
    }

    async generateToken(user) {
        try {
            const [db_checking] = await Promise.all([
                this.comparePasswordDB(user.username, user.password)
            ]);
            console.log(user.password)
            console.log(db_checking)
            if (!db_checking) {
                return { status: 401, message: "Invalid username or password" };
            }
            const token = await tokenGenerator(user._id.toString(), user.role);
            return {status: 200, message: "Token generated successful", token};
        } catch (error) {
            throw error;
        }
    }
    async login (req, res) {
        try {
            console.log(req.body)
            const { username, password } = req.body;
            let isMatch;
            const {iv, encryptedData} = encrypt(password);
            const encrypted_requested_password = iv + ":" + encryptedData;
            if (!username || !password) {
                return handleResponse(res, 400, "username and password are required");
            }
            const user = await this.student_service.findOne({ username });
            if (!user) {
                return handleResponse(res, 401, "Invalid username or password");
            }
            if (!user.password) {
                isMatch = await this.comparePassword(username, password, res).catch((error) => {throw error});
            }
            else if (user.password) {
                isMatch = await this.comparePassword(username, decrypt(user.password.split(":")[1], user.password.split(":")[0]), res).catch((error) => {throw error});
            }
            if (!isMatch || !(isMatch.status >= 200 && isMatch.status <= 399)) {
                console.log(isMatch.status)
                return handleResponse(res, 401, "Invalid username or password");
            }
            if (user.password && user.password !== encrypted_requested_password)  {
                return handleResponse(res, 401, "Invalid username or password");
            }
            else {
                const {iv, encryptedData} = encrypt(password);
                user.password = iv + ":" + encryptedData;
                await this.student_service.updateOne({ username }, { password: user.password });
            }
            const token = await this.generateToken(user);
            if (!token || !(token.status >= 200 && token.status <= 399)) {
                console.log(token)
                return handleResponse(res, 401, "Invalid username or password");
            }

            return handleResponse(res, 200, "Login successful", token);
        } catch (error) {
            return handleResponse(res, 500, error.message);
        }
    }

    async setConnection(req, res) {
        try {
            const { authorization } = req.headers;
            const token = authorization.split(" ")[1];
            const user_id = getUserIdFromToken(token);
            console.log(user_id)
            const student = await this.student_service.findById(user_id);
            console.log(student)
            if (!student) {
                return handleResponse(res, 401, "Invalid username or password");
            }
            const { username, password: encrypted_password } = student;
            const real_password = decrypt(encrypted_password.split(":")[1], encrypted_password.split(":")[0]);
            const ssh_client = SSHConnection;
            console.log(real_password)
            ssh_client.updateConnectionParams(username, real_password);
            await ssh_client.connect().catch((error) =>{
                throw {status: 404, message: error.message};
            })
            return handleResponse(res, 200, "Connection successful");
        } catch (error) {
            handleResponse(res, error.status || 500, error.message);
            throw error;
        }
    }

    async disconnect(req, res) {
        try {
            const { authorization } = req.headers;
            const token = authorization.split(" ")[1];
            const user_id = getUserIdFromToken(token);
            const student = await this.student_service.findById(user_id);
            if (!student) {
                return handleResponse(res, 401, "Invalid username or password");
            }
            const ssh_client = SSHConnection;
            ssh_client.disconnect();
            return handleResponse(res, 200, "Disconnected successfully");
        } catch (error) {
            handleResponse(res, error.status || 500, error.message);
            throw error;
        }
    }

    async checkToken(req, res, end = true) {
        try {
            const { authorization } = req.headers;
            if (!authorization) return handleResponse(res, 401, "Authorization header is required", null,  end);
            const token = authorization.split(" ")[1];
            const user_id = getUserIdFromToken(token);
            if (!user_id) return handleResponse(res, 401, "Invalid token", null, end);
            const student = await this.student_service.findById(user_id);
            if (!student) return handleResponse(res, 401, "Invalid token", null, end);
            const decoded = jwt.verify(token, jwt_secret);
            if (!decoded) return handleResponse(res, 401, "Invalid token");
            if (decoded.id !== student._id.toString()) return handleResponse(res, 401, "Invalid token", null, end);
            return handleResponse(res, 200, "Token is valid", student, end);
        } catch (error) {
            return handleResponse(res, 500, error.message, null, end);
        }
    }

    async checkToken_(req, res) {
        try {
            const { authorization } = req.headers;
            if (!authorization) return { status: 401, message: "Authorization header is required"};
            const token = authorization.split(" ")[1];
            const user_id = getUserIdFromToken(token);
            if (!user_id) return { status: 401, message: "Invalid token"};
            const student = await this.student_service.findById(user_id);
            if (!student) return { status: 401, message: "Invalid token"};
            const decoded = jwt.verify(token, jwt_secret);
            if (!decoded) return { status: 401, message: "Invalid token" };
            if (decoded.id !== student._id.toString()) return { status: 401, message: "Invalid token"};
            return {res, status: 200, message: "Token is valid", student};
        } catch (error) {
            return { status: 500, message: error.message };

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

export default new AuthController({studentService: studentService.studentService});