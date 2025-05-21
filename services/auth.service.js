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
    master_api_key
} from '../config.js';
import { hidePassword } from '../utils/helper.js';
import mongoose from 'mongoose';
import { catchError } from '../exceptions/exception.filter.js';
import {
    HttpException,
    BadRequestException,
    UnauthorizedException,
    NotFoundException,
    ForbiddenException,
    InternalServerErrorException,
    ConflictException
} from '../exceptions/exceptions.js';
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

    async comparePassword(username, password) {
        try {
            const result = await checkCredentials(username, password);
            if (!result) {
                throw new UnauthorizedException('Invalid username or password');
            }
            return { status: 200, message: 'Password is valid' };
        } catch (error) {
            throw new InternalServerErrorException('Something went wrong', error);
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
        try {
            const [db_checking] = await Promise.all([
                this.comparePasswordDB(user.username, user.password),
            ]);
            if (!db_checking) {
                throw new UnauthorizedException('Invalid username or password');
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
            const { username, password } = req?.body;
            log.info(`Login attempt with username: ${username}, ${password}`);
            if (!username || !password) {
                throw new BadRequestException('Username and password are required');
            }

            const { student: user } = await this.studentService.findOne({ username }, session);
            if (!user) {
                throw new UnauthorizedException('Invalid username or password');
            }
    
            const credentials = user?.role === 'admin'  
            ? { username: admin_basic_username, password: admin_basic_password } :
            ( user?.password ? {username, password: decrypt(user.password.split(":")[1], user.password.split(":")[0]) } : { username, password });

            const isMatch = await this.comparePassword(
                credentials.username,
                credentials.password
            );
            if (!isMatch || !(isMatch.status >= 200 && isMatch.status <= 399)) {
                throw new UnauthorizedException('Invalid username or password');
            }

            const encrypted = encrypt(password);
            const encryptedPassword = `${encrypted.iv}:${encrypted.encryptedData}`;

            if (user.password !== encryptedPassword) {
                user.password = encryptedPassword;
                await user.save({ session });
            }

            const token = await this.generateToken(user);
            if (!token || !(token.status >= 200 && token.status <= 399)) {
                throw new UnauthorizedException('Token generation failed');
            }

            const sessionUpdateResult = await this.sessionService.updateSession(
                {
                    userId: user._id,
                    username: user.username,
                    dateOfLog: new Date(),
                },
                session
            );
            if (!(sessionUpdateResult.status >= 200 && sessionUpdateResult.status <= 399)) {
                throw new InternalServerErrorException('Failed to update session information');
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
            throw error;
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
                throw new UnauthorizedException('Invalid username or password');
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

            this.ssh_client.updateConnectionParams(username, real_password);

            await this.ssh_client.connect(credentials).catch(error => {
                throw new NotFoundException(error.message);
            });

            return { status: 200, message: 'Connection successful' };
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async disconnect(req, res) {
        try {
            const { authorization } = req.headers;
            const token = authorization.split(' ')[1];
            const user_id = getUserIdFromToken(token);
            const student = await this.studentModel.findById(user_id);
            if (!student) {
                throw new UnauthorizedException('Invalid username or password');
            }
            this.ssh_client.disconnect();
            return { status: 200, message: 'Disconnected successfully' };
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async checkToken(req, res) {
        try {
            const { authorization } = req.headers;
            if (!authorization) {
                throw new UnauthorizedException('Authorization header is required');
            }

            const token = authorization.split(' ')[1];
            const user_id = getUserIdFromToken(token);
            if (!user_id) {
                throw new UnauthorizedException('Invalid token');
            }

            const student = await this.studentService.findById(user_id).lean();
            if (!student) {
                throw new UnauthorizedException('Invalid token');
            }

            const decoded = jwt.verify(token, jwt_secret);
            if (!decoded) {
                throw new UnauthorizedException('Invalid token');
            }

            if (decoded.id !== student._id.toString()) {
                throw new UnauthorizedException('Invalid token');
            }

            return { status: 200, message: 'Token is valid', data: { ...student, verified: true } };
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async checkToken_(req, res) {
        try {
            const { authorization } = req.headers;
            if (!authorization) {
                throw new UnauthorizedException('Authorization header is required');
            }
            const token = authorization.split(' ')[1];
            const user_id = getUserIdFromToken(token);
            if (!user_id) {
                throw new UnauthorizedException('Invalid token');
            }
            const student = await this.studentService.findById(user_id);
            if (!student) {
                throw new UnauthorizedException('Invalid token');
            }
            const decoded = jwt.verify(token, jwt_secret);
            if (!decoded || decoded.id !== student._id.toString()) {
                throw new UnauthorizedException('Invalid token');
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
                throw new UnauthorizedException('Authorization header missing or invalid');
            }

            const token = authorization.split(' ')[1];
            const decoded = Buffer.from(token, 'base64').toString('utf-8');
            const [username, password] = decoded.split(':');

            if (!username || !password) {
                throw new UnauthorizedException('Invalid authorization format');
            }

            if (username !== basic_username || password !== basic_password) {
                throw new UnauthorizedException('Invalid username or password');
            }

            return true;
        } catch (error) {
            throw new InternalServerErrorException('Internal Server Error');
        }
    }

    async executeSSHCommand(req, res) {
        try {
            const { authorization } = req.headers;
            const token = authorization.split(' ')[1];
            const user_id = getUserIdFromToken(token);
            const student = await this.studentModel.findById(user_id);
            if (!student) {
                throw new UnauthorizedException('Invalid username or password');
            }
            const { command } = req.body;
            if (!command) {
                throw new BadRequestException('Command is required');
            }
            const result = await this.ssh_client.execCommand(command);
            return { status: 200, message: 'Command executed successfully', result };
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async checkMasterApiKey(req, res) {
        const { 'x-api-key': api_key } = req.headers;
        if (!api_key || api_key !== master_api_key) {
            throw new UnauthorizedException('Invalid API key');
        }
        return true;
    }

    async unhandledError(req, res, message) {
        try {
            throw new InternalServerErrorException(message);
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }
}
