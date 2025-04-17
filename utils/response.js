import { jwt_secret } from "../config.js";
import jwt from "jsonwebtoken";

export const handleResponse = (res, statusCode, message, data = null) => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message, data }));
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