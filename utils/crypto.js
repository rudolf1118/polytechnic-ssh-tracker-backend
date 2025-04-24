import crypto from 'crypto';
import { crypto_algorithm, crypto_secret, crypto_iv } from '../config.js';
const algorithm = crypto_algorithm
const secretKey = Buffer.from(crypto_secret, 'utf8'); // 32 bytes
const iv = Buffer.from(crypto_iv, 'utf8'); // 16 bytes

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
