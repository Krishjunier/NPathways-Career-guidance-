const nodemailer = require('nodemailer');
require("dotenv").config();

// Create reusable transporter object using the default SMTP transport
const { Resend } = require('resend');

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Keep Nodemailer as fallback (or for when Resend key is missing)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // SSL
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // Fast fail on connection issues
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000
});

/**
 * Send OTP Email
 * @param {string} email 
 * @param {string} otp 
 * @param {string} name 
 */
const sendOTPEmail = async (email, otp, name) => {
    try {
        // Method 1: Try Resend API (HTTP - works on Render)
        if (resend) {
            try {
                const { data, error } = await resend.emails.send({
                    from: 'NPathways <onboarding@resend.dev>', // Default testing domain
                    to: [email],
                    subject: 'Your Login OTP - Career Counselling',
                    html: `
                    <div style="font-family: sans-serif; padding: 20px;">
                        <h2>Hello ${name || 'User'},</h2>
                        <p>Your OTP is:</p>
                        <h1 style="color: #4F46E5; letter-spacing: 5px;">${otp}</h1>
                        <p><small>Sent via Resend API</small></p>
                    </div>
                    `
                });

                if (error) {
                    console.error('⚠️ Resend API Error:', error);
                    // Fallthrough to Nodemailer if Resend fails (e.g. unverified email)
                } else {
                    console.log(`✅ OTP sent via Resend API: ${data.id}`);
                    return true;
                }
            } catch (rErr) {
                console.error('⚠️ Resend Exception:', rErr);
            }
        }

        // Method 2: Fallback to Nodemailer (SMTP)
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error("No Email Credentials");
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
                
                <div style="text-align: center; font-size: 12px; color: #999;">
                    <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} NPathways Global</p>
                </div>
            </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent via SMTP: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error('❌ Email Failed (Likely Render Port Block):', error.message);
        console.log('💡 TIP: Add RESEND_API_KEY to Render Environment Variables to enable HTTP emails.');

        // Fallback: Use console log for OTP
        console.warn("⚠️  Switched to CONSOLE OTP (Dev Mode):");
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
        const { name, email, phone, status } = userData;
        const recipient = process.env.EMAIL_USER || 'krishjr3010@gmail.com';

        // Method 1: Try Resend API
        if (resend) {
            try {
                const { data, error } = await resend.emails.send({
                    from: 'NPathways Admin <onboarding@resend.dev>',
                    to: [recipient], // Send to Admin
                    subject: '🎯 New Free Counselling Request',
                    html: `
                    <div>
                        <h2>New Request from ${name}</h2>
                        <p>Email: ${email}</p>
                        <p>Phone: ${phone}</p>
                        <p>Status: ${status}</p>
                        <p><small>Sent via Resend API</small></p>
                    </div>
                    `
                });
                if (!error) {
                    console.log(`✅ Counselling request sent via Resend: ${data.id}`);
                    return true;
                }
            } catch (rErr) { console.error(rErr); }
        }

        // Method 2: Nodemailer Fallback
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
