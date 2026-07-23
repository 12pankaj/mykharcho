const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const emailService = require('../services/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.signup = async (req, res) => {
    const { fullName, email, password, currency, countryCode, referredByCode } = req.body;

    try {
        // Check if user exists
        const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate unique referral code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let referralCode = '';
        let isUnique = false;
        while (!isUnique) {
            referralCode = '';
            for (let i = 0; i < 6; i++) {
                referralCode += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            const checkRes = await db.query('SELECT id FROM users WHERE referral_code = $1', [referralCode]);
            if (checkRes.rows.length === 0) {
                isUnique = true;
            }
        }

        // Look up referred_by user
        let referredByUserId = null;
        if (referredByCode) {
            const referrerRes = await db.query('SELECT id FROM users WHERE referral_code = $1', [referredByCode.trim().toUpperCase()]);
            if (referrerRes.rows.length > 0) {
                referredByUserId = referrerRes.rows[0].id;
            }
        }

        // Create user
        const newUserResult = await db.query(
            'INSERT INTO users (full_name, email, password_hash, preferred_currency, country_code, referral_code, referred_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, full_name, email, preferred_currency, country_code, referral_code, referred_by',
            [fullName, email, hashedPassword, currency || 'INR', countryCode || 'IN', referralCode, referredByUserId]
        );
        const newUser = newUserResult.rows[0];

        // Create default wallet for the user
        await db.query(
            'INSERT INTO wallets (user_id, name, type, balance) VALUES ($1, $2, $3, $4)',
            [newUser.id, 'Main Wallet', 'Cash', 0]
        );

        const token = generateToken(newUser.id, 'user');

        res.status(201).json({
            user: {
                id: newUser.id,
                fullName: newUser.full_name,
                email: newUser.email,
                currency: newUser.preferred_currency,
                countryCode: newUser.country_code,
                referralCode: newUser.referral_code,
                referredBy: newUser.referred_by,
                hasReferralDiscount: !!newUser.referred_by
            },
            token,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during signup' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    console.log("email password", email, "  ", password);

    try {
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user.id, user.role);

        res.json({
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                currency: user.preferred_currency,
                countryCode: user.country_code,
                referralCode: user.referral_code,
                referredBy: user.referred_by,
                currentStreak: user.current_streak || 0,
                lastTransactionDate: user.last_transaction_date || null,
                hasClaimedTrial: user.has_claimed_trial || false
            },
            token,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during login' });
    }
};

exports.googleAuth = async (req, res) => {
    const { token, referredByCode } = req.body;
    try {
        let google_id, email, name, picture;

        if (token.split('.').length === 3) {
            // JWT ID Token handling
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            google_id = payload.sub;
            email = payload.email;
            name = payload.name;
            picture = payload.picture;
        } else {
            // Opaque Access Token handling (ya29...)
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error('Invalid access token');
            }
            const payload = await response.json();
            google_id = payload.sub;
            email = payload.email;
            name = payload.name;
            picture = payload.picture;
        }

        let userResult = await db.query('SELECT * FROM users WHERE email = $1 OR google_id = $2', [email, google_id]);

        let user;
        if (userResult.rows.length === 0) {
            // Generate unique referral code
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let referralCode = '';
            let isUnique = false;
            while (!isUnique) {
                referralCode = '';
                for (let i = 0; i < 6; i++) {
                    referralCode += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                const checkRes = await db.query('SELECT id FROM users WHERE referral_code = $1', [referralCode]);
                if (checkRes.rows.length === 0) {
                    isUnique = true;
                }
            }

            // Look up referred_by user
            let referredByUserId = null;
            if (referredByCode) {
                const referrerRes = await db.query('SELECT id FROM users WHERE referral_code = $1', [referredByCode.trim().toUpperCase()]);
                if (referrerRes.rows.length > 0) {
                    referredByUserId = referrerRes.rows[0].id;
                }
            }

            // Register new user via Google
            const newUserResult = await db.query(
                'INSERT INTO users (full_name, email, google_id, preferred_currency, country_code, referral_code, referred_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [name, email, google_id, 'INR', 'IN', referralCode, referredByUserId]
            );
            user = newUserResult.rows[0];

            // Create default wallet
            await db.query(
                'INSERT INTO wallets (user_id, name, type, balance) VALUES ($1, $2, $3, $4)',
                [user.id, 'Main Wallet', 'Cash', 0]
            );
        } else {
            user = userResult.rows[0];
            if (!user.google_id) {
                // Link Google ID if email matches but Google ID wasn't set
                await db.query('UPDATE users SET google_id = $1 WHERE id = $2', [google_id, user.id]);
            }
        }

        const jwtToken = generateToken(user.id, user.role || 'user');
        res.json({
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                currency: user.preferred_currency,
                countryCode: user.country_code,
                referralCode: user.referral_code,
                referredBy: user.referred_by,
                currentStreak: user.current_streak || 0,
                lastTransactionDate: user.last_transaction_date || null,
                hasClaimedTrial: user.has_claimed_trial || false
            },
            token: jwtToken,
        });
    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(500).json({ message: 'Google Authentication failed' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User with that email does not exist.' });
        }

        const user = userResult.rows[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Token expires in 1 hour
        const expires = new Date(Date.now() + 3600000);

        await db.query(
            'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
            [tokenHash, expires, user.id]
        );

        // Send actual email using Nodemailer
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const subject = 'Password Reset Request - MyKharcho';
        const text = `You requested a password reset. Please click the following link to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`;
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #c1522d; text-align: center;">MyKharcho</h2>
                <h3>Password Reset Request</h3>
                <p>Hello,</p>
                <p>We received a request to reset your password. Click the button below to choose a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #c1522d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #555;">${resetLink}</p>
                <p>If you did not request a password reset, please ignore this email. This link will expire in 1 hour.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #888; text-align: center;">&copy; ${new Date().getFullYear()} MyKharcho. All rights reserved.</p>
            </div>
        `;

        await emailService.sendEmail(email, subject, text, html);

        res.json({ message: 'Password reset link sent to email' });
    } catch (err) {
        console.error('Forgot Password Error:', err);
        res.status(500).json({ message: 'Error processing forgot password' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const userResult = await db.query(
            'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
            [tokenHash]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Token is invalid or has expired.' });
        }

        const user = userResult.rows[0];
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query(
            'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
            [hashedPassword, user.id]
        );

        res.json({ message: 'Password has been successfully reset.' });
    } catch (err) {
        console.error('Reset Password Error:', err);
        res.status(500).json({ message: 'Error processing password reset' });
    }
};
