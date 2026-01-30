# Career Counselling Backend API

The backend for the **Career Counselling Web App**, built with Node.js, Express, and MongoDB.

## 🚀 Features

*   **Authentication**: OTP-based login powered by Resend email service.
*   **AI Engine**: Integrates with Groq (Llama 3) to generate personalized career guidance.
*   **Report Generation**:
    *   **PDF**: Detailed career roadmap using `puppeteer` and `jspdf`.
    *   **Excel**: Raw data export using `xlsx`.
*   **Portfolio Management**: Stores and retrieves user test results and profiles.
*   **Payment Webhooks**: (Optional) Infrastructure for Razorpay/PhonePe integration.

## 📦 Tech Stack

*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: MongoDB (Mongoose)
*   **AI**: Groq SDK
*   **Validation**: Joi

## 🛠️ Setup & Installation

1.  **Install Dependencies**
    ```bash
    cd backend
    npm install
    ```

2.  **Environment Configuration**
    Create a `.env` file in the `backend` directory:
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/career_counselling
    groq_api_key=your_groq_key
    RESEND_API_KEY=your_resend_key
    OTP_SECRET=your_secret
    JWT_SECRET=your_jwt_secret
    ```

3.  **Run Server**
    ```bash
    # Development (Nodemon)
    npm run dev

    # Production
    npm start
    ```

## 📚 key API Endpoints

*   `POST /api/auth/send-otp`: Request login OTP.
*   `POST /api/auth/verify-otp`: Verify OTP and login.
*   `POST /api/test/submit`: Submit psychometric test results.
*   `GET /api/report/career-guidance/:userId`: Get AI-generated report.
*   `GET /api/export/excel/:userId`: Download Excel dump.

## 🤝 Development

*   Ensure MongoDB is running locally or provide a valid Atlas URI.
*   Check `utils/db.js` for connection logic.
