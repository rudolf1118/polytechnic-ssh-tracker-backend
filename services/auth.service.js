import { handleResponse, getUserIdFromToken } from '../utils/response.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import tokenGenerator from '../jwt/generate_token.js';
import { checkCredentials } from '../ssh_connection/execution.js';
import jwt from 'jsonwebtoken';
import {
    jwt_secret,
    admin_basic_password,
    admin_basic_username,
    basic_username,
    basic_password,
} from '../config.js';
import { hidePassword } from '../utils/helper.js';
import mongoose from 'mongoose';
import log from '../utils/log.js';

export class AuthService {
    /**
     *
     * @param {*} configuration
     * @param {*} configuration.studentModel
     * @param {*} configuration.studentService
     * @param {*} configuration.sessionService
     * @param {*} configuration.sshClient
     */

    constructor(configuration) {
        this.ssh_client = configuration.sshClient;
        this.studentService = configuration.studentService;
        this.sessionService = configuration.sessionService;
    }

    async comparePassword(username, password, res) {
        try {
            const result = await checkCredentials(username, password);
            if (!result) {
                return { status: 401, message: 'Invalid username or password' };
            } else if (result) {
                return { res, status: 200, message: 'Password is valid' };
            }
        } catch (error) {
            throw new Error({ res, status: 500, message: 'Something went wrong', error });
        }
    }

    async comparePasswordDB(username, password) {
        try {
            const { student } = await this.studentService.findOne({ username });
            if (!student) {
                return false;
            }
            if (!student.password) {
                await this.studentService.updatePassword(username, password);
                return true;
            }

            if (student.password === password) {
                return true;
            } else return false;
        } catch (error) {
            return false;
        }
    }

    async generateToken(user) {
        // eslint-disable-next-line no-useless-catch
        try {
            const [db_checking] = await Promise.all([
                this.comparePasswordDB(user.username, user.password),
            ]);
            console.log(user.password);
            console.log(db_checking);
            if (!db_checking) {
                return { status: 401, message: 'Invalid username or password' };
            }
            const token = await tokenGenerator(user._id.toString(), user.role);
            return { status: 200, message: 'Token generated successful', token };
        } catch (error) {
            throw error;
        }
    }

    async login(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // eslint-disable-next-line no-unsafe-optional-chaining
            const { username, password } = req?.body;
            log.info(`Login attempt with username: ${username}, ${password}`);
            if (!username || !password) {
                return { status: 400, message: 'username and password are required' };
            }

            const { student: user } = await this.studentService.findOne({ username }, session);
            if (!user) {
                return { status: 401, message: 'Invalid username or password' };
            }
    
            const credentials = user?.role === 'admin'  
            ? { username: admin_basic_username, password: admin_basic_password } :
            ( user?.password ? {username, password: decrypt(user.password.split(":")[1], user.password.split(":")[0]) } : { username, password });

            const isMatch = await this.comparePassword(
                credentials.username,
                credentials.password,
                res
            );
            if (!isMatch || !(isMatch.status >= 200 && isMatch.status <= 399)) {
                return { status: 401, message: 'Invalid username or password' };
            }

            const encrypted = encrypt(password);
            const encryptedPassword = `${encrypted.iv}:${encrypted.encryptedData}`;

            if (user.password !== encryptedPassword) {
                user.password = encryptedPassword;
                await user.save({ session });
            }

            const token = await this.generateToken(user);
            console.log(token)
            if (!token || !(token.status >= 200 && token.status <= 399)) {
                return { status: 401, message: 'Token generation failed' };
            }

            const sessionUpdateResult = await this.sessionService.updateSession(
                {
                    userId: user._id,
                    username: user.username,
                    dateOfLog: new Date(),
                },
                session
            );
            console.log(sessionUpdateResult);
            if (!(sessionUpdateResult.status >= 200 && sessionUpdateResult.status <= 399)) {
                throw new Error('Failed to update session information');
            }
            if (!user?.sessionId) {
                user.sessionId = sessionUpdateResult.data._id;
                await user.save({ session });
            }

            await session.commitTransaction();
            return {
                status: 200,
                message: 'Login successful',
                data: { token: token.token, user: hidePassword(user.toObject()) },
            };
        } catch (error) {
            log.error(`Login error: ${error.message}`);
            await session.abortTransaction();
            return { status: 500, message: error.message || 'Internal server error' };
        } finally {
            session.endSession();
        }
    }

    async setConnection(req, res) {
        try {
            const { authorization } = req.headers;
            const token = authorization.split(' ')[1];
            const user_id = getUserIdFromToken(token);
            const student = await this.studentModel.findById(user_id);

            if (!student) {
                return { status: 401, message: 'Invalid username or password' };
            }

            let credentials;
            if (student.role === 'admin') {
                credentials = { username: admin_basic_username, password: admin_basic_password };
            } else {
                credentials = {
                    username: student.username,
                    password: decrypt(
                        student.password.split(':')[1],
                        student.password.split(':')[0]
                    ),
                };
            }

            const { username, password: encrypted_password } = student;
            const real_password = decrypt(
                encrypted_password.split(':')[1],
                encrypted_password.split(':')[0]
            );
            console.log(real_password);

            this.ssh_client.updateConnectionParams(username, real_password);

            await this.ssh_client.connect(credentials).catch(error => {
                throw { status: 404, message: error.message };
            });

            return { status: 200, message: 'Connection successful' };
        } catch (error) {
            return { status: error.status || 500, message: error.message };
        }
    }

    async disconnect(req, res) {
        try {
            const { authorization } = req.headers;
            const token = authorization.split(' ')[1];
            const user_id = getUserIdFromToken(token);
            const student = await this.studentModel.findById(user_id);
            if (!student) {
                return { status: 401, message: 'Invalid username or password' };
            }
            this.ssh_client.disconnect();
            return { status: 200, message: 'Disconnected successfully' };
        } catch (error) {
            return { status: error.status || 500, message: error.message };
        }
    }

    async checkToken(req, res) {
        try {
            const { authorization } = req.headers;
            if (!authorization) {
                return { status: 401, message: 'Authorization header is required', data: null };
            }

            const token = authorization.split(' ')[1];
            const user_id = getUserIdFromToken(token);
            if (!user_id) {
                return { status: 401, message: 'Invalid token', data: null };
            }

            const student = await this.studentService.findById(user_id).lean();
            console.log(student);
            if (!student) {
                return { status: 401, message: 'Invalid token', data: null };
            }

            const decoded = jwt.verify(token, jwt_secret);
            if (!decoded) {
                return { status: 401, message: 'Invalid token', data: null };
            }

            if (decoded.id !== student._id.toString()) {
                return { status: 401, message: 'Invalid token', data: null };
            }

            return { status: 200, message: 'Token is valid', data: { ...student, verified: true } };
        } catch (error) {
            return { status: 500, message: error.message, data: null };
        }
    }

    async checkToken_(req, res) {
        // eslint-disable-next-line no-useless-catch
        try {
            const { authorization } = req.headers;
            if (!authorization) {
                throw new Error('Authorization header is required');
            }
            const token = authorization.split(' ')[1];
            const user_id = getUserIdFromToken(token);
            if (!user_id) {
                throw new Error('Invalid token');
            }
            const student = await this.studentService.findById(user_id);
            if (!student) {
                throw new Error('Invalid token');
            }
            const decoded = jwt.verify(token, jwt_secret);
            if (!decoded || decoded.id !== student._id.toString()) {
                throw new Error('Invalid token');
            }
            return true;
        } catch (error) {
            throw error;
        }
    }

    async checkBasic(req, res) {
        try {
            const { authorization } = req.headers;
            if (!authorization || !authorization.startsWith('Basic ')) {
                return handleResponse(res, 401, 'Authorization header missing or invalid');
            }

            const token = authorization.split(' ')[1];
            const decoded = Buffer.from(token, 'base64').toString('utf-8');
            const [username, password] = decoded.split(':');

            if (!username || !password) {
                return handleResponse(res, 401, 'Invalid authorization format');
            }

            if (username !== basic_username || password !== basic_password) {
                return handleResponse(res, 401, 'Invalid username or password');
            }

            return true;
        } catch (error) {
            console.error(error);
            return handleResponse(res, 500, 'Internal Server Error');
        }
    }

    async executeSSHCommand(req, res) {
        try {
            const { authorization } = req.headers;
            const token = authorization.split(' ')[1];
            const user_id = getUserIdFromToken(token);
            const student = await this.studentModel.findById(user_id);
            if (!student) {
                return handleResponse(res, 401, 'Invalid username or password');
            }
            const { command } = req.body;
            if (!command) {
                return handleResponse(res, 400, 'Command is required');
            }
            const result = await this.ssh_client.execCommand(command);
            console.log(result);
            return handleResponse(res, 200, 'Command executed successfully', result);
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
