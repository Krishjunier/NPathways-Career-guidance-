const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: true },
    class_status: { type: String, required: true },
    role: { type: String, default: 'student' }, // student, professional, admin
    verified: { type: Boolean, default: false },
    profile: { type: Object, default: {} }, // Mixed type for flexible profile data
    purchasedBundles: { type: [String], default: [] }, // Track purchased products
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
