const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const transactionController = require('../controllers/transactionController');
const userController = require('../controllers/userController');

// Transactions
router.get('/transactions', auth, transactionController.getTransactions);
router.post('/transactions', auth, transactionController.addTransaction);
router.get('/stats', auth, transactionController.getDashboardStats);

// User / Profile
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);

module.exports = router;
