const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { otpLimiter, verifyLimiter } = require('../middleware/authMiddleware');

// Send OTP (Register/Login)
router.post('/send-otp', otpLimiter, authController.sendOTP);

// Verify OTP
router.post('/verify-otp', verifyLimiter, authController.verifyOTP);

// Guest Login (No OTP)
router.post('/guest-login', authController.createGuestUser);

// Legacy routes handling for backward compatibility or profile updates
// We'll keep update-profile here or move it to a userController
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/update-profile', authenticateToken, async (req, res) => {
  try {
    const { userId, profile } = req.body;
    // In new system, we expect req.user.userId from token, but we might allow body param for now if frontend sends it
    // Better to use req.user.userId if available
    const targetId = req.user ? req.user.userId : userId;

    if (!targetId) return res.status(400).json({ message: "User ID required" });

    const user = await User.findById(targetId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.profile = { ...user.profile, ...profile };
    await user.save();

    res.json({ message: "Profile updated", user });
  } catch (e) {
    res.status(500).json({ message: "Error updating profile", error: e.message });
  }
});

router.get('/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-otp -__v');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ message: "Error fetching profile", error: e.message });
  }
});

// Request Free Counselling (Optional Authentication)
router.post('/request-counselling', async (req, res) => {
  try {
    const { sendCounsellingRequest } = require('../services/emailService');

    // Try to get userId from token first, then fall back to request body
    let userId = req.body.userId;

    // Check if token is present and valid
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        userId = decoded.userId;
      } catch (err) {
        // Token invalid or expired - ignore and use body userId
        console.log('[Counselling] Token invalid/expired, using body userId');
      }
    }

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Send email notification to admin
    const emailSent = await sendCounsellingRequest({
      name: user.name,
      email: user.email,
      phone: user.phone || user.profile?.phone,
      status: user.class_status || 'Student'
    });

    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send counselling request" });
    }

    res.json({
      success: true,
      message: "Counselling request submitted successfully. We'll contact you within 24 hours!"
    });
  } catch (e) {
    console.error('Counselling request error:', e);
    res.status(500).json({ message: "Error submitting counselling request", error: e.message });
  }
});

module.exports = router;
