const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../config/db');

// Initialize Razorpay
// IMPORTANT: Add these to your .env file!
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.createOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    
    // Fetch plan details from DB
    const planResult = await pool.query('SELECT * FROM plans WHERE id = $1', [planId]);
    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    const plan = planResult.rows[0];
    
    // Calculate amount in paise (1 INR = 100 paise)
    // If pricing in DB is in USD (e.g. 9.99), we convert to INR (approx * 83)
    const amountInPaise = Math.round(parseFloat(plan.price_monthly) * 100 * 83);
    
    console.log(`Creating Razorpay order for Plan: ${plan.name}, Amount: ${amountInPaise} paise`);
    
    const options = {
      amount: amountInPaise, 
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    console.log('Razorpay Order Created:', order.id);
    
    res.json({
      success: true,
      order: order,
      plan: plan
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Could not create order. Please try again later.' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
    const userId = req.user.id;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';

    // Verify signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });
    }

    // Payment is successful! Update database in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch Plan details
      const planRes = await client.query('SELECT * FROM plans WHERE id = $1', [planId]);
      const plan = planRes.rows[0];

      // 2. Insert into payments_history
      await client.query(
        `INSERT INTO payments_history (user_id, amount, currency, status, provider_payment_id) 
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, plan.price_monthly, 'INR', 'success', razorpay_payment_id]
      );

      // 3. Update or Insert user_subscriptions
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      await client.query(
        `INSERT INTO user_subscriptions (user_id, plan_id, status, current_period_end, payment_provider, provider_subscription_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, planId, 'active', nextMonth, 'razorpay', razorpay_order_id]
      );

      // 4. Update Users table (is_premium = true, current_plan_id = planId)
      await client.query(
        `UPDATE users SET is_premium = TRUE, current_plan_id = $1 WHERE id = $2`,
        [planId, userId]
      );

      await client.query('COMMIT');
      res.json({ success: true, message: 'Payment successful! You are now Elite.' });
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Payment verification error. Our team has been notified.' });
  }
};
