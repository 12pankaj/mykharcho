const db = require('../config/db');

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

        await db.query('COMMIT');
        res.status(201).json(newTx.rows[0]);
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
