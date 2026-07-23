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
    const { planId, duration = 'monthly', couponCode } = req.body;
    
    // Fetch plan details from DB
    const planResult = await pool.query('SELECT * FROM plans WHERE id = $1', [planId]);
    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    const plan = planResult.rows[0];
    let basePrice = 0;
    if (duration === 'monthly') basePrice = parseFloat(plan.price_monthly);
    else if (duration === 'yearly') basePrice = parseFloat(plan.price_yearly);
    else if (duration === '3_year') basePrice = parseFloat(plan.price_3_year);
    else basePrice = parseFloat(plan.price_monthly);

    let finalPrice = basePrice;
    let appliedCoupon = null;

    if (couponCode && couponCode.trim() !== '') {
        const couponRes = await pool.query('SELECT * FROM coupons WHERE code = $1', [couponCode.trim()]);
        if (couponRes.rows.length > 0) {
            const coupon = couponRes.rows[0];
            const isValid = (!coupon.valid_until || new Date(coupon.valid_until) > new Date()) && 
                            (coupon.max_uses === 0 || coupon.uses < coupon.max_uses) &&
                            (coupon.applicable_plans === 'all' || coupon.applicable_plans.includes(duration));
            
            if (isValid) {
                if (coupon.discount_percentage > 0) {
                    finalPrice = finalPrice - (finalPrice * (coupon.discount_percentage / 100));
                } else if (coupon.discount_amount > 0) {
                    finalPrice = Math.max(0, finalPrice - parseFloat(coupon.discount_amount));
                }
                appliedCoupon = coupon;
            }
        }
    }
    
    // Convert to INR paise
    // If the DB price is already in INR, no need to multiply by 83. We assume it's INR based on the UI displaying ₹
    // The previous code had * 83 assuming USD, but the UI shows ₹499. Let's fix that too.
    const amountInPaise = Math.round(finalPrice * 100);
    
    console.log(`Creating Razorpay order for Plan: ${plan.name}, Duration: ${duration}, Amount: ${amountInPaise} paise`);
    
    if (amountInPaise === 0 && finalPrice === 0) {
        // Free checkout (e.g. 100% coupon)
        return res.json({
            success: true,
            isFree: true,
            order: { id: `free_${Date.now()}`, amount: 0, currency: 'INR' },
            plan: plan
        });
    }

    const options = {
      amount: amountInPaise, 
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      order: order,
      plan: plan,
      appliedCoupon: appliedCoupon
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Could not create order. Please try again later.' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, duration = 'monthly', couponCode } = req.body;
    const userId = req.user.id;

    // Skip signature check if it's a 100% free checkout
    if (!razorpay_order_id.startsWith('free_')) {
        const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');

        if (generated_signature !== razorpay_signature) {
          return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });
        }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const planRes = await client.query('SELECT * FROM plans WHERE id = $1', [planId]);
      const plan = planRes.rows[0];

      let basePrice = 0;
      if (duration === 'monthly') basePrice = parseFloat(plan.price_monthly);
      else if (duration === 'yearly') basePrice = parseFloat(plan.price_yearly);
      else if (duration === '3_year') basePrice = parseFloat(plan.price_3_year);
      else basePrice = parseFloat(plan.price_monthly);

      let finalPrice = basePrice;
      if (couponCode) {
          const couponRes = await client.query('SELECT * FROM coupons WHERE code = $1', [couponCode]);
          if (couponRes.rows.length > 0) {
              const coupon = couponRes.rows[0];
              if (coupon.discount_percentage > 0) {
                  finalPrice = finalPrice - (finalPrice * (coupon.discount_percentage / 100));
              } else if (coupon.discount_amount > 0) {
                  finalPrice = Math.max(0, finalPrice - parseFloat(coupon.discount_amount));
              }
              // Increment coupon usage
              await client.query('UPDATE coupons SET uses = uses + 1 WHERE id = $1', [coupon.id]);
          }
      }

      // Referral reward logic: check if user has a referrer and this is their first payment
      const userRes = await client.query('SELECT referred_by FROM users WHERE id = $1', [userId]);
      const referredByUserId = userRes.rows[0]?.referred_by;
      
      if (referredByUserId) {
          const prevPaymentsRes = await client.query(
              "SELECT id FROM payments_history WHERE user_id = $1 AND status = 'success' LIMIT 1",
              [userId]
          );
          if (prevPaymentsRes.rows.length === 0) {
              const referrerRes = await client.query('SELECT id FROM users WHERE id = $1', [referredByUserId]);
              if (referrerRes.rows.length > 0) {
                  const proPlanId = '7896e517-555e-433c-b2e3-2068b9a23450';
                  const referrerSubRes = await client.query(
                      "SELECT id, current_period_end FROM user_subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY current_period_end DESC LIMIT 1",
                      [referredByUserId]
                  );
                  
                  if (referrerSubRes.rows.length > 0) {
                      const currentPeriodEnd = new Date(referrerSubRes.rows[0].current_period_end);
                      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
                      await client.query(
                          'UPDATE user_subscriptions SET current_period_end = $1 WHERE id = $2',
                          [currentPeriodEnd, referrerSubRes.rows[0].id]
                      );
                  } else {
                      const newPeriodEnd = new Date();
                      newPeriodEnd.setDate(newPeriodEnd.getDate() + 30);
                      await client.query(
                          'UPDATE users SET is_premium = TRUE, current_plan_id = $1 WHERE id = $2',
                          [proPlanId, referredByUserId]
                      );
                      await client.query(
                          `INSERT INTO user_subscriptions (user_id, plan_id, status, current_period_end, payment_provider, provider_subscription_id)
                           VALUES ($1, $2, $3, $4, $5, $6)`,
                          [referredByUserId, proPlanId, 'active', newPeriodEnd, 'referral_reward', `referred_${userId}`]
                      );
                  }
                  
                  await client.query(
                      `INSERT INTO notifications (user_id, title, message, type)
                       VALUES ($1, $2, $3, $4)`,
                      [
                          referredByUserId,
                          'Referral Reward Unlocked!',
                          'Your friend completed their first payment! You have been rewarded with 30 days of free Premium.',
                          'referral'
                      ]
                  );
              }
          }
      }

      await client.query(
        `INSERT INTO payments_history (user_id, amount, currency, status, provider_payment_id) 
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, finalPrice, 'INR', 'success', razorpay_payment_id || 'free_checkout']
      );

      // Determine expiration date
      const nextDate = new Date();
      if (duration === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (duration === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
      else if (duration === '3_year') nextDate.setFullYear(nextDate.getFullYear() + 3);
      else nextDate.setMonth(nextDate.getMonth() + 1);

      await client.query(
        `INSERT INTO user_subscriptions (user_id, plan_id, status, current_period_end, payment_provider, provider_subscription_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, planId, 'active', nextDate, 'razorpay', razorpay_order_id]
      );

      await client.query(
        `UPDATE users SET is_premium = TRUE, current_plan_id = $1 WHERE id = $2`,
        [planId, userId]
      );

      await client.query('COMMIT');
      res.json({ success: true, message: 'Payment successful! Subscription upgraded.' });
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
