const pool = require('./app/config/db');
const crypto = require('crypto');

// Utility to generate a random 6-character uppercase alphanumeric code
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

async function migrate() {
    try {
        console.log('Running Marketing & Gamification database migrations...');

        // 1. Alter plans table to ensure pricing columns and features exist
        await pool.query(`
            ALTER TABLE plans ADD COLUMN IF NOT EXISTS price_yearly NUMERIC(10,2) DEFAULT 0;
            ALTER TABLE plans ADD COLUMN IF NOT EXISTS price_3_year NUMERIC(10,2) DEFAULT 0;
            ALTER TABLE plans ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
        `);
        console.log('- plans table columns verified.');

        // 2. Create coupons table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS coupons (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                discount_percentage INT DEFAULT 0,
                discount_amount NUMERIC(10,2) DEFAULT 0,
                max_uses INT DEFAULT 0,
                uses INT DEFAULT 0,
                valid_until TIMESTAMP,
                applicable_plans VARCHAR(255) DEFAULT 'all',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            INSERT INTO coupons (code, discount_percentage, discount_amount, max_uses, uses, applicable_plans)
            VALUES ('REFERRAL20', 20, 0, 0, 0, 'all')
            ON CONFLICT (code) DO NOTHING;
        `);
        console.log('- coupons table verified.');

        // 3. Alter users table to add streak, referral code, and referred_by columns
        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS last_transaction_date DATE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS has_claimed_trial BOOLEAN DEFAULT FALSE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(10) UNIQUE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id) ON DELETE SET NULL;
        `);
        console.log('- users table streak and referral columns verified.');

        // 4. Create promotions table for flash sales
        await pool.query(`
            CREATE TABLE IF NOT EXISTS promotions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                discount_percentage INT DEFAULT 0,
                end_date TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('- promotions table verified.');

        // 5. Generate referral codes for existing users that don't have one
        const usersRes = await pool.query('SELECT id, full_name, email FROM users WHERE referral_code IS NULL');
        console.log(`- Found ${usersRes.rows.length} existing users without referral codes. Generating...`);

        for (const user of usersRes.rows) {
            let uniqueCode = '';
            let isUnique = false;
            
            // Loop until we get a unique code
            while (!isUnique) {
                const code = generateReferralCode();
                const checkRes = await pool.query('SELECT id FROM users WHERE referral_code = $1', [code]);
                if (checkRes.rows.length === 0) {
                    uniqueCode = code;
                    isUnique = true;
                }
            }

            await pool.query('UPDATE users SET referral_code = $1 WHERE id = $2', [uniqueCode, user.id]);
            console.log(`  -> Assigned code '${uniqueCode}' to user: ${user.full_name || user.email}`);
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        pool.pool.end();
    }
}

migrate();
