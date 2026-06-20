const db = require('../app/config/db');

async function checkWallets() {
    try {
        const users = await db.query("SELECT * FROM users WHERE email = 'pankajdadhich778@gmail.com'");
        if (users.rows.length === 0) {
            console.log("User not found");
            process.exit(0);
        }
        const user = users.rows[0];
        console.log("User:", user.email, "ID:", user.id);
        
        const wallets = await db.query('SELECT * FROM wallets WHERE user_id = $1', [user.id]);
        console.log("Wallets:", wallets.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

checkWallets();
