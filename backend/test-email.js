require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmail = async () => {
    console.log("Testing email configuration...");
    console.log(`User: ${process.env.EMAIL_USER}`);
    console.log(`Pass (first 4 chars): ${process.env.EMAIL_PASS?.substring(0, 4)}...`);
    console.log(`Host: ${process.env.EMAIL_HOST}`);
    console.log(`Port: ${process.env.EMAIL_PORT}`);

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 10000, // 10s
        debug: true, // Show SMTP traffic
        logger: true // Log info
    });

    try {
        console.log("Sending test email...");
        const info = await transporter.sendMail({
            from: `"Test Script" <${process.env.EMAIL_USER}>`,
            to: "kks348739@gmail.com", // Updated recipient
            subject: "Career Counselling SMTP Test",
            text: "If you see this, SMTP is working!"
        });
        console.log("✅ Email sent successfully!");
        console.log("Message ID:", info.messageId);
    } catch (error) {
        console.error("❌ Email failed to send:");
        console.error(error);
    }
};

testEmail();
