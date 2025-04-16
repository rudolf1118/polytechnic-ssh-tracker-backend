import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const secretKey = Buffer.from('12345678901234567890123456789012', 'utf8'); // 32 bytes
const iv = Buffer.from('1234567890123456', 'utf8'); // 16 bytes

export function encrypt(text) {
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted };
}

export function decrypt(encryptedData, ivHex) {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(ivHex, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
