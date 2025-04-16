import { handleResponse } from '../utils/response.js';
import { checkCredentials } from '../ssh_connection/execution.js';

class AuthController {
    controller(configuration) {
        this.authService = configuration.authService;
    }
    async comparePassword (username, password) {
        try {
            await checkCredentials(username, password).then((result) => {
                if (!result) {
                    return handleResponse(res, 401, "Invalid username or password");
                }
                else if (result) {
                    return handleResponse(res, 200, "Login successful");
                };
            });
        } catch (error) {
            return handleResponse(res, 500, error.message);
        }
    }
    async login (req, res) {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return handleResponse(res, 400, "username and password are required");
            }
            const user = await this.authService.findOne({ username });
            if (!user) {
                return handleResponse(res, 401, "Invalid username or password");
            }
            const isMatch = await this.authService.comparePassword(password, user.password);
            if (!isMatch) {
                return handleResponse(res, 401, "Invalid username or password");
            }
            return handleResponse(res, 200, "Login successful", user);
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

export default new AuthController({});