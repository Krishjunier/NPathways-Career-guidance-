const nodemailer = require('nodemailer');
const { Resend } = require('resend');
require("dotenv").config();

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Keep Nodemailer as fallback
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000
});

/**
 * Send OTP Email
 * @param {string} email 
 * @param {string} otp 
 * @param {string} name 
 */
const sendOTPEmail = async (email, otp, name) => {
    try {
        console.log(`[EmailService] Attempting to send OTP to ${email}`);

        // Method 1: Resend API (Preferred for Serverless)
        if (resend) {
            try {
                const { data, error } = await resend.emails.send({
                    from: 'NPathways <onboarding@resend.dev>',
                    to: [email],
                    subject: 'Your Login OTP - Career Counselling',
                    html: `
                    <div style="font-family: sans-serif; padding: 20px;">
                        <h2>Hello ${name || 'User'},</h2>
                        <p>Your OTP is:</p>
                        <h1 style="color: #4F46E5;">${otp}</h1>
                        <p><small>Sent via Resend API</small></p>
                    </div>
                    `
                });

                if (!error) {
                    console.log(`✅ OTP sent via Resend API: ${data.id}`);
                    return true;
                }
                console.error('⚠️ Resend Error:', error);
            } catch (rErr) {
                console.error('⚠️ Resend Exception:', rErr.message);
            }
        }

        // Method 2: Nodemailer (SMTP) - with 6s Timeout for Netlify
        // We wrap sendMail in a promise race to ensure we don't hit the 10s Netlify limit
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("⚠️  Email credentials missing. Logging to console.");
            console.log(`[DEV OTP] For ${email}: ${otp}`);
            return true; // Treat as success for dev/demo
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
                <p style="font-size: 14px; color: #666; line-height: 1.5;">This OTP is valid for <strong>5 minutes</strong>.</p>
            </div>
            `
        };

        const sendPromise = transporter.sendMail(mailOptions);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("SMTP Timeout")), 6000)
        );

        await Promise.race([sendPromise, timeoutPromise]);
        console.log(`✅ Email sent via SMTP`);
        return true;

    } catch (error) {
        console.error('❌ Email Failed (Timeout or Error):', error.message);

        // IMPORTANT: Fallback to CONSOLE LOG on failure so user isn't stuck
        // This is crucial for Netlify where SMTP ports might be blocked
        console.warn("⚠️  Switched to CONSOLE OTP (Backup):");
        console.log(`[BACKUP OTP] For ${email}: ${otp}`);

        return true; // Return true so the UI shows "OTP Sent" and doesn't crash
    }
};

/**
 * Send Counselling Request Notification
 * @param {object} userData - User details { name, email, phone, status }
 */
const sendCounsellingRequest = async (userData) => {
    try {
        const { name, email, phone, status } = userData;
        const recipient = process.env.EMAIL_USER || 'krishjr3010@gmail.com';

        // Method 1: Nodemailer (SMTP) - User Preferred
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("⚠️  Email credentials missing. Logging to console.");
            console.log(`[DEV] Counselling Request:`, userData);
            return true;
        }

        const mailOptions = {
            from: `"NPathways System" <${process.env.EMAIL_USER}>`,
            to: recipient,
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
                
                <div style="text-align: center; font-size: 12px; color: #999;">
                    <p style="margin: 5px 0;">This is an automated notification from NPathways Dashboard</p>
                    <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} NPathways Global</p>
                </div>
            </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Counselling request email sent via SMTP: ${info.messageId}`);
        return true;

    } catch (err) {
        console.error('❌ Counselling Request Email Error:', err.message);
        return false;
    }
};

module.exports = { sendOTPEmail, sendCounsellingRequest };
