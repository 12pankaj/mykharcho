const db = require('./app/config/db');
async function run() {
    try {
        await db.query("ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'Expense'");
        console.log('Column added');
    } catch(err) {
        console.error(err);
    }
    process.exit(0);
}
run();
