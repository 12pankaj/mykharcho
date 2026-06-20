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
    const columnsRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
    const columns = columnsRes.rows.map(r => r.column_name);
    console.log('User columns:', columns);
    
    const res = await pool.query('SELECT id, email, role FROM users WHERE email = $1', ['admin@mykharcho.in']);
    if (res.rows.length > 0) {
      console.log('User exists:', res.rows[0]);
      await pool.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', 'admin@mykharcho.in']);
      console.log('Role updated to admin');
      
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('admin@123', 10);
      const passCol = columns.includes('password_hash') ? 'password_hash' : 'password';
      await pool.query(`UPDATE users SET ${passCol} = $1 WHERE email = $2`, [hash, 'admin@mykharcho.in']);
      console.log('Password updated successfully');
    } else {
      console.log('User does not exist. Creating user...');
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('admin@123', 10);
      const passCol = columns.includes('password_hash') ? 'password_hash' : 'password';
      await pool.query(`INSERT INTO users (full_name, email, ${passCol}, role) VALUES ($1, $2, $3, $4)`, ['Admin User', 'admin@mykharcho.in', hash, 'admin']);
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}
main();
