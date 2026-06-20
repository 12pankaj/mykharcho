const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'expense_tracker',
  password: 'root',
  port: 5432,
});

async function main() {
  try {
    const res = await pool.query("SELECT id, full_name, email, role, created_at FROM users WHERE role = 'admin' OR role = 'Admin'");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}
main();
