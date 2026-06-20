const db = require('../config/db');

exports.getWallets = async (req, res) => {
    try {
        const wallets = await db.query(
            'SELECT * FROM wallets WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(wallets.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching wallets' });
    }
};

exports.createWallet = async (req, res) => {
    const { name, type, balance } = req.body;
    try {
        // 1. Get user's current plan limits and current wallet count
        const planData = await db.query(
            `SELECT p.max_wallets, (SELECT COUNT(*) FROM wallets WHERE user_id = $1) as current_count 
             FROM users u 
             JOIN plans p ON u.current_plan_id = p.id 
             WHERE u.id = $1`,
            [req.user.id]
        );

        if (planData.rows.length === 0) {
            return res.status(404).json({ message: 'User or plan not found' });
        }

        const { max_wallets, current_count } = planData.rows[0];

        if (parseInt(current_count) >= parseInt(max_wallets)) {
            return res.status(403).json({ 
                message: `Wallet limit reached. Your current plan allows only ${max_wallets} wallets. Please upgrade for more.`,
                limitReached: true
            });
        }

        const newWallet = await db.query(
            'INSERT INTO wallets (user_id, name, type, balance) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, name, type || 'Cash', balance || 0]
        );
        res.status(201).json(newWallet.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating wallet' });
    }
};

exports.updateWallet = async (req, res) => {
    const { id } = req.params;
    const { name, type, balance } = req.body;
    try {
        const updatedWallet = await db.query(
            'UPDATE wallets SET name = $1, type = $2, balance = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
            [name, type, balance, id, req.user.id]
        );
        if (updatedWallet.rows.length === 0) {
            return res.status(404).json({ message: 'Wallet not found' });
        }
        res.json(updatedWallet.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating wallet' });
    }
};

exports.deleteWallet = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedWallet = await db.query(
            'DELETE FROM wallets WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );
        if (deletedWallet.rows.length === 0) {
            return res.status(404).json({ message: 'Wallet not found' });
        }
        res.json({ message: 'Wallet deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting wallet' });
    }
};
