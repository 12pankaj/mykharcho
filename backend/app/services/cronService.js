const cron = require('node-cron');
const db = require('../config/db');
const Notification = require('../models/notificationModel');

function initCronJobs() {
    // Run every day at 08:00 AM
    cron.schedule('0 8 * * *', async () => {
        console.log('[CRON] Running daily EMI Due check...');
        try {
            // Find loans where EMI date is tomorrow
            // Since emi_date is just a number (e.g. 5th of every month), we check if tomorrow's date matches.
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowDay = tomorrow.getDate();

            const loansRes = await db.query(
                `SELECT id, user_id, bank_name, emi_amount 
                 FROM loans 
                 WHERE status = 'Active' AND emi_date = $1`,
                [tomorrowDay]
            );

            for (const loan of loansRes.rows) {
                const title = 'EMI Due Tomorrow';
                const message = `Your EMI of ₹${parseFloat(loan.emi_amount).toLocaleString()} for ${loan.bank_name} is due tomorrow.`;
                await Notification.create(loan.user_id, title, message, 'loan');
            }
            console.log(`[CRON] Processed EMI alerts for ${loansRes.rowCount} loans.`);
        } catch (err) {
            console.error('[CRON] Error running EMI check:', err);
        }
    });
}

module.exports = { initCronJobs };
