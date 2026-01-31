// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const { connectToDatabase } = require("./utils/db");

const app = express();
app.set('trust proxy', 1); // Enable proxy trust for Render/Heroku
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    },
  },
}));
app.use(cors({
  origin: '*', // Allow all origins for Vercel/Netlify cross-domain
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Middleware (Netlify Prefix Normalizer)
// We need to ensure the request path matches what the express router expects (e.g. /api/auth/...)
app.use((req, res, next) => {
  // 1. Strip the basic Netlify function prefix
  if (req.url.startsWith("/.netlify/functions/api")) {
    req.url = req.url.replace("/.netlify/functions/api", "");
  } else if (req.url.startsWith("/.netlify/functions")) {
    req.url = req.url.replace("/.netlify/functions", "");
  }

  // 2. Ensure it starts with /api if it doesn't (unless it's root or health)
  if (!req.url.startsWith("/api") && req.url !== "/" && !req.url.includes("health")) {
    // Check if it's already a partial path e.g. /auth/send-otp
    req.url = `/api${req.url}`;
  }

  // 3. Prevent double /api/api
  if (req.url.startsWith("/api/api")) {
    req.url = req.url.replace("/api/api", "/api");
  }

  next();
});

// Helper to load routes
const loadRoute = (path, urlPrefix) => {
  try {
    const route = require(path);
    app.use(urlPrefix, route);
    console.log(`[Routes] Loaded ${path} at ${urlPrefix}`);
  } catch (e) {
    console.error(`[Routes] Failed to load ${path}:`, e.message);
    // console.error(e.stack); // Uncomment for full stack
  }
};

// API Routes
loadRoute("./routes/auth", "/api/auth");
loadRoute("./routes/counseling", "/api/counseling");
loadRoute("./routes/test", "/api/test");
loadRoute("./routes/report", "/api/report");
loadRoute("./routes/portfolio", "/api/portfolio");
loadRoute("./routes/export", "/api/export");
loadRoute("./routes/chat", "/api/chat");
loadRoute("./routes/scoring", "/api/scoring");
loadRoute("./routes/payment", "/api/payment");

// Mongoose Connection Middleware (Important for Vercel/Serverless)
app.use(async (req, res, next) => {
  // Skip DB connection for simple health checks to reduce latency
  if (req.path === '/' || req.path.includes('/health')) {
    return next();
  }

  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ message: "Database connection failed" });
  }
});

// Root route for sanity check
app.get("/", (req, res) => {
  res.send("<h2>Career Counselling API is Running 🚀</h2><p>Use /api/health to check status.</p>");
});

app.get("/api/health", (req, res) => {
  res.json({ message: "Career Counselling API is running!", status: "OK" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Export app for Vercel
module.exports = app;

// Only listen if run directly (Local Development)
if (require.main === module) {
  (async () => {
    try {
      await connectToDatabase();
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`[Storage] Mode: Mongoose/MongoDB`);
      });
    } catch (err) {
      console.error("Failed to start server due to DB connection error:", err.message);
      process.exit(1);
    }
  })();
}
