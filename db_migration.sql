-- PROD-READY DB SCHEMA FOR EXPENSE TRACKER (POSTGRESQL)

-- 1. Users Table (Handles Google & Local Auth)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT, 
    google_id VARCHAR(255) UNIQUE, 
    profile_pic TEXT,
    preferred_currency VARCHAR(10) DEFAULT 'INR', -- e.g., USD, EUR, AED
    country_code VARCHAR(5) DEFAULT 'IN', -- e.g., US, GB, AE
    current_plan_id INTEGER DEFAULT 1, -- Defaults to 'Free' plan
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Wallets (Accounts)
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., HDFC Savings, Cash, Binance
    type VARCHAR(50) DEFAULT 'Cash', 
    balance DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Transactions (Income/Expense/Transfer)
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    wallet_id INTEGER REFERENCES wallets(id) ON DELETE SET NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'Income', 'Expense', 'Transfer'
    category VARCHAR(50), -- 'Food', 'Salary', 'Rent', etc.
    notes TEXT,
    receipt_url TEXT,
    is_automated BOOLEAN DEFAULT FALSE,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Automation Rules (Cron Jobs)
CREATE TABLE automation_rules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    wallet_id INTEGER REFERENCES wallets(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(20) DEFAULT 'Expense',
    category VARCHAR(50),
    frequency VARCHAR(20), -- 'Daily', 'Weekly', 'Monthly'
    next_run_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active'
);

-- 5. Loan Contracts
CREATE TABLE loan_contracts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    party_name VARCHAR(100) NOT NULL,
    party_phone VARCHAR(20),
    role VARCHAR(20) NOT NULL, -- 'Lender', 'Borrower'
    total_principal DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Settled'
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE
);

-- 6. Loan Installments (EMI tracking)
CREATE TABLE loan_installments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    contract_id INTEGER REFERENCES loan_contracts(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    emi_amount DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Paid', 'Partial'
    payment_date TIMESTAMP
);

-- INDEXES for Performance
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_loans_user ON loan_contracts(user_id);
CREATE INDEX idx_wallets_user ON wallets(user_id);

-- 7. SaaS Subscription Plans
CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- 'Free', 'Pro', 'Elite'
    price_monthly DECIMAL(10, 2) DEFAULT 0,
    price_yearly DECIMAL(10, 2) DEFAULT 0,
    max_wallets INTEGER DEFAULT 2,
    max_rules INTEGER DEFAULT 2,
    can_auto_emi BOOLEAN DEFAULT FALSE,
    can_export_pdf BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Plans
INSERT INTO plans (name, price_monthly, price_yearly, max_wallets, max_rules, can_auto_emi, can_export_pdf) 
VALUES 
('Free', 0, 0, 2, 2, FALSE, FALSE),
('Pro', 9.99, 99.99, 5, 10, TRUE, TRUE),
('Elite', 19.99, 199.99, 1000, 1000, TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- 8. User Subscriptions (Active Plans tracking)
CREATE TABLE user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES plans(id),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'past_due', 'canceled'
    current_period_end TIMESTAMP,
    payment_provider VARCHAR(50), -- 'stripe', 'razorpay'
    provider_subscription_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Payments History
CREATE TABLE payments_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed', 'pending'
    provider_payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Support Tickets (Help Desk)
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Open', -- 'Open', 'In Progress', 'Resolved'
    priority VARCHAR(20) DEFAULT 'Normal', -- 'Low', 'Normal', 'High'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Support Messages (Thread inside a ticket)
CREATE TABLE support_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) DEFAULT 'user', -- 'user', 'admin'
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
