const db = require('../config/db');
const Notification = require('../models/notificationModel');

exports.getTransactions = async (req, res) => {
    try {
        const transactions = await db.query(
            'SELECT * FROM transactions WHERE user_id = $1 ORDER BY transaction_date DESC LIMIT 50',
            [req.user.id]
        );
        res.json(transactions.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching transactions' });
    }
};

exports.addTransaction = async (req, res) => {
    const { walletId, amount, type, category, notes, transaction_date } = req.body;
    try {
        // Start transaction
        await db.query('BEGIN');

        let newTx;
        if (transaction_date) {
            newTx = await db.query(
                'INSERT INTO transactions (user_id, wallet_id, amount, type, category, notes, transaction_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [req.user.id, walletId, amount, type, category, notes, transaction_date]
            );
        } else {
            newTx = await db.query(
                'INSERT INTO transactions (user_id, wallet_id, amount, type, category, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [req.user.id, walletId, amount, type, category, notes]
            );
        }

        // Update wallet balance
        const multiplier = type === 'Income' ? 1 : -1;
        await db.query(
            'UPDATE wallets SET balance = balance + $1 WHERE id = $2 AND user_id = $3',
            [amount * multiplier, walletId, req.user.id]
        );

        let trialUnlocked = false;
        let finalStreak = 0;
        if (type === 'Expense') {
            const userRes = await db.query(
                'SELECT current_streak, last_transaction_date, has_claimed_trial, current_plan_id FROM users WHERE id = $1',
                [req.user.id]
            );
            if (userRes.rows.length > 0) {
                const { current_streak, last_transaction_date, has_claimed_trial, current_plan_id } = userRes.rows[0];
                
                const formatDateLocal = (dateInput) => {
                    if (typeof dateInput === 'string' && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        return dateInput;
                    }
                    const d = new Date(dateInput);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                };

                const txDateStr = formatDateLocal(transaction_date || new Date());
                
                let newStreak = 1;
                if (last_transaction_date) {
                    const lastDateStr = formatDateLocal(last_transaction_date);
                    const diffTime = new Date(txDateStr) - new Date(lastDateStr);
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 1) {
                        newStreak = (current_streak || 0) + 1;
                    } else if (diffDays === 0) {
                        newStreak = (current_streak || 0) || 1;
                    } else if (diffDays < 0) {
                        newStreak = (current_streak || 0) || 1;
                    } else {
                        newStreak = 1;
                    }
                }
                
                finalStreak = newStreak;
                const freePlanId = '197f1815-141b-492f-bd2a-398ba6dc53d9';
                if (newStreak >= 7 && !has_claimed_trial && current_plan_id === freePlanId) {
                    trialUnlocked = true;
                }
                
                await db.query(
                    'UPDATE users SET current_streak = $1, last_transaction_date = $2 WHERE id = $3',
                    [newStreak, txDateStr, req.user.id]
                );
            }
        } else {
            const userRes = await db.query('SELECT current_streak FROM users WHERE id = $1', [req.user.id]);
            if (userRes.rows.length > 0) {
                finalStreak = userRes.rows[0].current_streak || 0;
            }
        }

        await db.query('COMMIT');

        // High Spending Alert Logic
        if (type === 'Expense') {
            try {
                // Get user's monthly budget
                const userRes = await db.query('SELECT monthly_budget FROM users WHERE id = $1', [req.user.id]);
                const monthlyBudget = userRes.rows[0]?.monthly_budget;

                if (monthlyBudget && monthlyBudget > 0) {
                    // Calculate total expenses for current month
                    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
                    const expenseRes = await db.query(
                        `SELECT SUM(amount) as total_expense 
                         FROM transactions 
                         WHERE user_id = $1 AND type = 'Expense' AND transaction_date >= $2`,
                        [req.user.id, currentMonthStart]
                    );
                    
                    const totalExpense = parseFloat(expenseRes.rows[0].total_expense || 0);
                    const percentageUsed = (totalExpense / parseFloat(monthlyBudget)) * 100;

                    // Trigger alert if >= 80% (only if we haven't already alerted for this transaction to avoid spam? For now, we alert)
                    if (percentageUsed >= 80) {
                        const title = percentageUsed >= 100 ? 'Budget Exceeded!' : 'High Spending Alert';
                        const message = `You have spent ${percentageUsed.toFixed(1)}% of your monthly budget (₹${parseFloat(monthlyBudget).toLocaleString()}).`;
                        await Notification.create(req.user.id, title, message, 'expense');
                    }
                }
            } catch (alertErr) {
                console.error('Failed to process spending alert:', alertErr);
            }
        }

        res.status(201).json({
            ...newTx.rows[0],
            trialUnlocked,
            currentStreak: finalStreak
        });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Error adding transaction' });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const balanceResult = await db.query(
            'SELECT SUM(balance) as total_balance FROM wallets WHERE user_id = $1',
            [req.user.id]
        );

        // Current Month Stats (Last 30 days)
        const currentStats = await db.query(
            `SELECT 
                SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) as expense
             FROM transactions 
             WHERE user_id = $1 AND transaction_date > NOW() - INTERVAL '30 days'`,
            [req.user.id]
        );

        // Previous Month Stats (30-60 days ago)
        const previousStats = await db.query(
            `SELECT 
                SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) as expense
             FROM transactions 
             WHERE user_id = $1 AND transaction_date <= NOW() - INTERVAL '30 days' 
             AND transaction_date > NOW() - INTERVAL '60 days'`,
            [req.user.id]
        );

        const cur = currentStats.rows[0];
        const prev = previousStats.rows[0];

        const calculateTrend = (current, previous) => {
            if (!previous || parseFloat(previous) === 0) return '+0%';
            const change = ((parseFloat(current) - parseFloat(previous)) / parseFloat(previous)) * 100;
            return (change >= 0 ? '+' : '') + change.toFixed(1) + '%';
        };

        // Chart Data (Last 30 days, grouped by day)
        const chartDataQuery = await db.query(
            `SELECT 
                TO_CHAR(transaction_date, 'Mon DD') as date,
                SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) as expense
             FROM transactions
             WHERE user_id = $1 AND transaction_date > NOW() - INTERVAL '30 days'
             GROUP BY TO_CHAR(transaction_date, 'Mon DD'), DATE(transaction_date)
             ORDER BY DATE(transaction_date) ASC`,
            [req.user.id]
        );

        res.json({
            balance: parseFloat(balanceResult.rows[0]?.total_balance || 0),
            income: parseFloat(cur?.income || 0),
            expense: parseFloat(cur?.expense || 0),
            incomeTrend: calculateTrend(cur?.income, prev?.income),
            expenseTrend: calculateTrend(cur?.expense, prev?.expense),
            chartData: chartDataQuery.rows.map(r => ({
                date: r.date,
                Income: parseFloat(r.income),
                Expense: parseFloat(r.expense)
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching stats' });
    }
};

exports.updateTransaction = async (req, res) => {
    const { id } = req.params;
    const { walletId, amount, type, category, notes, transaction_date } = req.body;
    try {
        await db.query('BEGIN');
        
        // 1. Get original transaction to reverse balance
        const oldTxRes = await db.query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (oldTxRes.rows.length === 0) throw new Error('Transaction not found');
        const oldTx = oldTxRes.rows[0];

        // 2. Reverse old balance
        const oldMultiplier = oldTx.type === 'Income' ? -1 : 1;
        await db.query(
            'UPDATE wallets SET balance = balance + $1 WHERE id = $2 AND user_id = $3',
            [parseFloat(oldTx.amount) * oldMultiplier, oldTx.wallet_id, req.user.id]
        );

        // 3. Apply new transaction and balance
        let updatedTx;
        if (transaction_date) {
            updatedTx = await db.query(
                'UPDATE transactions SET wallet_id = $1, amount = $2, type = $3, category = $4, notes = $5, transaction_date = $6 WHERE id = $7 AND user_id = $8 RETURNING *',
                [walletId, amount, type, category, notes, transaction_date, id, req.user.id]
            );
        } else {
            updatedTx = await db.query(
                'UPDATE transactions SET wallet_id = $1, amount = $2, type = $3, category = $4, notes = $5 WHERE id = $6 AND user_id = $7 RETURNING *',
                [walletId, amount, type, category, notes, id, req.user.id]
            );
        }

        const newMultiplier = type === 'Income' ? 1 : -1;
        await db.query(
            'UPDATE wallets SET balance = balance + $1 WHERE id = $2 AND user_id = $3',
            [parseFloat(amount) * newMultiplier, walletId, req.user.id]
        );

        await db.query('COMMIT');
        res.json(updatedTx.rows[0]);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Error updating transaction' });
    }
};

exports.deleteTransaction = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('BEGIN');
        
        const txRes = await db.query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (txRes.rows.length === 0) throw new Error('Transaction not found');
        const tx = txRes.rows[0];

        // Reverse wallet balance
        const multiplier = tx.type === 'Income' ? -1 : 1;
        await db.query(
            'UPDATE wallets SET balance = balance + $1 WHERE id = $2 AND user_id = $3',
            [parseFloat(tx.amount) * multiplier, tx.wallet_id, req.user.id]
        );

        await db.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, req.user.id]);

        await db.query('COMMIT');
        res.json({ message: 'Transaction deleted' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Error deleting transaction' });
    }
};
