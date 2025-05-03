import { handleResponse, getUserIdFromToken, handleResponse_ } from '../utils/response.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import tokenGenerator from '../jwt/generate_token.js';
import { instance as SSHConnection } from '../ssh_connection/client.js';
import jwt from 'jsonwebtoken';
import { jwt_secret, admin_basic_password, admin_basic_username, basic_username, basic_password } from '../config.js';
import { hidePassword } from '../utils/helper.js';
import mongoose from 'mongoose';
import log from '../utils/log.js';

class AuthController {

    constructor(configuration) {
        this.student_service = configuration.studentService;
        this.studentService = configuration.studentService;
        this.sessionService = configuration.sessionService;
        this.authService = configuration.authService;
        this.decorator = configuration.decorator;
    }

    async comparePasswordDB (username, password) {
        try {
            const student = await this.studentService.findOne({ username });
            if (!student) {
                return false;
            }
            if (!student.password) {
                await this.studentService.updatePassword(username, password);
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
        // eslint-disable-next-line no-useless-catch
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


    async login(req, res) {
        return handleResponse_({...await this.authService.login(req, res), res});
    }

    async setConnection(req, res) {
        return handleResponse(await this.decorator.withAuth(req, res, this.authService.setConnection.bind(this.authService, req, res)));
    }

    async disconnect(req, res) {
        return handleResponse(await this.decorator.withAuth(req, res, this.authService.disconnect.bind(this.authService, req, res)));
    }

    async checkToken(req, res, end = true) {
        return handleResponse(await this.decorator.withAuth(req, res, this.checkToken.bind(this, req, res, end)));
    }

    async checkToken_(req, res, end = false) {
        try {
            const { authorization } = req.headers;
            if (!authorization) {
                throw new Error("Authorization header is required");
            }
            const token = authorization.split(" ")[1];
            const user_id = getUserIdFromToken(token);
            if (!user_id) {
                throw new Error("Invalid token");
            }
            const student = await this.student_service.findById(user_id);
            if (!student) {
                throw new Error("Invalid token");
            }
            const decoded = jwt.verify(token, jwt_secret);
            if (!decoded || decoded.id !== student._id.toString()) {
                throw new Error("Invalid token");
            }
            return true;
        } catch (error) {
            if (end) {
                return handleResponse(res, 401, error.message);
            }
            throw error;
        }
    }


    async checkBasic(req, res) {
        try {
            const { authorization } = req.headers;
            if (!authorization || !authorization.startsWith('Basic ')) {
                return handleResponse(res, 401, "Authorization header missing or invalid");
            }

            const token = authorization.split(' ')[1];
            const decoded = Buffer.from(token, 'base64').toString('utf-8');
            const [username, password] = decoded.split(':');

            if (!username || !password) {
                return handleResponse(res, 401, "Invalid authorization format");
            }

            if (username !== basic_username || password !== basic_password) {
                return handleResponse(res, 401, "Invalid username or password");
            }

            return true;
        } catch (error) {
            console.error(error);
            return handleResponse(res, 500, "Internal Server Error");
        }
    }

    async executeSSHCommand(req, res) {
        try {
            const { authorization } = req.headers;
            const token = authorization.split(" ")[1];
            const user_id = getUserIdFromToken(token);
            const student = await this.student_service.findById(user_id);
            if (!student) {
                return handleResponse(res, 401, "Invalid username or password");
            }
            const ssh_client = SSHConnection;
            const { command } = req.body;
            if (!command) {
                return handleResponse(res, 400, "Command is required");
            }
            const result = await ssh_client.execCommand(command);
            console.log(result)
            return handleResponse(res, 200, "Command executed successfully", result);
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

// export default new AuthController({studentService: studentService.studentService, sessionService: sessionService});
export default AuthController;