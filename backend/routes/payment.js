const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/payment/success
router.post('/success', async (req, res) => {
    try {
        const { userId, item, amount, transactionId } = req.body;

        if (!userId || !item) {
            return res.status(400).json({ message: 'Missing userId or item' });
        }

        // Find user by ID or _id (depending on how frontend sends it)
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Add to purchasedBundles if not already present
        // Initialize if undefined (though schema default should handle this)
        if (!user.purchasedBundles) user.purchasedBundles = [];

        if (!user.purchasedBundles.includes(item)) {
            user.purchasedBundles.push(item);
            await user.save();
        }

        console.log(`[Payment] Recorded purchase for user ${userId}: ${item}`);

        res.json({
            success: true,
            message: 'Payment recorded successfully',
            purchasedBundles: user.purchasedBundles
        });
    } catch (error) {
        console.error('Payment Error:', error);
        res.status(500).json({ message: 'Failed to record payment', error: error.message });
    }
});

module.exports = router;
