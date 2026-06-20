const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const passport = require('passport');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false })); // SECURITY: Add security headers, allow cross origin resources for images

// SECURITY: Restrict CORS
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'https://app.mykharcho.in', 'http://127.0.0.1:5173', 'http://localhost:8081', 'exp://localhost:8081', 'https://d7nql637-5010.inc1.devtunnels.ms/'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(passport.initialize());
app.use('/uploads', express.static('uploads'));

// Routes
const authController = require('./app/controllers/authController');
const transactionController = require('./app/controllers/transactionController');
const userController = require('./app/controllers/userController');
const authMiddleware = require('./app/middleware/authMiddleware');
const adminMiddleware = require('./app/middleware/adminMiddleware');
const uploadController = require('./app/controllers/uploadController');
const cronService = require('./app/services/cronService');
const multer = require('multer');
const path = require('path');

// Initialize background jobs
cronService.initCronJobs();

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// SECURITY: Restrict file uploads to images only
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG and WEBP are allowed!'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

// SECURITY: Rate Limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    message: 'Too many auth requests from this IP, please try again later.'
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many API requests from this IP, please try again later.'
});

// Auth Routes
const authRoutes = require('./app/routes/authRoutes');
app.use('/api/auth', authLimiter, authRoutes);

// Protected API Routes
app.get('/api/stats', authMiddleware, transactionController.getDashboardStats);
app.get('/api/transactions', authMiddleware, transactionController.getTransactions);
app.post('/api/transactions', authMiddleware, transactionController.addTransaction);
app.put('/api/transactions/:id', authMiddleware, transactionController.updateTransaction);
app.delete('/api/transactions/:id', authMiddleware, transactionController.deleteTransaction);
app.get('/api/profile', authMiddleware, userController.getProfile);
app.put('/api/profile', authMiddleware, userController.updateProfile);
app.post('/api/profile/upload', authMiddleware, upload.single('image'), uploadController.uploadProfilePic);
app.post('/api/profile/push-token', authMiddleware, userController.savePushToken);

// Wallet Routes
const walletController = require('./app/controllers/walletController');
app.get('/api/wallets', authMiddleware, walletController.getWallets);
app.post('/api/wallets', authMiddleware, walletController.createWallet);
app.put('/api/wallets/:id', authMiddleware, walletController.updateWallet);
app.delete('/api/wallets/:id', authMiddleware, walletController.deleteWallet);

// Loan Routes
const loanController = require('./app/controllers/loanController');
app.get('/api/loans', authMiddleware, loanController.getContracts);
app.post('/api/loans', authMiddleware, loanController.createContract);
app.delete('/api/loans/:id', authMiddleware, loanController.deleteContract);
app.put('/api/loans/:id', authMiddleware, loanController.updateContract);
app.get('/api/loans/:contractId/installments', authMiddleware, loanController.getInstallments);
app.post('/api/loans/:contractId/installments', authMiddleware, loanController.addInstallment);
app.put('/api/loans/installments/:id', authMiddleware, loanController.updateInstallment);
app.delete('/api/loans/installments/:id', authMiddleware, loanController.deleteInstallment);
app.post('/api/loans/installments/:id/pay', authMiddleware, loanController.payInstallment);
app.post('/api/loans/installments/:id/remind', authMiddleware, loanController.sendReminder);

// Group Expenses Routes
const groupController = require('./app/controllers/groupController');
app.get('/api/groups', authMiddleware, groupController.getGroups);
app.post('/api/groups', authMiddleware, groupController.createGroup);
app.get('/api/groups/:id', authMiddleware, groupController.getGroupDetails);
app.post('/api/groups/:id/members', authMiddleware, groupController.addMember);
app.post('/api/groups/:id/expenses', authMiddleware, groupController.addExpense);
app.get('/api/groups/:id/settlements', authMiddleware, groupController.getOptimizedSettlements);
app.post('/api/groups/:id/settle', authMiddleware, groupController.settleDebt);

// AI Scanner Route
const aiController = require('./app/controllers/aiController');
// Limit payload size because base64 images can be large
app.post('/api/ai/parse', apiLimiter, express.json({ limit: '10mb' }), authMiddleware, aiController.parseTransaction);

// Automation Routes
const automationController = require('./app/controllers/automationController');
app.get('/api/automation', authMiddleware, automationController.getRules);
app.post('/api/automation', authMiddleware, automationController.createRule);
app.delete('/api/automation/:id', authMiddleware, automationController.deleteRule);
app.put('/api/automation/:id', authMiddleware, automationController.updateRule);

// Payment & Subscription Routes
const paymentController = require('./app/controllers/paymentController');
app.post('/api/payments/create-order', authMiddleware, paymentController.createOrder);
app.post('/api/payments/verify', authMiddleware, paymentController.verifyPayment);

// Support Routes
const supportController = require('./app/controllers/supportController');
app.get('/api/support/tickets', authMiddleware, supportController.getTickets);
app.post('/api/support/tickets', authMiddleware, supportController.createTicket);
app.get('/api/support/tickets/:ticketId/messages', authMiddleware, supportController.getMessages);
app.post('/api/support/tickets/:ticketId/messages', authMiddleware, supportController.addMessage);

// Admin Routes
const adminController = require('./app/controllers/adminController');
app.get('/api/admin/payments', authMiddleware, adminMiddleware, adminController.getAllPayments);
app.get('/api/admin/tickets', authMiddleware, adminMiddleware, adminController.getAllTickets);
app.get('/api/admin/stats', authMiddleware, adminMiddleware, adminController.getAdminStats);
app.post('/api/admin/tickets/assign', authMiddleware, adminMiddleware, adminController.assignTicket);
app.post('/api/admin/tickets/resolve', authMiddleware, adminMiddleware, adminController.resolveTicket);
app.get('/api/admin/agents', authMiddleware, adminMiddleware, adminController.getAgents);
app.get('/api/admin/users', authMiddleware, adminMiddleware, adminController.getUsers);
app.get('/api/admin/plans', authMiddleware, adminMiddleware, adminController.getPlans);
app.get('/api/public/plans', adminController.getPlans); // Public route for marketing site
app.post('/api/admin/plans', authMiddleware, adminMiddleware, adminController.createPlan);
app.put('/api/admin/plans', authMiddleware, adminMiddleware, adminController.updatePlan);

// Notifications Routes
const notificationController = require('./app/controllers/notificationController');
app.get('/api/notifications', authMiddleware, notificationController.getNotifications);
app.put('/api/notifications/:id/read', authMiddleware, notificationController.markAsRead);
app.post('/api/admin/notifications/broadcast', authMiddleware, adminMiddleware, notificationController.broadcastNotification);

// Initialize Cron Jobs
require('./app/services/cronJob');

// Catch-all for 404s
app.use((req, res) => {
    console.error(`[404 Error] Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ message: 'The requested resource could not be found. Please check your app version or contact support.' });
});

// Global Error Handler (500)
app.use((err, req, res, next) => {
    console.error(`[500 Error] Internal Server Error: ${err.message}`, err.stack);
    res.status(500).json({ message: 'An internal server error occurred. Our team has been notified. Please try again later.' });
});

const http = require('http');
const socketService = require('./app/services/socketService');

// Port configuration
const PORT = process.env.PORT || 5010;

const server = http.createServer(app);

// Initialize Socket.io
socketService.initSocket(server);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Routes registered: /api/stats, /api/transactions, /api/profile');
});
