const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const transactionController = require('../controllers/transactionController');
const userController = require('../controllers/userController');
const notificationController = require('../controllers/notificationController');
const adminMiddleware = require('../middleware/adminMiddleware');

// Transactions
router.get('/transactions', auth, transactionController.getTransactions);
router.post('/transactions', auth, transactionController.addTransaction);
router.get('/stats', auth, transactionController.getDashboardStats);

// User / Profile
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.post('/user/claim-trial', auth, userController.claimTrial);

// Notifications
router.get('/notifications', auth, notificationController.getNotifications);
router.put('/notifications/:id/read', auth, notificationController.markAsRead);
router.post('/admin/notifications/broadcast', auth, adminMiddleware, notificationController.broadcastNotification);

module.exports = router;
