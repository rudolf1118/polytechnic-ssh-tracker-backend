import { handleResponse, getUserIdFromToken } from '../utils/response.js';
import { checkCredentials } from '../ssh_connection/execution.js';
import { studentService } from './controllers.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import tokenGenerator from '../jwt/generate_token.js';
import { instance as SSHConnection } from '../ssh_connection/client.js';
import jwt from 'jsonwebtoken';
import { jwt_secret, admin_basic_password, admin_basic_username, basic_username, basic_password } from '../config.js';
import { hidePassword } from '../utils/helper.js';

class AuthController {

    constructor(configuration) {
        this.student_service = configuration.studentService;
    }
    async comparePassword (username, password, res) {
        try {
            const result = await checkCredentials(username, password);
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


    async login (req, res) {
        try {
            // eslint-disable-next-line no-unsafe-optional-chaining
            const { username, password } = req?.body;
            let isMatch;
            const {iv, encryptedData} = encrypt(password);
            const encrypted_requested_password = iv + ":" + encryptedData;

            if (!username || !password) {
                return handleResponse(res, 400, "username and password are required");
            }
            const user = await this.student_service.findOne({ username }).lean();
            if (!user) {
                return handleResponse(res, 401, "Invalid username or password");
            }
            const credentials = user?.role === 'admin'  
            ? { username: admin_basic_username, password: admin_basic_password } :
            ( user?.password ? {username, password: decrypt(user.password.split(":")[1], user.password.split(":")[0]) } : { username, password });
            
            isMatch = await this.comparePassword(credentials.username, credentials.password, res).catch((error) => {throw error});
            
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

            return handleResponse(res, 200, "Login successful", { token: token.token, user: hidePassword(user) });
        } catch (error) {
            return handleResponse(res, 500, error.message);
        }
    }

    async setConnection(req, res) {
        try {
            const { authorization } = req.headers;
            const token = authorization.split(" ")[1];
            const user_id = getUserIdFromToken(token);
            const student = await this.student_service.findById(user_id);
            if (!student) {
                return handleResponse(res, 401, "Invalid username or password");
            }
            let credentials;
            if (student.role === "admin") {
                credentials = { username: admin_basic_username, password: admin_basic_password };
            }
            else {
                credentials = { username: student.username, password: decrypt(student.password.split(":")[1], student.password.split(":")[0]) };
            }
            const { username, password: encrypted_password } = student;
            const real_password = decrypt(encrypted_password.split(":")[1], encrypted_password.split(":")[0]);
            const ssh_client = SSHConnection;
            console.log(real_password)
            ssh_client.updateConnectionParams(username, real_password);
            await ssh_client.connect(credentials).catch((error) =>{
                throw {status: 404, message: error.message};
            })
            return handleResponse(res, 200, "Connection successful");
        } catch (error) {
            return handleResponse(res, error.status || 500, error.message);
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
            const student = await this.student_service.findById(user_id).lean();
            console.log(student)
            if (!student) return handleResponse(res, 401, "Invalid token", null, end);
            const decoded = jwt.verify(token, jwt_secret);
            if (!decoded) return handleResponse(res, 401, "Invalid token");
            if (decoded.id !== student._id.toString()) return handleResponse(res, 401, "Invalid token", null, end);
            return handleResponse(res, 200, "Token is valid", {...student, verified: true }, end);
        } catch (error) {
            return handleResponse(res, 500, error.message, null, end);
        }
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

export default new AuthController({studentService: studentService.studentService});