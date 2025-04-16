import dotenv from 'dotenv';
dotenv.config();

export const connect = process.env.CONNECT || '';
export const ssh_host = process.env.SSH_HOST || '';
export const ssh_username = process.env.SSH_USERNAME || '';
export const ssh_password = process.env.SSH_PASSWORD || '';
export const ssh_port = process.env.SSH_PORT || 22;
export const db_uri = process.env.MONGODB_URI || '';
export const jwt_secret = process.env.JWT_SECRET || '';
export const jwt_expiration = '1h';