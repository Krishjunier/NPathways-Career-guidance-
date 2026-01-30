const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// Rate Limiter for OTP Generation
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: { message: "Too many OTP requests from this IP, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate Limiter for OTP Verification
const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 verification attempts per windowMs
    message: { message: "Too many verification attempts, please try again later" },
});

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.status(401).json({ message: "Access Denied: No Token Provided" });

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod', (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid Token" });
        req.user = user;
        next();
    });
};

module.exports = { otpLimiter, verifyLimiter, authenticateToken };
