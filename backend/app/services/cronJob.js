const cron = require('node-cron');
const db = require('../config/db');
const { getApps, initializeApp, applicationDefault } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const whatsappService = require('./whatsappService');

// Initialize Firebase Admin (Requires GOOGLE_APPLICATION_CREDENTIALS env var or service account config)
if (!getApps().length) {
    // For now we use applicationDefault, which relies on GOOGLE_APPLICATION_CREDENTIALS environment variable.
    // The user needs to download the Service Account Key from Firebase and point to it.
    try {
        initializeApp({
            credential: applicationDefault()
        });
    } catch (e) {
        console.warn("Firebase Admin init failed. Make sure GOOGLE_APPLICATION_CREDENTIALS is set.");
    }
}

// Run every day at Midnight (00:00)
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily automation job to process recurring expenses/incomes...');
    try {
        // Find rules where next_run_date is today or earlier and status is Active
        const rulesRes = await db.query(
            "SELECT * FROM automation_rules WHERE status = 'Active' AND next_run_date <= CURRENT_DATE"
        );
        
        for (let rule of rulesRes.rows) {
            await db.query('BEGIN');
            
            // 1. Create the Transaction 
            await db.query(
                'INSERT INTO transactions (user_id, wallet_id, amount, type, category, notes, is_automated) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [rule.user_id, rule.wallet_id, rule.amount, rule.type, rule.category, `Automated: ${rule.name}`, true]
            );

            // 2. Update wallet balance
            const multiplier = rule.type === 'Income' ? 1 : -1;
            await db.query(
                'UPDATE wallets SET balance = balance + $1 WHERE id = $2 AND user_id = $3',
                [rule.amount * multiplier, rule.wallet_id, rule.user_id]
            );

            // 3. Update next_run_date based on frequency
            let interval = '1 month';
            if (rule.frequency === 'Daily') interval = '1 day';
            if (rule.frequency === 'Weekly') interval = '1 week';

            await db.query(
                `UPDATE automation_rules SET next_run_date = CURRENT_DATE + INTERVAL '${interval}' WHERE id = $1`,
                [rule.id]
            );

            await db.query('COMMIT');
            console.log(`Processed automation rule: ${rule.name}`);

            // 4. Send Funny Push Notification via FCM
            const userRes = await db.query('SELECT push_token FROM users WHERE id = $1', [rule.user_id]);
            const pushToken = userRes.rows[0]?.push_token;

            if (pushToken && pushToken.length > 20) {
                const message = {
                    token: pushToken,
                    notification: {
                        title: 'Auto Record Added! 🤖',
                        body: `Tum tho busy ho, mene kr diya aaj ka add krne ka kam! 😎 (${rule.name}: ${rule.amount})`
                    },
                    data: { ruleId: rule.id.toString() }
                };
                try {
                    await getMessaging().send(message);
                } catch (error) {
                    console.error('Error sending push notification via FCM:', error);
                }
            }
        }

        // --- LOAN REMINDERS ---
        console.log('Checking for due loan installments...');
        
        // Find installments due today or overdue, with status 'Pending', where user has a premium plan
        // and we haven't sent a reminder today (for simplicity we will just send it once a day if overdue)
        const dueInstallmentsRes = await db.query(`
            SELECT li.*, lc.party_name, lc.party_phone, lc.role 
            FROM loan_installments li
            JOIN loan_contracts lc ON li.contract_id = lc.id
            WHERE li.status = 'Pending' AND li.due_date <= CURRENT_DATE
        `);

        for (let emi of dueInstallmentsRes.rows) {
            // Check if user is premium to allow Auto-Reminder (Elite Plan)
            const userRes = await db.query('SELECT p.id as plan_id FROM users u JOIN plans p ON u.current_plan_id = p.id WHERE u.id = $1', [emi.user_id]);
            const planId = userRes.rows[0]?.plan_id;
            
            // Assuming plan_id 3 is Elite. Let's say we only send for plan_id = 3
            if (planId === 3 && emi.role === 'Lender' && emi.party_phone) {
                // If the user lent money, they want to remind the borrower
                const variables = [
                    { type: 'text', text: emi.party_name },
                    { type: 'text', text: emi.emi_amount.toString() }
                ];
                
                // Send WhatsApp Reminder
                await whatsappService.sendReminder(emi.party_phone, variables);
            }
        }
        // --- SUBSCRIPTION REMINDERS & EXPIRY ---
        console.log('Checking for expiring and expired subscriptions...');

        // 1. Reminders (7 Days Before)
        const rem7Res = await db.query(`
            SELECT u.id, u.push_token, u.email, p.name as plan_name 
            FROM user_subscriptions s 
            JOIN users u ON s.user_id = u.id 
            JOIN plans p ON s.plan_id = p.id
            WHERE s.status = 'active' AND DATE(s.current_period_end) = CURRENT_DATE + INTERVAL '7 days'
        `);
        for (let row of rem7Res.rows) {
            if (row.push_token) {
                try {
                    await getMessaging().send({
                        token: row.push_token,
                        notification: { title: 'Subscription Expiring Soon!', body: `Your ${row.plan_name} plan expires in 7 days. Renew now to avoid losing access.` }
                    });
                } catch(e) {}
            }
        }

        // 2. Reminders (3 Days Before)
        const rem3Res = await db.query(`
            SELECT u.id, u.push_token, u.email, p.name as plan_name 
            FROM user_subscriptions s 
            JOIN users u ON s.user_id = u.id 
            JOIN plans p ON s.plan_id = p.id
            WHERE s.status = 'active' AND DATE(s.current_period_end) = CURRENT_DATE + INTERVAL '3 days'
        `);
        for (let row of rem3Res.rows) {
            if (row.push_token) {
                try {
                    await getMessaging().send({
                        token: row.push_token,
                        notification: { title: 'Action Required!', body: `Your ${row.plan_name} plan expires in 3 days. Please renew.` }
                    });
                } catch(e) {}
            }
        }

        // 3. Expiry Day (0 Days) - Start Grace Period
        const rem0Res = await db.query(`
            SELECT u.id, u.push_token, u.email, p.name as plan_name 
            FROM user_subscriptions s 
            JOIN users u ON s.user_id = u.id 
            JOIN plans p ON s.plan_id = p.id
            WHERE s.status = 'active' AND DATE(s.current_period_end) = CURRENT_DATE
        `);
        for (let row of rem0Res.rows) {
            if (row.push_token) {
                try {
                    await getMessaging().send({
                        token: row.push_token,
                        notification: { title: 'Subscription Expired', body: `Your ${row.plan_name} plan has expired. You have a 3-day grace period to renew before features lock.` }
                    });
                } catch(e) {}
            }
        }

        // 4. Auto-Downgrade (3 Days After Expiry)
        const expiredRes = await db.query(`
            SELECT s.id, s.user_id 
            FROM user_subscriptions s 
            WHERE s.status = 'active' AND DATE(s.current_period_end) <= CURRENT_DATE - INTERVAL '3 days'
        `);
        
        for (let row of expiredRes.rows) {
            await db.query('BEGIN');
            // Update subscription status
            await db.query(`UPDATE user_subscriptions SET status = 'expired' WHERE id = $1`, [row.id]);
            // Fallback to free plan (id = 1)
            await db.query(`UPDATE users SET current_plan_id = 1, is_premium = FALSE WHERE id = $1`, [row.user_id]);
            await db.query('COMMIT');
            console.log(`Auto-downgraded user ${row.user_id} due to expired subscription.`);
        }
        
    } catch (err) {
        console.error('Error in automation cron job:', err);
    }
});
