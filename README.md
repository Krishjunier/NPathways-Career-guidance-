# Career Counselling Web App (CarrierGenPRo)

A comprehensive, AI-driven Career Counselling platform designed to guide students and professionals toward their ideal career paths. The application combines psychometric assessments, AI analysis (Groq/Llama 3), and expert logic to generate personalized career roadmaps.

## 🌟 Key Features

### 🎓 Educational Flows
The system supports tailored conversational flows for various user stages:
*   **10th Grade Students**:
    *   **Higher Secondary Path**: Guidance on selecting streams (Science, Commerce, Arts) and specific courses.
    *   **Diploma Path**: Selection of diploma fields (Engineering, Design, etc.).
*   **12th Grade Students**: In-depth stream and course selection with "Currently Studying" tracking.
*   **Undergraduates (UG)**: Branch selection, internship logging, and future goal setting (Higher Studies vs Job).
*   **Masters Students**: Specialization focus and research interest tracking.
*   **Working Professionals**: Career switch analysis, skills gap assessment, and industry pivot guidance.

### 🧠 AI & Psychometrics
*   **Holistic Assessment**: Integrates RIASEC (Personality), Intelligence, and Emotional Intelligence tests.
*   **AI Engine**: Uses Groq (Llama 3.3) to analyze profile data + test scores to generate:
    *   Top 3 Career Domains
    *   Specific Roles & Courses
    *   College Recommendations (filtered by Target Country)
    *   Skill Gap Analysis

### 📊 Reports & Data
*   **PDF Reports**: detailed, downloadable career reports.
*   **Excel Export**: Full raw data export for counsellors or offline analysis.
*   **Visualizations**: Interactive Star Charts for personality mapping.

### 💎 Premium Features
*   **Goal Setting**: Explicit tracking of "Target Country" and "Career Goals".
*   **Payment Integration**: Infrastructure for premium report access (Razorpay/PhonePe ready).
*   **Exclusive Downloads**: Access to deeper insights and resources.

## 🛠️ Tech Stack

### Frontend
*   **React (TypeScript)**: Robust, typed UI development.
*   **Chat Interface**: Custom-built conversational engine (`ChatPage.tsx`).
*   **Styling**: TailwindCSS & Bootstrap.

### Backend
*   **Node.js & Express**: Scalable API server.
*   **MongoDB**: Flexible document storage for profiles and test results.
*   **Groq SDK**: LLM integration.
*   **Resend**: Reliable email delivery (OTP).

## 🚀 Quick Start

### Prerequisites
*   Node.js (v16+)
*   MongoDB running locally or Atlas URI.

### Installation

1.  **Clone the Repo**
    ```bash
    git clone <repo_url>
    ```

2.  **Install Dependencies** (Root, Backend, Frontend)
    ```bash
    # Root
    npm install
    # Backend
    cd backend && npm install
    # Frontend
    cd ../frontend && npm install
    ```

3.  **Setup Environment**
    Create `backend/.env` with keys (Monitor, Database, Groq, Resend).

4.  **Run the App**
    You can run servers concurrently (if configured) or in separate terminals:
    ```bash
    # Terminal 1: Backend
    cd backend
    npm run dev

    # Terminal 2: Frontend
    cd frontend
    npm start
    ```

## 📚 API Overview

*   **/api/auth**: User authentication & profile management.
*   **/api/chat**: AI interaction endpoints.
*   **/api/report**: PDF generation service.
*   **/api/export**: Excel data export service.
*   **/api/test**: Psychometric test submission & scoring.

## 🤝 Contributing

We welcome contributions! Please follow the `MASTER_FLOW_IMPLEMENTATION.md` guidelines when adding new conversation flows.