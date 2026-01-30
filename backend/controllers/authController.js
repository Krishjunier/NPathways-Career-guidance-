const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOTPEmail } = require('../services/emailService');
const { generateOTP, hashOTP, verifyOTP: checkOtpHash } = require('../services/otpService');

const mongoose = require('mongoose');

/**
 * Send OTP for Login or Registration
 * @route POST /api/auth/send-otp
 * @body { email, name, phone, class_status } (name/phone/class required for new users)
 */
exports.sendOTP = async (req, res) => {
    try {
        const { email, name, phone, class_status } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check if user exists
        let user = await User.findOne({ email });

        // Self-healing: Detect and remove legacy users with invalid ObjectIds
        if (user && !mongoose.Types.ObjectId.isValid(user._id)) {
            console.log(`[Auth] Removing legacy user with invalid ID: ${user._id} (${email})`);
            await User.deleteOne({ email });
            user = null;
        }

        // If new user (or deleted legacy), require additional fields
        if (!user) {
            if (!name || !phone || !class_status) {
                return res.status(400).json({
                    message: 'User does not exist. Please provide name, phone, and class_status to register.'
                });
            }

            // Create new user (unverified)
            user = new User({
                name,
                email,
                phone,
                class_status,
                verified: false
            });
            await user.save();
        } else if (user && name) {
            // Update existing user details if provided (e.g., correcting name)
            let updated = false;
            if (user.name !== name) { user.name = name; updated = true; }
            if (phone && user.phone !== phone) { user.phone = phone; updated = true; }
            if (class_status && user.class_status !== class_status) { user.class_status = class_status; updated = true; }

            if (updated) {
                console.log(`[Auth] Updating details for ${email} -> Name: ${name}`);
                await user.save();
            }
        }

        // Check for existing OTP to prevent spamming
        const existingOtp = await OTP.findOne({ email });
        if (existingOtp) {
            // Optional: Check if requested too recently (e.g., 1 min cool-down)
            // For now, we just delete or overwrite. Let's overwrite.
            await OTP.deleteOne({ email });
        }

        // Generate and Hash OTP
        const otp = generateOTP();
        const hashedOtp = await hashOTP(otp);

        // Save OTP to DB
        const newOtp = new OTP({
            email,
            otpHash: hashedOtp
        });
        await newOtp.save();

        // Send Email
        const emailSent = await sendOTPEmail(email, otp, user ? user.name : name);

        if (!emailSent) {
            console.error('[Auth] Failed to send OTP email via service');
            return res.status(500).json({ message: 'Failed to send OTP email' });
        }

        // Return OTP in response for testing/demo purposes since email might fail
        res.json({ message: 'OTP sent to your email', email, otp: otp });

    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Verify OTP and Issue JWT
 * @route POST /api/auth/verify-otp
 * @body { email, otp }
 */
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        // Find OTP Record
        const otpRecord = await OTP.findOne({ email });

        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Check attempts
        if (otpRecord.attempts >= 3) {
            await OTP.deleteOne({ email }); // security: clear blocked otp
            return res.status(400).json({ message: 'Too many failed attempts. Request a new OTP.' });
        }

        // Verify Hash
        const isValid = await checkOtpHash(otp, otpRecord.otpHash);

        if (!isValid) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // OTP Valid - Find User
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User record not found' });
        }

        // Mark verified
        user.verified = true;
        await user.save();

        // Delete OTP
        await OTP.deleteOne({ email });

        // Issue JWT
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '30m' } // 30 mins session
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                class_status: user.class_status
            }
        });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
/**
 * Direct Login/Register without OTP (Guest Mode/Quick Start)
 * @route POST /api/auth/guest-login
 * @body { name, email, class_status }
 */
exports.createGuestUser = async (req, res) => {
    try {
        const { name, email, class_status } = req.body;

        // Name is minimal requirement
        if (!name) return res.status(400).json({ message: "Name is required" });

        // Use provided email or generate a placeholder
        // If user provides a real email, we treat it as their ID but skip verification
        let userEmail = email && email.includes('@') ? email : `guest-${Date.now()}-${Math.floor(Math.random() * 1000)}@npathways.local`;

        // Check if user exists (only if real email provided)
        let user;
        if (email && email.includes('@')) {
            user = await User.findOne({ email });
        }

        if (!user) {
            user = new User({
                name,
                email: userEmail,
                phone: req.body.phone || '', // Optional
                class_status: class_status || 'Student',
                verified: true // Auto-verify in this flow
            });
            await user.save();
        } else {
            // Update context if revisiting
            user.name = name;
            if (class_status) user.class_status = class_status;
            await user.save();
        }

        // Issue Long-Lived Token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: 'user'
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '30d' }
        );

        res.json({
            message: 'Session started successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                class_status: user.class_status
            }
        });

    } catch (error) {
        console.error('Guest Login Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
