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
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

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
