import dotenv from 'dotenv';
dotenv.config();

export const connect = process.env.CONNECT || '';
export const ssh_host = process.env.SSH_HOST || '';
export const ssh_username = process.env.SSH_USERNAME || '';
export const ssh_password = process.env.SSH_PASSWORD || '';
export const ssh_port = process.env.SSH_PORT || 22;
export const port = process.env.PORT || 3000;
export const db_uri = process.env.MONGODB_URI || '';
export const jwt_secret = process.env.JWT_SECRET || '';
export const crypto_algorithm = process.env.CRYPTO_ALGORITHM;
export const crypto_secret = process.env.CRYPTO_SECRET_KEY || '';
export const crypto_iv = process.env.CRYPTO_IV || '';
export const jwt_expiration = '1h';
export const basic_username = process.env.BASIC_USERNAME || '';
export const basic_password = process.env.BASIC_PASSWORD || '';
export const admin_basic_username = process.env.ADMIN_USERNAME || '';
export const admin_basic_password = process.env.ADMIN_PASSWORD || '';