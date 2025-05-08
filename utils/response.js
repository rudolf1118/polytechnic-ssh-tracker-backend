import { jwt_secret } from "../config.js";
import jwt from "jsonwebtoken";

export const handleResponse_ = (response, end = true) => {
    let res = response.res;
    let statusCode = response.status || response.statusCode || 200;
    let message = response.message || null;
    let data = response.data || null;
    if (response.error) {
        statusCode = response.error.status || 500;
        message = response.error.message || null;
        data = response.error.data || null;
    }
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    const response_data = {};
    if (message) {
        response_data.message = message;
    }
    if (data) {
        response_data.data = data;
    }
    if (statusCode >= 400) {
        response_data.error = message;
    }
    res.write(JSON.stringify(response_data));
    end && res.end();
    return res;
}

export const handleResponse = (res, statusCode, message, data = null, end = true) => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    const response_data = {};
    if (message) {
        response_data.message = message;
    }
    if (data) {
        response_data.data = data;
    }
    if (statusCode >= 400) {
        response_data.error = message;
    }
    res.write(JSON.stringify(response_data));
    end && res.end();
    return res;
}

export const handleBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                resolve(parsed);
            } catch (err) {
                reject(new Error('Invalid JSON'));
            }
        });

        req.on('error', (err) => {
            reject(err);
        });
    });
};

export const getUserIdFromToken = (token) => {
    const decoded = jwt.verify(token, jwt_secret);
    const user_id = (decoded).id;
    return user_id;
}