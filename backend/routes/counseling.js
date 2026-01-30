// backend/routes/counseling.js
const express = require("express");
const router = express.Router();
const { getDb } = require("../utils/db");

// In-memory storage for counseling requests (if DB unavailable)
if (!global.counselingRequests) {
  global.counselingRequests = new Map();
}

/**
 * @route POST /counseling/request
 * @desc Submit a counseling request
 * @body { userId, userName, userEmail, requestedAt }
 */
router.post("/request", async (req, res) => {
  try {
    const { userId, userName, userEmail, requestedAt } = req.body;

    if (!userId || !userEmail) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const requestData = {
      userId,
      userName: userName || "Unknown",
      userEmail,
      requestedAt: requestedAt || new Date().toISOString(),
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in memory
    global.counselingRequests.set(userId, requestData);

    // Try to store in database
    try {
      const db = getDb();
      if (db) {
        await db
          .collection("counselingRequests")
          .updateOne({ userId }, { $set: requestData }, { upsert: true });
      }
    } catch (dbError) {
      console.warn(
        "Database storage failed, using in-memory only:",
        dbError.message
      );
    }

    // Send notification (email/log)
    await sendCounselingNotification(requestData);

    res.json({
      message: "Counseling request submitted successfully",
      request: requestData,
    });
  } catch (error) {
    console.error("Counseling request error:", error);
    res.status(500).json({
      message: "Failed to submit counseling request",
      error: error.message,
    });
  }
});

/**
 * @route GET /counseling/status/:userId
 * @desc Check if user has requested counseling
 */
router.get("/status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Check in-memory first
    let request = global.counselingRequests.get(userId);

    // Try database if not in memory
    if (!request) {
      try {
        const db = getDb();
        if (db) {
          request = await db
            .collection("counselingRequests")
            .findOne({ userId });
        }
      } catch (dbError) {
        console.warn("Database lookup failed:", dbError.message);
      }
    }

    if (!request) {
      return res.json({ requested: false });
    }

    res.json({
      requested: true,
      status: request.status,
      requestedAt: request.requestedAt,
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({
      message: "Failed to check counseling status",
      error: error.message,
    });
  }
});

/**
 * @route GET /counseling/requests
 * @desc Get all counseling requests (admin endpoint)
 */
router.get("/requests", async (req, res) => {
  try {
    let requests = [];

    // Try database first
    try {
      const db = getDb();
      if (db) {
        requests = await db
          .collection("counselingRequests")
          .find({})
          .sort({ createdAt: -1 })
          .toArray();
      }
    } catch (dbError) {
      console.warn("Database fetch failed, using in-memory:", dbError.message);
      // Fallback to in-memory
      requests = Array.from(global.counselingRequests.values());
    }

    res.json({
      requests,
      total: requests.length,
    });
  } catch (error) {
    console.error("Fetch requests error:", error);
    res.status(500).json({
      message: "Failed to fetch counseling requests",
      error: error.message,
    });
  }
});

/**
 * @route PATCH /counseling/update/:userId
 * @desc Update counseling request status (admin endpoint)
 * @body { status, notes }
 */
router.patch("/update/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const validStatuses = ["pending", "contacted", "scheduled", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const updateData = {
      status,
      notes: notes || "",
      updatedAt: new Date(),
    };

    // Update in memory
    const existing = global.counselingRequests.get(userId);
    if (existing) {
      global.counselingRequests.set(userId, { ...existing, ...updateData });
    }

    // Update in database
    try {
      const db = getDb();
      if (db) {
        await db
          .collection("counselingRequests")
          .updateOne({ userId }, { $set: updateData });
      }
    } catch (dbError) {
      console.warn("Database update failed:", dbError.message);
    }

    res.json({
      message: "Counseling request updated successfully",
      userId,
      status,
    });
  } catch (error) {
    console.error("Update request error:", error);
    res.status(500).json({
      message: "Failed to update counseling request",
      error: error.message,
    });
  }
});

/**
 * Helper function to send notification about new counseling request
 * Currently logs to console. Integrate with email service for production.
 */
async function sendCounselingNotification(requestData) {
  console.log("\n=== NEW COUNSELING REQUEST ===");
  console.log("User ID:", requestData.userId);
  console.log("Name:", requestData.userName);
  console.log("Email:", requestData.userEmail);
  console.log("Requested At:", requestData.requestedAt);
  console.log("==============================\n");

  // TODO: Integrate with email service
  // Example with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: 'counseling-team@yourcompany.com',
    from: 'noreply@yourcompany.com',
    subject: `New Counseling Request from ${requestData.userName}`,
    html: `
      <h2>New Counseling Request</h2>
      <p><strong>User:</strong> ${requestData.userName}</p>
      <p><strong>Email:</strong> ${requestData.userEmail}</p>
      <p><strong>User ID:</strong> ${requestData.userId}</p>
      <p><strong>Requested At:</strong> ${new Date(requestData.requestedAt).toLocaleString()}</p>
    `,
  };
  
  await sgMail.send(msg);
  */
}

module.exports = router;
