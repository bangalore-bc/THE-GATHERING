const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const ENCRYPTION_KEY = crypto.scryptSync('THE_GATHERING_SECRET_SALT_2026', 'salt-string', 32);

function encrypt(text) {
    if (!text) return '';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

const dataPath = path.join(__dirname, 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// The user accidentally added a space: 'WE _ARE_ALIVE_RA9'
// The correct key is 'WE_ARE_ALIVE_RA9'
const correctKey = 'WE_ARE_ALIVE_RA9';
data.googleSheetApiKey = encrypt(correctKey);

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Fixed googleSheetApiKey in data.json');
