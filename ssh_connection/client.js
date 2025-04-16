const { ssh_host, ssh_username, ssh_password, ssh_port } = require('../config');
const { Client } = require('ssh2');
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

    static getInstance(host, username, password, port = 22) {
        if (!this.instance) {
            SSHConnection.instance = new SSHConnection(host, username, password, port);
        }
        return SSHConnection.instance;
    }

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

const instance = SSHConnection.getInstance(ssh_host, ssh_username, ssh_password, ssh_port);
if (connect === "connect") instance.connect();
module.exports = instance;