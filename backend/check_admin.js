const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function check() {
    const res = await pool.query("SELECT email, role FROM users WHERE role = 'admin'");
    console.log('--- ADMIN USERS ---');
    console.table(res.rows);
    await pool.end();
}

check();
