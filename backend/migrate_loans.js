const db = require('./app/config/db');
async function run() {
    try {
        await db.query("ALTER TABLE loan_contracts ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5,2) DEFAULT 0");
        await db.query("ALTER TABLE loan_contracts ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2) DEFAULT 0");
        console.log('Columns added to loan_contracts');
    } catch(err) {
        console.error(err);
    }
    process.exit(0);
}
run();
