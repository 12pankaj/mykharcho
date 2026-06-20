const fs = require('fs');
const db = require('../app/config/db');

async function backup() {
    try {
        console.log('Starting backup...');
        const users = await db.query('SELECT * FROM users');
        const wallets = await db.query('SELECT * FROM wallets');
        const transactions = await db.query('SELECT * FROM transactions');
        const rules = await db.query('SELECT * FROM automation_rules');
        const loans = await db.query('SELECT * FROM loan_contracts');
        const installments = await db.query('SELECT * FROM loan_installments');
        
        const data = {
            users: users.rows,
            wallets: wallets.rows,
            transactions: transactions.rows,
            rules: rules.rows,
            loans: loans.rows,
            installments: installments.rows
        };

        fs.writeFileSync('backup_data.json', JSON.stringify(data, null, 2));
        console.log('Backup successful. Wrote to backup_data.json');
        process.exit(0);
    } catch (e) {
        console.error('Backup failed', e);
        process.exit(1);
    }
}

backup();
