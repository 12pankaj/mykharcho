const db = require('../config/db');

exports.getRules = async (req, res) => {
    try {
        const rules = await db.query(
            'SELECT * FROM automation_rules WHERE user_id = $1 ORDER BY next_run_date ASC',
            [req.user.id]
        );
        res.json(rules.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching automation rules' });
    }
};

exports.createRule = async (req, res) => {
    const { walletId, name, amount, type, category, frequency, nextRunDate } = req.body;
    try {
        // 1. Get user's current plan limits and current rules count
        const planData = await db.query(
            `SELECT p.max_rules, (SELECT COUNT(*) FROM automation_rules WHERE user_id = $1) as current_count 
             FROM users u 
             JOIN plans p ON u.current_plan_id = p.id 
             WHERE u.id = $1`,
            [req.user.id]
        );

        if (planData.rows.length === 0) {
            return res.status(404).json({ message: 'User or plan not found' });
        }

        const { max_rules, current_count } = planData.rows[0];

        if (parseInt(current_count) >= parseInt(max_rules)) {
            return res.status(403).json({ 
                message: `Automation rule limit reached. Your current plan allows only ${max_rules} rules. Please upgrade for more.`,
                limitReached: true
            });
        }

        const newRule = await db.query(
            'INSERT INTO automation_rules (user_id, wallet_id, name, amount, type, category, frequency, next_run_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [req.user.id, walletId, name, amount, type || 'Expense', category, frequency, nextRunDate]
        );
        res.status(201).json(newRule.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating rule' });
    }
};

exports.deleteRule = async (req, res) => {
    try {
        await db.query('DELETE FROM automation_rules WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ message: 'Rule deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting rule' });
    }
};

exports.updateRule = async (req, res) => {
    const { id } = req.params;
    const { walletId, name, amount, type, category, frequency, nextRunDate, status } = req.body;
    try {
        const updatedRule = await db.query(
            'UPDATE automation_rules SET wallet_id = $1, name = $2, amount = $3, type = $4, category = $5, frequency = $6, next_run_date = $7, status = $8 WHERE id = $9 AND user_id = $10 RETURNING *',
            [walletId, name, amount, type, category, frequency, nextRunDate, status || 'Active', id, req.user.id]
        );
        if (updatedRule.rows.length === 0) {
            return res.status(404).json({ message: 'Rule not found' });
        }
        res.json(updatedRule.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating rule' });
    }
};
