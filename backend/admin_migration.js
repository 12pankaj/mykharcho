const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigration() {
    try {
        console.log('Running Admin/Agent migration...');
        
        // 1. Add Role to Users
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'");
        
        // 2. Add Assignment to Tickets
        await pool.query("ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id)");
        
        // 3. Make the first user an Admin for testing
        await pool.query("UPDATE users SET role = 'admin' WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)");
        
        console.log('Migration successful!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
