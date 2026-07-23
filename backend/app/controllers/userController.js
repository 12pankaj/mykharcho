const db = require('../config/db');

exports.getProfile = async (req, res) => {
    try {
        const user = await db.query(
            `SELECT u.id, u.full_name, u.email, u.preferred_currency, u.country_code, u.profile_pic, u.is_premium, u.current_plan_id, u.role, u.upi_id, u.monthly_budget,
                    u.current_streak, u.last_transaction_date, u.has_claimed_trial, u.referral_code, u.referred_by,
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
    const { fullName, currency, countryCode, profilePic, upi_id, monthly_budget } = req.body;
    try {
        // If profilePic is provided, update it, otherwise keep existing
        const updateQuery = profilePic 
            ? 'UPDATE users SET full_name = $1, preferred_currency = $2, country_code = $3, upi_id = $5, monthly_budget = $6, profile_pic = $7 WHERE id = $4 RETURNING *'
            : 'UPDATE users SET full_name = $1, preferred_currency = $2, country_code = $3, upi_id = $5, monthly_budget = $6 WHERE id = $4 RETURNING *';
            
        const queryParams = profilePic 
            ? [fullName, currency, countryCode, req.user.id, upi_id, monthly_budget || null, profilePic]
            : [fullName, currency, countryCode, req.user.id, upi_id, monthly_budget || null];

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

exports.claimTrial = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Get user status
        const userRes = await db.query(
            'SELECT current_streak, has_claimed_trial, current_plan_id FROM users WHERE id = $1',
            [userId]
        );
        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const { current_streak, has_claimed_trial, current_plan_id } = userRes.rows[0];
        
        // 2. Validate streak, has_claimed_trial, and plan
        if (current_streak < 7) {
            return res.status(400).json({ error: 'Streak is less than 7 days. Keep logging expenses!' });
        }
        if (has_claimed_trial) {
            return res.status(400).json({ error: 'Streak trial reward has already been claimed.' });
        }
        const freePlanId = '197f1815-141b-492f-bd2a-398ba6dc53d9';
        if (current_plan_id !== freePlanId) {
            return res.status(400).json({ error: 'Only users on the Free plan can claim this trial.' });
        }
        
        // 3. Find the Elite plan
        const elitePlanId = 'c83f759c-03c6-4bbd-b015-1ec0dce6b514';
        
        // 4. Update database inside transaction
        await db.query('BEGIN');
        
        // Set subscription period for 3 days
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 3);
        
        // Update user
        await db.query(
            'UPDATE users SET is_premium = TRUE, current_plan_id = $1, has_claimed_trial = TRUE WHERE id = $2',
            [elitePlanId, userId]
        );
        
        // Insert active subscription
        await db.query(
            `INSERT INTO user_subscriptions (user_id, plan_id, status, current_period_end, payment_provider, provider_subscription_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, elitePlanId, 'active', trialEndDate, 'trial', 'streak_trial_elite']
        );
        
        await db.query('COMMIT');
        
        res.json({ success: true, message: 'Congratulations! Elite trial activated for 3 days.' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error claiming streak trial:', err);
        res.status(500).json({ error: 'Server error while claiming trial.' });
    }
};
