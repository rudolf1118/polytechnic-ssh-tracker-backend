import SSHConnection from './client.js';
import fs from 'fs';
import path from 'path';
const dir = path.dirname(new URL(import.meta.url).pathname);
console.log(dir);
// const runSSHCommand = (command) => {
//     return new Promise((resolve, reject) => {

//         let output = '';

//         sshClient.on('ready', () => {
//             console.log(`✅ Connected via SSH user ${ssh_username} to ${ssh_host}`);

//             sshClient.exec(command, (err, stream) => {
//                 if (err) return reject(err);

//                 stream.on('data', (chunk) => {
//                     output += chunk.toString();
//                 });

//                 stream.stderr.on('data', (data) => {
//                     console.error('STDERR:\n' + data.toString());
//                 });

//                 stream.on('close', (code, signal) => {
//                     console.log(`🚪 Command finished with code ${code}, signal ${signal}`);
//                     sshClient.end();
//                     resolve(output);
//                 });
//             });
//         });

//         sshClient.on('error', (err) => {
//             reject(err);
//         });

//         sshClient.connect();
//     });
// };

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

(async () => {
    try {
        const sshClient = SSHConnection;
        await sshClient.connect();
        const command = 'last -i';
        const rawData = await sshClient.execCommand(command);
        await sshClient.disconnect();
        console.log('Command output:', rawData.stdout);
        console.log('Command error:', rawData.stderr);
        const parsed = handleDataToObject(rawData.stdout);
        const groupBy = handleGroupBy(parsed, 'username');
        fs.writeFileSync(path.join(dir, '../db_example/test_db_default.json'), JSON.stringify(parsed, null, 2));
        fs.writeFileSync(path.join(dir, '../db_example/test_db_groupedByUsername.json'), JSON.stringify(groupBy, null, 2));
        // parsed.forEach((item) => {
        //     console.log(`👤 Username: ${item.username}, 🌐 IP: ${item.ip}, 🖥️ Hostname: ${item.hostname}, 📅 Date: ${item.date}`);
        // });
    } catch (err) {
        console.error('🔥 Error:', err.message);
    }
})();