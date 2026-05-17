const crypto = require('crypto');
const ENCRYPTION_KEY = crypto.scryptSync('THE_GATHERING_SECRET_SALT_2026', 'salt-string', 32);

function decrypt(text) {
    if (!text) return '';
    try {
        if (!text.includes(':')) return text;
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        console.error('Decryption failed:', e.message);
        return text;
    }
}

console.log(decrypt("080e2759e756d2e3e71bea5d3cc0a9b7:7ca7d71bf418983aa8d1434260dfd1e76a57ad7acaf12f7811c9056c8731a6f0"));
