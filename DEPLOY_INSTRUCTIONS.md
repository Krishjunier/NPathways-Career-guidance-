# Deploying Backend to Netlify

You're almost there! Your code is configured. Now follow these steps on **netlify.com**:

1.  **Log In**: Go to Netlify and log in.
2.  **Add New Site**: Click **"Add new site"** -> **"Import from Git"**.
3.  **Connect Repo**: Choose GitHub and select your repository: `NPathways-Career-guidance-`.
4.  **Configure Build**:
    *   **Build Command**: `npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend` (This should be auto-filled).
    *   **Publish Directory**: `frontend/build` (Auto-filled).
5.  **Environment Variables (CRITICAL)**:
    *   Click **"Add environment variables"** or go to **Site Settings > Environment Variables** after creating the site.
    *   Add the contents of your `backend/.env` file:
        *   `MONGODB_URI`
        *   `JWT_SECRET`
        *   `EMAIL_USER`
        *   `EMAIL_PASS`
        *   `GROQ_API_KEY` (if used)
        *   *Note*: `PORT` is not needed (Netlify handles it).
6.  **Deploy**: Click **"Deploy Site"**.

## Connecting Frontend (Vercel) to Backend (Netlify)

Once Netlify deployment is successful:
1.  Copy your Netlify URL (e.g., `https://your-site.netlify.app`).
2.  Go to your **Vercel Project Settings**.
3.  Add/Edit Environment Variable:
    *   Key: `REACT_APP_API_BASE_URL`
    *   Value: `https://your-site.netlify.app` (Just the domain, no `/api` suffix).
4.  **Redeploy Vercel** (Go to Deployments -> Redeploy).

Now your Vercel frontend will talk to your Netlify backend!
