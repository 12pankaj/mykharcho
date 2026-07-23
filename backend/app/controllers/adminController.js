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
        const { name, price_monthly, price_yearly, price_3_year, max_wallets, max_rules, features } = req.body;
        const result = await pool.query(
            'INSERT INTO plans (name, price_monthly, price_yearly, price_3_year, max_wallets, max_rules, features) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, price_monthly || 0, price_yearly || 0, price_3_year || 0, max_wallets, max_rules, features || []]
        );
        res.json({ success: true, plan: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create plan' });
    }
};

exports.updatePlan = async (req, res) => {
    try {
        const { id, price_monthly, price_yearly, price_3_year, max_wallets, max_rules } = req.body;
        await pool.query(
            'UPDATE plans SET price_monthly = $1, price_yearly = $2, price_3_year = $3, max_wallets = $4, max_rules = $5 WHERE id = $6',
            [price_monthly, price_yearly, price_3_year, max_wallets, max_rules, id]
        );
        res.json({ success: true, message: 'Plan updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update plan' });
    }
};

// --- COUPON MANAGEMENT ---
exports.getCoupons = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
        res.json({ success: true, coupons: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch coupons' });
    }
};

exports.createCoupon = async (req, res) => {
    try {
        const { code, discount_percentage, discount_amount, max_uses, valid_until, applicable_plans } = req.body;
        const result = await pool.query(
            'INSERT INTO coupons (code, discount_percentage, discount_amount, max_uses, valid_until, applicable_plans) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [code, discount_percentage || 0, discount_amount || 0, max_uses || 0, valid_until || null, applicable_plans || 'all']
        );
        res.json({ success: true, coupon: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create coupon' });
    }
};

exports.updateCoupon = async (req, res) => {
    try {
        const { id, discount_percentage, discount_amount, max_uses, valid_until, applicable_plans } = req.body;
        await pool.query(
            'UPDATE coupons SET discount_percentage = $1, discount_amount = $2, max_uses = $3, valid_until = $4, applicable_plans = $5 WHERE id = $6',
            [discount_percentage, discount_amount, max_uses, valid_until, applicable_plans, id]
        );
        res.json({ success: true, message: 'Coupon updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update coupon' });
    }
};

exports.deleteCoupon = async (req, res) => {
    try {
        await pool.query('DELETE FROM coupons WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Coupon deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete coupon' });
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

// --- PROMOTIONS MANAGEMENT (Admin) ---
exports.getPromotions = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM promotions ORDER BY created_at DESC');
        res.json({ success: true, promotions: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch promotions' });
    }
};

exports.createPromotion = async (req, res) => {
    try {
        const { title, discount_percentage, end_date, is_active } = req.body;
        const result = await pool.query(
            'INSERT INTO promotions (title, discount_percentage, end_date, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, discount_percentage || 0, end_date, is_active !== false]
        );
        res.json({ success: true, promotion: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create promotion' });
    }
};

exports.updatePromotion = async (req, res) => {
    try {
        const { id, title, discount_percentage, end_date, is_active } = req.body;
        const result = await pool.query(
            'UPDATE promotions SET title = $1, discount_percentage = $2, end_date = $3, is_active = $4 WHERE id = $5 RETURNING *',
            [title, discount_percentage, end_date, is_active, id]
        );
        res.json({ success: true, promotion: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update promotion' });
    }
};

exports.deletePromotion = async (req, res) => {
    try {
        await pool.query('DELETE FROM promotions WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Promotion deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete promotion' });
    }
};

// --- ACTIVE PROMOTION (Public / User) ---
exports.getActivePromotion = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM promotions WHERE is_active = TRUE AND end_date > NOW() ORDER BY created_at DESC LIMIT 1'
        );
        res.json({ success: true, promotion: result.rows[0] || null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch active promotion' });
    }
};
