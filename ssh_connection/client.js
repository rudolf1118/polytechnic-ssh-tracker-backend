import { ssh_host, ssh_username, ssh_password, ssh_port } from '../config.js';
import { Client } from 'ssh2';

const connect = process.argv[2];

class SSHConnection {
    static instance = null;

    constructor(host, username, password, port = 22) {
        this.host = host;
        this.username = username;
        this.password = password;
        this.port = port;
        this.client = new Client();
        this.connectionParams = {
            host: this.host,
            port: this.port,
            username: this.username,
            password: this.password,
        };
    }

    updateConnectionParams(username, password, port = 22, host) {
        this.host = host || this.host;
        this.username = username;
        this.password = password;
        this.port = port || this.port;
        this.connectionParams = {
            host: this.host,
            port: this.port,
            username: this.username,
            password: this.password,
        };
    }

    static getInstance(host, username, password, port = 22) {
        if (!this.instance) {
            SSHConnection.instance = new SSHConnection(host, username, password, port);
        }
        return SSHConnection.instance;
    }
    // TODO: check what is proble of /api/auth/connect
    connect() {
        return new Promise((resolve, reject) => {
            this.client.on('ready', () => {
                console.log(`Connected via SSH user ${this.username} to ${this.host}`);
                resolve();
            }).on('error', (err) => {
                console.error('Connection error:', err);
                reject(err);
            }).connect(this.connectionParams);
        });
    }
    
    async checkCredentials(username, password) {
        const sshClient = SSHConnection.getInstance(this.host, username, password, this.port);
        try {
            await sshClient.connect();
            console.log('SSH connection successful');
            sshClient.disconnect();
            return true;
        } catch (err) {
            console.error('SSH connection failed:', err.message);
            return false;
        }
    }
    async execCommand(command) {
        return new Promise((resolve, reject) => {
            this.client.exec(command, (err, stream) => {
                if (err) return reject(err);

                let stdout = '';
                let stderr = '';

                stream.on('close', (code, signal) => {
                    resolve({ stdout, stderr, code, signal });
                }).on('data', (data) => {
                    stdout += data.toString();
                }).stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            });
        });
    }

    disconnect() {
        this.client.end();
        console.log('Disconnected');
    }
}

export const instance = SSHConnection.getInstance(ssh_host, ssh_username, ssh_password, ssh_port);
if (connect === "connect") instance.connect();