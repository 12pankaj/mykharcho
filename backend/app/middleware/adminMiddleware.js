module.exports = (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'agent')) {
        return res.status(403).json({ message: 'Access denied. Admin or Agent role required.' });
    }
    next();
};
