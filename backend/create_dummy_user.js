const db = require('./app/config/db');
const bcrypt = require('bcryptjs');

const createDummyUser = async () => {
    try {
        const email = 'testuser@sparkpro.com';
        const password = 'User@123';
        const fullName = 'Test User';
        
        // Check if user exists
        const check = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            console.log('Dummy user already exists!');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await db.query(
            'INSERT INTO users (full_name, email, password_hash, role, preferred_currency, country_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [fullName, email, hashedPassword, 'user', 'INR', 'IN']
        );

        const userId = result.rows[0].id;

        // Create default wallet
        await db.query(
            'INSERT INTO wallets (user_id, name, type, balance) VALUES ($1, $2, $3, $4)',
            [userId, 'Main Wallet', 'Cash', 5000]
        );

        console.log('Dummy user created successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error creating dummy user:', err);
        process.exit(1);
    }
};

createDummyUser();
