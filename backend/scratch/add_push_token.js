const { Client } = require('pg');
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'expense_tracker',
    password: 'root',
    port: 5432,
});

async function run() {
    await client.connect();
    try {
        await client.query('ALTER TABLE users ADD COLUMN push_token VARCHAR(255);');
        console.log('Successfully added push_token column.');
    } catch (e) {
        console.log('Column might already exist or error: ', e.message);
    }
    await client.end();
}
run();
