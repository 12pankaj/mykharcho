const db = require('../app/config/db');

async function createLedgerForUser() {
    const email = 'pankajdadhich778@gmail.com';
    try {
        const userRes = await db.query('SELECT id, full_name FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            console.log(`No user found with email: ${email}`);
            return;
        }
        const user = userRes.rows[0];
        console.log(`Creating ledger for user: ${user.full_name} (ID: ${user.id})`);

        const ledgerName = 'Monthly Dues (Udhaar Ledger)';
        
        // Check if already exists for this user
        const existsRes = await db.query('SELECT * FROM wallets WHERE user_id = $1 AND name = $2', [user.id, ledgerName]);
        if (existsRes.rows.length > 0) {
            console.log('Ledger already exists for this user.');
            return;
        }

        await db.query(
            'INSERT INTO wallets (user_id, name, type, balance) VALUES ($1, $2, $3, $4)',
            [user.id, ledgerName, 'Credit', 0]
        );
        console.log('Ledger wallet created successfully for pankajdadhich778@gmail.com!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

createLedgerForUser();
