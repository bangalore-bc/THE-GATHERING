const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// --- Supabase Configuration ---
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pdyaapafzvbgihipxmgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkeWFhcGFmenZiZ2loaXB4bWdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODMxMzUxMSwiZXhwIjoyMDkzODg5NTExfQ.6Ux_qmtBLLERrbAyXC8o9QxkijbtzG38ZfOp9RCQ6Cc';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const STORAGE_BUCKET = 'uploads';

// Cryptographic Encryption Helpers for Secure Fields
const ENCRYPTION_KEY = crypto.scryptSync(process.env.ENCRYPTION_SALT || 'THE_GATHERING_SECRET_SALT_2026', 'salt-string', 32);
const IV_LENGTH = 16;

function encrypt(text) {
    if (!text) return '';
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

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

const app = express();
const PORT = process.env.PORT || 8080;

// Use memory storage for Multer (no local disk needed)
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(bodyParser.json());

// Custom Cookie Parser Middleware
app.use((req, res, next) => {
    req.cookies = {};
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            req.cookies[parts.shift().trim()] = decodeURI(parts.join('='));
        });
    }
    next();
});

// Admin 404 Cloaking Interceptor
app.use((req, res, next) => {
    if (req.path.startsWith('/admin') || req.path === '/admin.html' || req.path === '/admin.js') {
        const token = req.cookies.auth_token;
        if (!token || token !== 'THE_GATHERING_VALID_SESSION') {
            return res.status(404).send('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>Not Found</h1><p>The requested URL was not found on this server.</p></body></html>');
        } else if (req.path === '/admin') {
            return res.redirect('/admin.html');
        }
    }
    next();
});

// Serve frontend static files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// --- Default Data ---
const defaultData = {
    countdown: "2026-06-01T08:00:00",
    speakers: [],
    locations: [
        { id: 1, tag: "upcoming gathering", name: "Chai 3:16", description: "Our primary gathering space.", photo: "", mapLink: "https://maps.google.com", x: 0, y: 0, width: 800, height: 400 },
        { id: 2, tag: "nearest church", name: "bangalore blessing center", description: "A close community.", photo: "", mapLink: "https://maps.google.com", x: 832, y: 0, width: 400, height: 184 },
        { id: 3, tag: "visit us in kochi", name: "Kochi Collective", description: "A coastal gathering.", photo: "", mapLink: "https://maps.google.com", x: 832, y: 216, width: 400, height: 184 }
    ],
    meetings: [], upcomingEvents: [], nearestChurches: [],
    registerFormUrl: "", googleSheetWebhook: "", googleSheetApiKey: "",
    heroPhoto: "",
    instagramUrl: "https://instagram.com/thegathering",
    facebookUrl: "https://facebook.com/thegathering",
    youtubeUrl: "https://youtube.com/thegathering",
    givingUrl: "https://giving.thegathering.org",
    contactUrl: "mailto:contact@thegathering.org",
    volunteerUrl: "https://volunteer.thegathering.org",
    users: [{ id: "admin", password: "GatheringAdmin2026!" }]
};

// --- Supabase Data Helpers ---
async function readData() {
    const { data, error } = await supabase.from('site_data').select('data').eq('id', 'main').single();
    if (error || !data) {
        console.log('No data in Supabase yet, initializing with defaults...');
        await writeData(defaultData);
        return { ...defaultData };
    }
    // Backfill missing keys from defaults
    let result = data.data;
    let modified = false;
    for (const key of Object.keys(defaultData)) {
        if (result[key] === undefined) {
            result[key] = defaultData[key];
            modified = true;
        }
    }
    if (!result.users || result.users.length === 0) {
        result.users = defaultData.users;
        modified = true;
    }
    if (modified) await writeData(result);
    return result;
}

async function writeData(data) {
    const { error } = await supabase.from('site_data').upsert({ id: 'main', data, updated_at: new Date().toISOString() });
    if (error) console.error('Error writing data to Supabase:', error.message);
}

// --- Supabase Storage Helper ---
async function uploadFile(fileBuffer, originalName) {
    const ext = path.extname(originalName);
    const fileName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, fileBuffer, {
        contentType: getContentType(ext),
        upsert: false
    });
    if (error) { console.error('Upload error:', error.message); return null; }
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
    return urlData.publicUrl;
}

async function deleteFile(fileUrl) {
    if (!fileUrl || !fileUrl.includes(STORAGE_BUCKET)) return;
    try {
        const filePath = fileUrl.split(`${STORAGE_BUCKET}/`).pop();
        if (filePath) await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
    } catch (e) { console.error('Delete error:', e.message); }
}

function getContentType(ext) {
    const types = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
    return types[ext.toLowerCase()] || 'application/octet-stream';
}

// --- Authentication Middleware ---
const requireAuth = (req, res, next) => {
    const token = req.cookies.auth_token;
    if (!token || token !== 'THE_GATHERING_VALID_SESSION') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

app.use('/api', (req, res, next) => {
    if (req.method === 'GET' && req.path === '/data') return next();
    if (req.method === 'POST' && req.path === '/subscribe') return next();
    if (req.method === 'POST' && req.path === '/login') return next();
    if (req.method === 'POST' && req.path === '/logout') return next();
    if (req.method === 'GET' && req.path === '/check-auth') return next();
    requireAuth(req, res, next);
});

// --- Login Routes ---
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/api/login', async (req, res) => {
    const { id, password } = req.body;
    const data = await readData();
    const user = data.users.find(u => u.id === id && u.password === password);
    if (user) {
        res.cookie('auth_token', 'THE_GATHERING_VALID_SESSION', { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        return res.json({ success: true });
    }
    res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
    const token = req.cookies.auth_token;
    res.json({ authenticated: token === 'THE_GATHERING_VALID_SESSION' });
});

app.post('/api/users', async (req, res) => {
    const { id, password } = req.body;
    const data = await readData();
    data.users.push({ id, password });
    await writeData(data);
    res.json({ success: true });
});

app.get('/api/users', async (req, res) => {
    const data = await readData();
    res.json(data.users.map(u => ({ id: u.id })));
});

// --- GET all data ---
app.get('/api/data', async (req, res) => {
    res.json(await readData());
});

// --- Hero ---
app.post('/api/hero', upload.single('heroPhoto'), async (req, res) => {
    const data = await readData();
    if (req.body.countdown) data.countdown = req.body.countdown;
    if (req.file) {
        await deleteFile(data.heroPhoto);
        data.heroPhoto = await uploadFile(req.file.buffer, req.file.originalname);
    }
    await writeData(data);
    res.json({ success: true, countdown: data.countdown, heroPhoto: data.heroPhoto });
});

// --- Speakers ---
app.post('/api/speakers', upload.single('photoFile'), async (req, res) => {
    const data = await readData();
    const newSpeaker = JSON.parse(req.body.data);
    newSpeaker.id = Date.now();
    if (req.file) newSpeaker.photo = await uploadFile(req.file.buffer, req.file.originalname);
    data.speakers.push(newSpeaker);
    await writeData(data);
    res.json({ success: true, speakers: data.speakers });
});

app.put('/api/speakers-order', async (req, res) => {
    const data = await readData();
    const { order } = req.body;
    if (order && Array.isArray(order)) {
        const sorted = [];
        order.forEach(id => { const s = data.speakers.find(x => x.id === id); if (s) sorted.push(s); });
        data.speakers.forEach(s => { if (!order.includes(s.id)) sorted.push(s); });
        data.speakers = sorted;
        await writeData(data);
        res.json({ success: true, speakers: data.speakers });
    } else {
        res.status(400).json({ error: 'Invalid order data' });
    }
});

app.put('/api/speakers/:id', upload.single('photoFile'), async (req, res) => {
    const data = await readData();
    const id = parseInt(req.params.id);
    const index = data.speakers.findIndex(s => s.id === id);
    if (index !== -1) {
        const updated = JSON.parse(req.body.data);
        if (req.file) {
            await deleteFile(data.speakers[index].photo);
            updated.photo = await uploadFile(req.file.buffer, req.file.originalname);
        } else {
            updated.photo = data.speakers[index].photo;
        }
        data.speakers[index] = { ...data.speakers[index], ...updated };
        await writeData(data);
        res.json({ success: true, speakers: data.speakers });
    } else { res.status(404).json({ error: 'Speaker not found' }); }
});

app.delete('/api/speakers/:id', async (req, res) => {
    const data = await readData();
    const id = parseInt(req.params.id);
    const speaker = data.speakers.find(s => s.id === id);
    if (speaker) await deleteFile(speaker.photo);
    data.speakers = data.speakers.filter(s => s.id !== id);
    await writeData(data);
    res.json({ success: true, speakers: data.speakers });
});

// --- Locations ---
app.post('/api/locations', upload.single('photoFile'), async (req, res) => {
    const data = await readData();
    const loc = JSON.parse(req.body.data);
    loc.id = Date.now(); loc.x = 0; loc.y = 0; loc.width = 400; loc.height = 300;
    if (req.file) loc.photo = await uploadFile(req.file.buffer, req.file.originalname);
    data.locations.push(loc);
    await writeData(data);
    res.json({ success: true, locations: data.locations });
});

app.put('/api/locations/:id', upload.single('photoFile'), async (req, res) => {
    const data = await readData();
    const id = parseInt(req.params.id);
    const index = data.locations.findIndex(l => l.id === id);
    if (index !== -1) {
        const updated = JSON.parse(req.body.data);
        if (req.file) {
            await deleteFile(data.locations[index].photo);
            updated.photo = await uploadFile(req.file.buffer, req.file.originalname);
        } else { updated.photo = data.locations[index].photo; }
        data.locations[index] = { ...data.locations[index], ...updated };
        await writeData(data);
        res.json({ success: true, locations: data.locations });
    } else { res.status(404).json({ error: 'Location not found' }); }
});

app.delete('/api/locations/:id', async (req, res) => {
    const data = await readData();
    const id = parseInt(req.params.id);
    const index = data.locations.findIndex(l => l.id === id);
    if (index !== -1) {
        await deleteFile(data.locations[index].photo);
        data.locations.splice(index, 1);
        await writeData(data);
    }
    res.json({ success: true, locations: data.locations });
});

app.put('/api/locations-layout', async (req, res) => {
    const data = await readData();
    const layouts = req.body.layouts;
    layouts.forEach(layout => {
        const loc = data.locations.find(l => l.id === layout.id);
        if (loc) { loc.x = layout.x; loc.y = layout.y; loc.width = layout.width; loc.height = layout.height; }
    });
    await writeData(data);
    res.json({ success: true, locations: data.locations });
});

// --- Meetings ---
const meetingUploadFields = [
    { name: 'photoFile', maxCount: 1 }, { name: 'slideshowFiles', maxCount: 10 },
    { name: 'testimonialPhoto0', maxCount: 1 }, { name: 'testimonialPhoto1', maxCount: 1 }, { name: 'testimonialPhoto2', maxCount: 1 }
];

app.post('/api/meetings', upload.fields(meetingUploadFields), async (req, res) => {
    const data = await readData();
    const meeting = JSON.parse(req.body.data);
    meeting.id = Date.now();
    if (req.files && req.files['photoFile']) meeting.photo = await uploadFile(req.files['photoFile'][0].buffer, req.files['photoFile'][0].originalname);
    meeting.slideshow = [];
    if (req.files && req.files['slideshowFiles']) {
        for (const f of req.files['slideshowFiles']) { meeting.slideshow.push(await uploadFile(f.buffer, f.originalname)); }
    }
    if (meeting.testimonials) {
        for (let i = 0; i < meeting.testimonials.length; i++) {
            const key = 'testimonialPhoto' + i;
            if (req.files && req.files[key]) meeting.testimonials[i].photo = await uploadFile(req.files[key][0].buffer, req.files[key][0].originalname);
        }
    }
    data.meetings.push(meeting);
    await writeData(data);
    res.json({ success: true, meetings: data.meetings });
});

app.put('/api/meetings/:id', upload.fields(meetingUploadFields), async (req, res) => {
    const data = await readData();
    const id = parseInt(req.params.id);
    const index = data.meetings.findIndex(m => m.id === id);
    if (index !== -1) {
        const updated = JSON.parse(req.body.data);
        if (req.files && req.files['photoFile']) {
            await deleteFile(data.meetings[index].photo);
            updated.photo = await uploadFile(req.files['photoFile'][0].buffer, req.files['photoFile'][0].originalname);
        } else { updated.photo = data.meetings[index].photo; }
        if (req.files && req.files['slideshowFiles']) {
            if (data.meetings[index].slideshow) { for (const f of data.meetings[index].slideshow) await deleteFile(f); }
            updated.slideshow = [];
            for (const f of req.files['slideshowFiles']) { updated.slideshow.push(await uploadFile(f.buffer, f.originalname)); }
        } else { updated.slideshow = data.meetings[index].slideshow || []; }
        const oldTest = data.meetings[index].testimonials || [];
        if (updated.testimonials) {
            for (let i = 0; i < updated.testimonials.length; i++) {
                const key = 'testimonialPhoto' + i;
                if (req.files && req.files[key]) {
                    if (oldTest[i] && oldTest[i].photo) await deleteFile(oldTest[i].photo);
                    updated.testimonials[i].photo = await uploadFile(req.files[key][0].buffer, req.files[key][0].originalname);
                } else if (oldTest[i] && oldTest[i].photo) { updated.testimonials[i].photo = oldTest[i].photo; }
            }
        }
        data.meetings[index] = { ...data.meetings[index], ...updated };
        await writeData(data);
        res.json({ success: true, meetings: data.meetings });
    } else { res.status(404).json({ error: 'Meeting not found' }); }
});

app.delete('/api/meetings/:id', async (req, res) => {
    const data = await readData();
    const id = parseInt(req.params.id);
    const index = data.meetings.findIndex(m => m.id === id);
    if (index !== -1) {
        await deleteFile(data.meetings[index].photo);
        if (data.meetings[index].slideshow) { for (const f of data.meetings[index].slideshow) await deleteFile(f); }
        data.meetings.splice(index, 1);
        await writeData(data);
    }
    res.json({ success: true, meetings: data.meetings });
});

// --- Settings ---
app.get('/api/settings', async (req, res) => {
    const data = await readData();
    res.json({
        registerFormUrl: data.registerFormUrl || '', googleSheetWebhook: data.googleSheetWebhook || '',
        googleSheetApiKey: data.googleSheetApiKey ? '••••••••••••' : '',
        instagramUrl: data.instagramUrl || '', facebookUrl: data.facebookUrl || '',
        youtubeUrl: data.youtubeUrl || '', givingUrl: data.givingUrl || '',
        contactUrl: data.contactUrl || '', volunteerUrl: data.volunteerUrl || ''
    });
});

app.put('/api/settings', async (req, res) => {
    const data = await readData();
    const fields = ['registerFormUrl','googleSheetWebhook','instagramUrl','facebookUrl','youtubeUrl','givingUrl','contactUrl','volunteerUrl'];
    fields.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
    if (req.body.googleSheetApiKey !== undefined) {
        const newKey = req.body.googleSheetApiKey;
        if (newKey && newKey !== '••••••••••••') data.googleSheetApiKey = encrypt(newKey.trim());
    }
    await writeData(data);
    res.json({ success: true });
});

// --- Subscribe ---
function secureRequestFollowRedirect(urlStr, postData, method = 'POST') {
    return new Promise((resolve, reject) => {
        const https = require('https');
        const url = new URL(urlStr);
        const options = { hostname: url.hostname, path: url.pathname + url.search, method, headers: {} };
        if (method === 'POST') { options.headers['Content-Type'] = 'application/json'; options.headers['Content-Length'] = Buffer.byteLength(postData); }
        const req = https.request(options, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
                const redirectUrl = res.headers.location;
                if (redirectUrl) { const nextMethod = [301, 302, 303].includes(res.statusCode) ? 'GET' : method; return secureRequestFollowRedirect(redirectUrl, postData, nextMethod).then(resolve).catch(reject); }
            }
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => { if (res.statusCode >= 200 && res.statusCode < 300) { try { resolve(JSON.parse(body)); } catch (e) { resolve({ status: 'success', raw: body }); } } else { reject(new Error(`Status ${res.statusCode}: ${body}`)); } });
        });
        req.on('error', reject);
        if (method === 'POST') req.write(postData);
        req.end();
    });
}

app.post('/api/subscribe', async (req, res) => {
    const { email, phone } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email.' });
    if (phone && !/^[+\d\s\-\(\)\.]{7,20}$/.test(phone)) return res.status(400).json({ error: 'Invalid phone.' });
    const data = await readData();
    if (!data.googleSheetWebhook) return res.status(500).json({ error: 'Webhook not configured.' });
    try {
        const decryptedKey = decrypt(data.googleSheetApiKey || 'GATHERING_SECURE_TOKEN_3a7b9e');
        const timestamp = Date.now().toString();
        const sig = crypto.createHmac('sha256', decryptedKey).update(timestamp + '.' + email + '.' + (phone || '')).digest('hex');
        const postData = JSON.stringify({ email, phone: phone || '', timestamp, signature: sig });
        const result = await secureRequestFollowRedirect(data.googleSheetWebhook, postData);
        if (result.status === 'error') return res.status(400).json({ error: result.message });
        res.json({ success: true, duplicate: result.duplicate || false });
    } catch (err) { console.error('Subscribe error:', err.message); res.status(500).json({ error: 'Subscription failed.' }); }
});

// --- Events ---
app.post('/api/events', async (req, res) => {
    const data = await readData();
    const ev = req.body; ev.id = Date.now();
    if (!data.upcomingEvents) data.upcomingEvents = [];
    data.upcomingEvents.push(ev);
    await writeData(data);
    res.json({ success: true, upcomingEvents: data.upcomingEvents });
});

app.put('/api/events/:id', async (req, res) => {
    const data = await readData();
    const id = parseInt(req.params.id);
    const idx = (data.upcomingEvents || []).findIndex(e => e.id === id);
    if (idx !== -1) {
        data.upcomingEvents[idx] = { ...data.upcomingEvents[idx], ...req.body, id };
        await writeData(data);
        res.json({ success: true, upcomingEvents: data.upcomingEvents });
    } else { res.status(404).json({ error: 'Event not found' }); }
});

app.delete('/api/events/:id', async (req, res) => {
    const data = await readData();
    const id = parseInt(req.params.id);
    data.upcomingEvents = (data.upcomingEvents || []).filter(e => e.id !== id);
    await writeData(data);
    res.json({ success: true, upcomingEvents: data.upcomingEvents });
});

// --- Start Server ---
app.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`); });

// Export for Vercel serverless
module.exports = app;
