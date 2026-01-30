const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const generateOTP = () => {
    // Generate a 6-digit number
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOTP = async (otp) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(otp, salt);
};

const verifyOTP = async (inputOtp, hashedOtp) => {
    return await bcrypt.compare(inputOtp, hashedOtp);
};

module.exports = { generateOTP, hashOTP, verifyOTP };
