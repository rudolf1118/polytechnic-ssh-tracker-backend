import { instance as SSHConnection }from './client.js';
import fs from 'fs';
import path from 'path';
const dir = path.dirname(new URL(import.meta.url).pathname);

const handleDataToObject = (data) => {
    const lines = data.split(/\r?\n/).filter(Boolean);
    const result = [];

    lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
            const obj = {
                username: parts[0],
                ip: parts[2],
                hostname: parts[1],
                date: parts.slice(3).join(' ')
            };
            result.push(obj);
        }
    });

    return result;
};

const handleGroupBy = (data, key) => {
    return data.reduce((acc, item) => {
        const groupKey = item[key];
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(item);
        return acc;
    }, {});
}

export const checkCredentials = async (username, password) => {
    console.log("CHECK CREDENTIALS 333", username, password);
    return await SSHConnection.checkCredentials(username, password).catch((err => {  
        throw err;
    }));
}

export const connectAndExecuteSSH = async (user_config) => {
    try {
        const sshClient = SSHConnection;
        await sshClient.connect(user_config);
        const command = 'last -i';
        const rawData = await sshClient.execCommand(command);
        await sshClient.disconnect();
        console.log('Command output:', rawData.stdout);
        const parsed = handleDataToObject(rawData.stdout);
        const groupBy = handleGroupBy(parsed, 'username');
        const defaultDir = path.join(dir, `../db_example/${user_config.username}`);
        if (!fs.existsSync(defaultDir)) {
            fs.mkdirSync(defaultDir, { recursive: true });
        }
        const defaultDbPath = path.join(dir, `../db_example/${user_config.username}/${user_config.username}_test_db_default.json`);
        const groupedDbPath = path.join(dir, `../db_example/${user_config.username}/${user_config.username}_test_db_groupedByUsername.json`);

        if (fs.existsSync(defaultDbPath)) {
            fs.unlinkSync(defaultDbPath);
        }
        if (fs.existsSync(groupedDbPath)) {
            fs.unlinkSync(groupedDbPath);
        }

        fs.writeFileSync(defaultDbPath, JSON.stringify(parsed, null, 2));
        fs.writeFileSync(groupedDbPath, JSON.stringify(groupBy, null, 2));
        return { groupedBy:groupBy, parsed};
    } catch (err) {
        console.error('Error:', err.message);
    }
}
