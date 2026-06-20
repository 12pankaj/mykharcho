const fs = require('fs');
const db = require('../app/config/db');

async function run() {
    try {
        const sql = fs.readFileSync(__dirname + '/rebuild_schema_uuid.sql', 'utf8');
        await db.query(sql);
        console.log('Successfully rebuilt database schema with UUIDs!');
        process.exit(0);
    } catch (e) {
        console.error('Failed to rebuild database schema', e);
        process.exit(1);
    }
}

run();
