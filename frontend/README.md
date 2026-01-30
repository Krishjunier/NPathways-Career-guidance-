# Career Counselling Frontend

The React-based frontend for the **Career Counselling Web App**.

## 🚀 Features

*   **Interactive Chat Interface**: A dynamic, conversational UI (`ChatPage.tsx`) that guides users through profiling and test taking.
*   **Psychometric Assessments**:
    *   **RIASEC**: Visual Star Chart representation.
    *   **Intelligence & Emotional**: Sectioned tests.
*   **Dashboards**:
    *   **Student Dashboard**: View reports, download resources.
    *   **Parent Dashboard**: Simplified view for guardians.
    *   **Professional Dashboard**: Career switch tools.
*   **Premium Features**: Payment gateway integration (`PaymentPage.tsx`) and premium downloads.

## 📦 Tech Stack

*   **Framework**: React (Create React App structure)
*   **Language**: TypeScript
*   **Styling**: TailwindCSS + Bootstrap + Custom CSS
*   **Charts**: Recharts (for Star Chart)
*   **State Management**: React Context / Local State

## 🛠️ Setup & Installation

1.  **Install Dependencies**
    ```bash
    cd frontend
    npm install
    ```

2.  **Run Application**
    ```bash
    npm start
    ```
    Opens [http://localhost:3000](http://localhost:3000).

## 📁 Key Directories

*   `src/pages`: Main application views (Chat, Profile, Payment, etc.).
*   `src/components`: Reusable UI components (StarChart, Navbar, Loader).
*   `src/context`: Global state (AuthContext).
*   `src/api`: Axios instances and API service functions.

## 🎨 Theming

The application supports a modern light/dark theme (defaulting to light for reports).
Styles are defined in `index.css` and component-specific CSS modules.
