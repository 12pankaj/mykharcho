const pool = require('./app/config/db');

async function checkSchema() {
    try {
        const res = await pool.query("SELECT * FROM plans ORDER BY price_monthly ASC");
        console.log("PLANS:", res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.pool.end();
    }
}

checkSchema();
