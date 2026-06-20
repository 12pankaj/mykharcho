const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'expense_tracker',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5432,
});

exports.createGroup = async (req, res) => {
    const { name, description } = req.body;
    const userId = req.user.id;
    try {
        const result = await pool.query(
            'INSERT INTO expense_groups (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
            [name, description, userId]
        );
        const newGroup = result.rows[0];

        // Add creator as member
        await pool.query(
            'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
            [newGroup.id, userId]
        );

        res.status(201).json({ success: true, group: newGroup });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getGroups = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await pool.query(`
            SELECT eg.* FROM expense_groups eg
            JOIN group_members gm ON eg.id = gm.group_id
            WHERE gm.user_id = $1
            ORDER BY eg.created_at DESC
        `, [userId]);
        res.json({ success: true, groups: result.rows });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getGroupDetails = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        // Verify membership
        const memCheck = await pool.query('SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2', [id, userId]);
        if (memCheck.rowCount === 0) return res.status(403).json({ success: false, message: 'Access denied' });

        const groupRes = await pool.query('SELECT * FROM expense_groups WHERE id = $1', [id]);
        
        const membersRes = await pool.query(`
            SELECT u.id, u.full_name, u.email 
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = $1
        `, [id]);

        const expensesRes = await pool.query(`
            SELECT ge.*, u.full_name as paid_by_name 
            FROM group_expenses ge
            JOIN users u ON ge.paid_by = u.id
            WHERE ge.group_id = $1
            ORDER BY ge.expense_date DESC
        `, [id]);

        res.json({ 
            success: true, 
            group: groupRes.rows[0],
            members: membersRes.rows,
            expenses: expensesRes.rows
        });
    } catch (error) {
        console.error('Error fetching group details:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.addMember = async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;
    try {
        const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userRes.rowCount === 0) return res.status(404).json({ success: false, message: 'User not found. They must register first.' });
        
        const newUserId = userRes.rows[0].id;

        await pool.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, newUserId]);
        
        res.json({ success: true, message: 'Member added successfully' });
    } catch (error) {
        console.error('Error adding member:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.addExpense = async (req, res) => {
    const { id } = req.params;
    const { description, amount, paid_by, splits } = req.body; 
    // splits = [{ user_id: 1, amount_owed: 50 }, { user_id: 2, amount_owed: 50 }]
    try {
        await pool.query('BEGIN');

        const expRes = await pool.query(
            'INSERT INTO group_expenses (group_id, paid_by, amount, description) VALUES ($1, $2, $3, $4) RETURNING id',
            [id, paid_by || req.user.id, amount, description]
        );
        const expenseId = expRes.rows[0].id;

        for (let split of splits) {
            await pool.query(
                'INSERT INTO expense_splits (expense_id, user_id, amount_owed) VALUES ($1, $2, $3)',
                [expenseId, split.user_id, split.amount_owed]
            );
        }

        await pool.query('COMMIT');
        res.status(201).json({ success: true, message: 'Expense added successfully' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error adding expense:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Advanced Settlement Optimization Algorithm (Greedy approach)
exports.getOptimizedSettlements = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Calculate Net Balances for each user in the group
        const balances = {}; // { userId: netAmount } (Positive means they are owed money, Negative means they owe money)

        // Add what they paid
        const paidRes = await pool.query('SELECT paid_by, SUM(amount) as total_paid FROM group_expenses WHERE group_id = $1 GROUP BY paid_by', [id]);
        paidRes.rows.forEach(r => {
            balances[r.paid_by] = (balances[r.paid_by] || 0) + parseFloat(r.total_paid);
        });

        // Subtract what they owe
        const owedRes = await pool.query(`
            SELECT es.user_id, SUM(es.amount_owed) as total_owed 
            FROM expense_splits es
            JOIN group_expenses ge ON es.expense_id = ge.id
            WHERE ge.group_id = $1
            GROUP BY es.user_id
        `, [id]);
        
        owedRes.rows.forEach(r => {
            balances[r.user_id] = (balances[r.user_id] || 0) - parseFloat(r.total_owed);
        });

        // Fetch user names for mapping
        const membersRes = await pool.query(`
            SELECT u.id, u.full_name, u.upi_id 
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = $1
        `, [id]);
        const userMap = {};
        membersRes.rows.forEach(r => userMap[r.id] = { name: r.full_name, upi: r.upi_id });

        // 2. Separate into Debtors and Creditors
        let debtors = [];
        let creditors = [];

        for (const [userId, balance] of Object.entries(balances)) {
            if (balance < -0.01) debtors.push({ userId, amount: -balance });
            else if (balance > 0.01) creditors.push({ userId, amount: balance });
        }

        // 3. Sort them descending to match largest debtor with largest creditor
        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        // 4. Resolve debts (Greedy Algorithm)
        const settlements = [];
        let i = 0; // debtor index
        let j = 0; // creditor index

        while (i < debtors.length && j < creditors.length) {
            let debtor = debtors[i];
            let creditor = creditors[j];

            let settlementAmount = Math.min(debtor.amount, creditor.amount);

            settlements.push({
                from: debtor.userId,
                from_name: userMap[debtor.userId].name,
                to: creditor.userId,
                to_name: userMap[creditor.userId].name,
                to_upi_id: userMap[creditor.userId].upi,
                amount: parseFloat(settlementAmount.toFixed(2))
            });

            debtor.amount -= settlementAmount;
            creditor.amount -= settlementAmount;

            if (debtor.amount < 0.01) i++;
            if (creditor.amount < 0.01) j++;
        }

        res.json({ success: true, settlements, balances });
    } catch (error) {
        console.error('Error calculating settlements:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.settleDebt = async (req, res) => {
    const { id } = req.params;
    const { paid_by, paid_to, amount } = req.body;
    try {
        await pool.query(
            'INSERT INTO settlements (group_id, paid_by, paid_to, amount) VALUES ($1, $2, $3, $4)',
            [id, paid_by, paid_to, amount]
        );
        // Under the hood, a settlement acts like an expense where `paid_by` pays for `paid_to`
        const expRes = await pool.query(
            'INSERT INTO group_expenses (group_id, paid_by, amount, description) VALUES ($1, $2, $3, $4) RETURNING id',
            [id, paid_by, amount, 'Settlement Payment']
        );
        const expenseId = expRes.rows[0].id;
        
        await pool.query(
            'INSERT INTO expense_splits (expense_id, user_id, amount_owed) VALUES ($1, $2, $3)',
            [expenseId, paid_to, amount]
        );

        res.json({ success: true, message: 'Debt settled successfully' });
    } catch (error) {
        console.error('Error settling debt:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
