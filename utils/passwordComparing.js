import { checkCredentials } from '../ssh_connection/execution.js';

export async function comparePassword (username, password, res) {
    try {
        const result = await checkCredentials(username, password);
        if (!result) {
            return {status: 401, message: "Invalid username or password"};
        }
        else if (result) {
            return { res, status: 200, message: "Password is valid" };
        };
    } catch (error) {
        throw new Error ({ res, status: 500, message: "Something went wrong", error })
    }
}