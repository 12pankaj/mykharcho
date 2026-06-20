const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'expense_tracker',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 5432,
});

async function migrate() {
  try {
    console.log('Running Group Expenses migration...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expense_groups (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS group_members (
          group_id INTEGER REFERENCES expense_groups(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (group_id, user_id)
      );
      
      CREATE TABLE IF NOT EXISTS group_expenses (
          id SERIAL PRIMARY KEY,
          group_id INTEGER REFERENCES expense_groups(id) ON DELETE CASCADE,
          paid_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
          amount DECIMAL(15, 2) NOT NULL,
          description VARCHAR(255) NOT NULL,
          expense_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS expense_splits (
          id SERIAL PRIMARY KEY,
          expense_id INTEGER REFERENCES group_expenses(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          amount_owed DECIMAL(15, 2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settlements (
          id SERIAL PRIMARY KEY,
          group_id INTEGER REFERENCES expense_groups(id) ON DELETE CASCADE,
          paid_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
          paid_to INTEGER REFERENCES users(id) ON DELETE CASCADE,
          amount DECIMAL(15, 2) NOT NULL,
          settled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Group Expenses Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    pool.end();
  }
}

migrate();
