import dotenv from 'dotenv';
dotenv.config();
export default {
    connect: process.env.CONNECT || '',
    ssh_host: process.env.SSH_HOST || '',
    ssh_username: process.env.SSH_USERNAME || '',
    ssh_password: process.env.SSH_PASSWORD || '',
    ssh_port: process.env.SSH_PORT || 22,
    db_uri: process.env.MONGODB_URI || '',
};
