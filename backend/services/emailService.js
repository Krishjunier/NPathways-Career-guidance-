const nodemailer = require('nodemailer');
require("dotenv").config();

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // e.g., krishjr3010@gmail.com
        pass: process.env.EMAIL_PASS  // App Password e.g., ccpn pvgl njbt egpr
    }
});

/**
 * Send OTP Email
 * @param {string} email 
 * @param {string} otp 
 * @param {string} name 
 */
const sendOTPEmail = async (email, otp, name) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("⚠️  Email credentials missing in .env. Printing OTP to console.");
            console.log(`[DEV] OTP for ${email}: ${otp}`);
            return true; // Simulate success
        }

        const mailOptions = {
            from: `"Career Counselling Team" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Login OTP - Career Counselling',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
                <h2 style="color: #333; margin-top: 0;">Hello ${name || 'User'},</h2>
                <p style="font-size: 16px; color: #555;">Use the following One-Time Password (OTP) to log in to your account:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; background: #f0f0ff; padding: 15px 30px; border-radius: 12px; border: 1px solid #e0e7ff;">${otp}</span>
                </div>
                
                <p style="font-size: 14px; color: #666; line-height: 1.5;">This OTP is valid for <strong>5 minutes</strong>.<br>For security reasons, please do not share this code with anyone.</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
                
                <div style="text-align: center; font-size: 12px; color: #999;">
                    <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} NPathways Global. All rights reserved.</p>
                    <p style="margin: 5px 0;">Sent by Career Counselling Team <br> <a href="mailto:krishjr3010@gmail.com" style="color: #4F46E5; text-decoration: none;">krishjr3010@gmail.com</a></p>
                </div>
            </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error('❌ Email Service Error:', error.message);
        if (error.response) {
            console.error('SMTP Response:', error.response);
        }

        // Fallback: Use console log for OTP if email fails (Development/Rescue Mode)
        console.warn("⚠️  Email failed. USING CONSOLE OTP TO BYPASS:");
        console.log(`[DEV OTP] For ${email}: ${otp}`);
        return true;
    }
};

/**
 * Send Counselling Request Notification
 * @param {object} userData - User details { name, email, phone, status }
 */
const sendCounsellingRequest = async (userData) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("⚠️  Email credentials missing in .env. Logging counselling request to console.");
            console.log(`[DEV] Counselling Request from:`, userData);
            return true;
        }

        const { name, email, phone, status } = userData;

        const mailOptions = {
            from: `"NPathways System" <${process.env.EMAIL_USER}>`,
            to: 'krishjr3010@gmail.com',
            subject: '🎯 New Free Counselling Request',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
                <h2 style="color: #333; margin-top: 0; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">📋 New Counselling Request</h2>
                
                <p style="font-size: 16px; color: #555;">A user has requested free counselling after completing their assessment:</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #666; font-weight: bold; width: 120px;">Name:</td>
                            <td style="padding: 8px 0; color: #333;">${name || 'Not provided'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
                            <td style="padding: 8px 0; color: #333;"><a href="mailto:${email}" style="color: #4F46E5; text-decoration: none;">${email}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666; font-weight: bold;">Phone:</td>
                            <td style="padding: 8px 0; color: #333;">${phone || 'Not provided'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666; font-weight: bold;">Status:</td>
                            <td style="padding: 8px 0; color: #333;">${status || 'Student'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666; font-weight: bold;">Time:</td>
                            <td style="padding: 8px 0; color: #333;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #856404;"><strong>⏰ Action Required:</strong> Please reach out to this user within 24 hours for their free counselling session.</p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
                
                <div style="text-align: center; font-size: 12px; color: #999;">
                    <p style="margin: 5px 0;">This is an automated notification from NPathways Dashboard</p>
                    <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} NPathways Global</p>
                </div>
            </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Counselling request email sent: ${info.messageId}`);
        return true;

    } catch (err) {
        console.error('❌ Counselling Request Email Error:', err);
        return false;
    }
};

module.exports = { sendOTPEmail, sendCounsellingRequest };
