/**
 * Migration Script: Push existing data.json into Supabase
 * Run once: node migrate-data.js
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pdyaapafzvbgihipxmgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkeWFhcGFmenZiZ2loaXB4bWdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODMxMzUxMSwiZXhwIjoyMDkzODg5NTExfQ.6Ux_qmtBLLERrbAyXC8o9QxkijbtzG38ZfOp9RCQ6Cc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrate() {
    console.log('Reading data.json...');
    const dataPath = path.join(__dirname, 'data.json');
    
    if (!fs.existsSync(dataPath)) {
        console.error('data.json not found!');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`Found: ${data.speakers?.length || 0} speakers, ${data.locations?.length || 0} locations, ${data.meetings?.length || 0} meetings`);

    // Upload images to Supabase Storage
    const uploadDir = path.join(__dirname, 'uploads');
    const imageMap = {}; // old path -> new public URL

    if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        console.log(`Uploading ${files.length} images to Supabase Storage...`);
        
        for (const fileName of files) {
            const filePath = path.join(uploadDir, fileName);
            const fileBuffer = fs.readFileSync(filePath);
            
            const { error } = await supabase.storage.from('uploads').upload(fileName, fileBuffer, {
                contentType: getContentType(path.extname(fileName)),
                upsert: true
            });
            
            if (error) {
                console.warn(`  Skip ${fileName}: ${error.message}`);
            } else {
                const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
                imageMap['/uploads/' + fileName] = urlData.publicUrl;
                console.log(`  ✓ ${fileName}`);
            }
        }
    }

    // Replace all /uploads/... paths in data with Supabase public URLs
    let dataStr = JSON.stringify(data);
    for (const [oldPath, newUrl] of Object.entries(imageMap)) {
        dataStr = dataStr.split(oldPath).join(newUrl);
    }
    const migratedData = JSON.parse(dataStr);

    // Push to Supabase database
    console.log('Writing data to Supabase database...');
    const { error } = await supabase.from('site_data').upsert({
        id: 'main',
        data: migratedData,
        updated_at: new Date().toISOString()
    });

    if (error) {
        console.error('Database write failed:', error.message);
        process.exit(1);
    }

    console.log('✅ Migration complete! All data and images are now in Supabase.');
}

function getContentType(ext) {
    const types = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
    return types[ext.toLowerCase()] || 'application/octet-stream';
}

migrate().catch(console.error);
