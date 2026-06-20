const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Local Auth
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Google OAuth
router.post('/google', authController.googleAuth);

// Password Reset
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
