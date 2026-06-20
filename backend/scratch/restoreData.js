const fs = require('fs');
const db = require('../app/config/db');
const crypto = require('crypto');

async function restore() {
    try {
        console.log('Reading backup data...');
        const raw = fs.readFileSync(__dirname + '/../backup_data.json', 'utf8');
        const data = JSON.parse(raw);
        
        // Maps to hold old integer ID -> new UUID
        const idMap = {
            users: {},
            wallets: {},
            loans: {}
        };

        await db.query('BEGIN');

        console.log('Restoring users...');
        for (let user of data.users) {
            const newId = crypto.randomUUID();
            idMap.users[user.id] = newId;
            
            // Note: we're dropping old current_plan_id for now or keeping it null unless it's mapped to new UUID plans
            // Actually plans were re-inserted by the rebuild script and get random UUIDs!
            // Wait, I need to fetch the newly generated plan UUIDs.
            const freePlan = await db.query("SELECT id FROM plans WHERE name = 'Free' LIMIT 1");
            const planId = freePlan.rows[0].id;
            
            await db.query(`
                INSERT INTO users (id, full_name, email, password_hash, role, current_plan_id)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [newId, user.full_name, user.email, user.password_hash, user.role, planId]);
        }

        console.log('Restoring wallets...');
        for (let wallet of data.wallets) {
            if (!idMap.users[wallet.user_id]) continue;
            const newId = crypto.randomUUID();
            idMap.wallets[wallet.id] = newId;
            
            await db.query(`
                INSERT INTO wallets (id, user_id, name, type, balance)
                VALUES ($1, $2, $3, $4, $5)
            `, [newId, idMap.users[wallet.user_id], wallet.name, wallet.type, wallet.balance]);
        }

        console.log('Restoring transactions...');
        for (let tx of data.transactions) {
            if (!idMap.users[tx.user_id] || !idMap.wallets[tx.wallet_id]) continue;
            await db.query(`
                INSERT INTO transactions (user_id, wallet_id, amount, type, category, notes, is_automated)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [idMap.users[tx.user_id], idMap.wallets[tx.wallet_id], tx.amount, tx.type, tx.category, tx.notes, tx.is_automated]);
        }

        await db.query('COMMIT');
        console.log('Restore successful!');
        process.exit(0);

    } catch (e) {
        await db.query('ROLLBACK');
        console.error('Failed to restore data', e);
        process.exit(1);
    }
}

restore();
