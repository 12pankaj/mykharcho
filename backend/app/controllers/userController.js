const db = require('../config/db');

exports.getProfile = async (req, res) => {
    try {
        const user = await db.query(
            `SELECT u.id, u.full_name, u.email, u.preferred_currency, u.country_code, u.profile_pic, u.is_premium, u.current_plan_id, u.role, u.upi_id,
                    p.name as plan_name, p.max_wallets, p.max_rules, p.can_auto_emi, p.can_export_pdf
             FROM users u
             LEFT JOIN plans p ON u.current_plan_id = p.id
             WHERE u.id = $1`,
            [req.user.id]
        );
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching profile' });
    }
};

exports.updateProfile = async (req, res) => {
    const { fullName, currency, countryCode, profilePic, upi_id } = req.body;
    try {
        // If profilePic is provided, update it, otherwise keep existing
        const updateQuery = profilePic 
            ? 'UPDATE users SET full_name = $1, preferred_currency = $2, country_code = $3, upi_id = $5, profile_pic = $6 WHERE id = $4 RETURNING *'
            : 'UPDATE users SET full_name = $1, preferred_currency = $2, country_code = $3, upi_id = $5 WHERE id = $4 RETURNING *';
            
        const queryParams = profilePic 
            ? [fullName, currency, countryCode, req.user.id, upi_id, profilePic]
            : [fullName, currency, countryCode, req.user.id, upi_id];

        const updatedUser = await db.query(updateQuery, queryParams);
        res.json(updatedUser.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating profile' });
    }
};

exports.savePushToken = async (req, res) => {
    const { pushToken } = req.body;
    try {
        await db.query('UPDATE users SET push_token = $1 WHERE id = $2', [pushToken, req.user.id]);
        res.json({ message: 'Push token saved successfully' });
    } catch (err) {
        console.error('Error saving push token', err);
        res.status(500).json({ message: 'Error saving push token' });
    }
};
