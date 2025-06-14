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
        this.studentService = configuration.studentService;
        this.sessionService = configuration.sessionService;
        this.authService = configuration.authService;
        this.decorator = configuration.decorator;
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

    async checkMasterApiKey(req, res) {
        return handleResponse(await this.decorator.withMasterApiKey(req, res, this.checkMasterApiKey.bind(this, req, res)));
    }

    async unhandledError(req, res, message) {
        try {
            return handleResponse(res, 500, message);
        } catch (error) {
            return handleResponse(res, 500, error.message);
        }
    }
}

export default AuthController;