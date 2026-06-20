const db = require('./app/config/db');

async function migrateAuth() {
    try {
        console.log('Starting Auth migration...');
        
        // Add google_id
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
        `);
        console.log('Added google_id column.');

        // Add reset_password_token
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);
        `);
        console.log('Added reset_password_token column.');

        // Add reset_password_expires
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
        `);
        console.log('Added reset_password_expires column.');

        console.log('Auth migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error running Auth migration:', err);
        process.exit(1);
    }
}

migrateAuth();
