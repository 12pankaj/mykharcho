const pool = require('../config/db');

// --- PAYMENT MANAGEMENT ---
exports.getAllPayments = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, u.full_name as user_name, u.email as user_email 
            FROM payments_history p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
        `);
        res.json({ success: true, payments: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
};

// --- SUPPORT TICKET MANAGEMENT ---
exports.getAllTickets = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT t.*, u.full_name as user_name, a.full_name as agent_name 
            FROM support_tickets t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN users a ON t.assigned_to = a.id
            ORDER BY t.created_at DESC
        `);
        res.json({ success: true, tickets: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
};

exports.assignTicket = async (req, res) => {
    try {
        const { ticketId, agentId } = req.body;
        await pool.query(
            'UPDATE support_tickets SET assigned_to = $1, status = $2 WHERE id = $3',
            [agentId, 'In Progress', ticketId]
        );
        res.json({ success: true, message: 'Ticket assigned successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to assign ticket' });
    }
};

exports.resolveTicket = async (req, res) => {
    try {
        const { ticketId } = req.body;
        await pool.query(
            "UPDATE support_tickets SET status = 'Resolved' WHERE id = $1",
            [ticketId]
        );
        res.json({ success: true, message: 'Ticket resolved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to resolve ticket' });
    }
};

// --- AGENT LIST ---
exports.getAgents = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, full_name, email, role FROM users WHERE role IN ('admin', 'agent')"
        );
        res.json({ success: true, agents: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch agents' });
    }
};

// --- PLAN MANAGEMENT ---
exports.getPlans = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM plans ORDER BY id ASC');
        res.json({ success: true, plans: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
};

exports.createPlan = async (req, res) => {
    try {
        const { name, price_monthly, max_wallets, max_rules, features } = req.body;
        const result = await pool.query(
            'INSERT INTO plans (name, price_monthly, max_wallets, max_rules, features) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, price_monthly, max_wallets, max_rules, features || []]
        );
        res.json({ success: true, plan: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create plan' });
    }
};

exports.updatePlan = async (req, res) => {
    try {
        const { id, price_monthly, max_wallets, max_rules } = req.body;
        await pool.query(
            'UPDATE plans SET price_monthly = $1, max_wallets = $2, max_rules = $3 WHERE id = $4',
            [price_monthly, max_wallets, max_rules, id]
        );
        res.json({ success: true, message: 'Plan updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update plan' });
    }
};

// --- USER MANAGEMENT ---
exports.getUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.full_name, u.email, u.role, u.is_premium, u.current_plan_id, p.name as plan_name, u.created_at
            FROM users u
            LEFT JOIN plans p ON u.current_plan_id = p.id
            ORDER BY u.created_at DESC
        `);
        res.json({ success: true, users: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// --- ADMIN DASHBOARD STATS ---
exports.getAdminStats = async (req, res) => {
    try {
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        const revenue = await pool.query('SELECT SUM(amount) FROM payments_history');
        const tickets = await pool.query("SELECT COUNT(*) FROM support_tickets WHERE status != 'Resolved'");
        const activeSubs = await pool.query('SELECT COUNT(*) FROM user_subscriptions WHERE status = $1', ['active']);
        
        // Monthly Revenue for Chart
        const chartData = await pool.query(`
            SELECT TO_CHAR(created_at, 'Mon DD') as date, SUM(amount) as revenue
            FROM payments_history
            WHERE created_at > NOW() - INTERVAL '30 days'
            GROUP BY TO_CHAR(created_at, 'Mon DD'), DATE(created_at)
            ORDER BY DATE(created_at) ASC
        `);

        res.json({
            success: true,
            stats: {
                totalUsers: parseInt(userCount.rows[0].count),
                totalRevenue: parseFloat(revenue.rows[0].sum || 0),
                openTickets: parseInt(tickets.rows[0].count),
                activeSubscriptions: parseInt(activeSubs.rows[0].count)
            },
            chartData: chartData.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
};
