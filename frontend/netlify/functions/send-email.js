const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
    // Enable CORS for Render Backend to call this
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    try {
        const { email, subject, html } = JSON.parse(event.body);

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('Missing env vars on Netlify');
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration' }) };
        }

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const info = await transporter.sendMail({
            from: `"NPathways" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: html
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Email sent', id: info.messageId })
        };
    } catch (error) {
        console.error('Netlify Email Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
