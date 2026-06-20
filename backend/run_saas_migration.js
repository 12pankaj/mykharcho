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
    console.log('Running SaaS migration...');
    
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS current_plan_id INTEGER DEFAULT 1;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
      
      CREATE TABLE IF NOT EXISTS plans (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          price_monthly DECIMAL(10, 2) DEFAULT 0,
          price_yearly DECIMAL(10, 2) DEFAULT 0,
          max_wallets INTEGER DEFAULT 2,
          max_rules INTEGER DEFAULT 2,
          can_auto_emi BOOLEAN DEFAULT FALSE,
          can_export_pdf BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      INSERT INTO plans (name, price_monthly, price_yearly, max_wallets, max_rules, can_auto_emi, can_export_pdf) 
      VALUES 
      ('Free', 0, 0, 2, 2, FALSE, FALSE),
      ('Pro', 9.99, 99.99, 5, 10, TRUE, TRUE),
      ('Elite', 19.99, 199.99, 1000, 1000, TRUE, TRUE)
      ON CONFLICT DO NOTHING;
      
      CREATE TABLE IF NOT EXISTS user_subscriptions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          plan_id INTEGER REFERENCES plans(id),
          status VARCHAR(20) DEFAULT 'active',
          current_period_end TIMESTAMP,
          payment_provider VARCHAR(50),
          provider_subscription_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS payments_history (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          amount DECIMAL(15, 2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'INR',
          status VARCHAR(20) DEFAULT 'success',
          provider_payment_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS support_tickets (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          subject VARCHAR(200) NOT NULL,
          description TEXT NOT NULL,
          status VARCHAR(20) DEFAULT 'Open',
          priority VARCHAR(20) DEFAULT 'Normal',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS support_messages (
          id SERIAL PRIMARY KEY,
          ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
          sender_type VARCHAR(20) DEFAULT 'user',
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    pool.end();
  }
}

migrate();
