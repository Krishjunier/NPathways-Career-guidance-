// backend/routes/export.js
const express = require("express");
const { generateExcel } = require("../utils/excelGenerator");
const { getDb } = require("../utils/db");
const { Types } = require("mongoose");
const router = express.Router();

// Ensure global maps exist
if (!global.userData) global.userData = new Map();
if (!global.testResponses) global.testResponses = new Map();
if (!global.exportFiles) global.exportFiles = new Map();

/**
 * Helper: try to fetch a user from in-memory store, otherwise DB.
 * Supports string id and ObjectId lookups.
 */
async function fetchUserById(userId) {
  // Check global cache first
  let user = global.userData.get(userId);
  if (user) return user;

  // Try DB
  try {
    const db = getDb();
    if (!db) return null;

    // Try as string _id first
    user = await db.collection("users").findOne({ _id: userId });
    if (user) return user;

    // If not found, try ObjectId if possible
    if (ObjectId.isValid(userId)) {
      user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) });
      if (user) return user;
    }
  } catch (e) {
    console.warn("fetchUserById DB lookup failed:", e.message || e);
  }
  return null;
}

/**
 * Helper: try to fetch testResponses from in-memory store, otherwise DB.
 */
async function fetchTestResponseById(userId) {
  let tr = global.testResponses.get(userId);
  if (tr) return tr;

  try {
    const db = getDb();
    if (!db) return null;

    tr = await db.collection("tests").find({ userId }).toArray();
    if (tr && tr.length > 0) return tr;

    if (Types.ObjectId.isValid(userId)) {
      tr = await db
        .collection("tests")
        .find({ userId: new Types.ObjectId(userId) })
        .toArray();
      if (tr && tr.length > 0) return tr;
    }
  } catch (e) {
    console.warn("fetchTestResponseById DB lookup failed:", e.message || e);
  }
  return null;
}

/**
 * Normalizes and compiles profile-related fields from various possible locations.
 */
function compileProfile(user = {}, testResponse = {}) {
  const uProfile = user.profile || {};
  const tProfile = testResponse.profile || {};

  // Consolidate Target Country
  const targetCountry = user.targetCountry || uProfile.targetCountry || tProfile.targetCountry ||
    uProfile['12thTargetCountry'] || tProfile['12thTargetCountry'] ||
    uProfile['UGTargetCountry'] || tProfile['UGTargetCountry'] ||
    uProfile['MasterTargetCountry'] || tProfile['MasterTargetCountry'] ||
    uProfile['workTargetCountry'] || tProfile['workTargetCountry'] || null;

  // Consolidate Goal
  const goal = user.goal || uProfile.goal || tProfile.goal ||
    uProfile.careerGoal || tProfile.careerGoal ||
    uProfile['12thGoal'] || tProfile['12thGoal'] ||
    uProfile['UGGoal'] || tProfile['UGGoal'] ||
    uProfile['MasterGoal'] || tProfile['MasterGoal'] || null;

  return {
    // Core consolidated fields
    goal,
    targetCountry,

    // 12th fields
    desiredCourse:
      user.desiredCourse ||
      uProfile.desiredCourse ||
      tProfile.desiredCourse ||
      null,
    preferredBranch:
      user.preferredBranch ||
      uProfile.preferredBranch ||
      tProfile.preferredBranch ||
      null,
    studyCountry:
      user.studyCountry ||
      uProfile.studyCountry ||
      tProfile.studyCountry ||
      null,
    // UG fields
    bachelorStream:
      user.bachelorStream ||
      uProfile.bachelorStream ||
      tProfile.bachelorStream ||
      null,
    ugCourseCategory:
      user.ugCourseCategory ||
      uProfile.ugCourseCategory ||
      tProfile.ugCourseCategory ||
      null,
    ugBranch: user.ugBranch || uProfile.ugBranch || tProfile.ugBranch || null,
    // Note: targetCountry handled above
    department:
      user.department || uProfile.department || tProfile.department || null,
    collegeName:
      user.collegeName || uProfile.collegeName || tProfile.collegeName || null,
    completionYear:
      user.completionYear ||
      uProfile.completionYear ||
      tProfile.completionYear ||
      null,
    // fallback container for any other profile fields
    otherProfileFields: {
      ...uProfile,
      ...tProfile,
    },
  };
}

/**
 * @route GET /export/files/:userId
 * @desc Get all export files for a user
 */
router.get("/files/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    let files = [];

    // Try database first
    try {
      const db = getDb();
      if (db) {
        files = await db
          .collection("exportFiles")
          .find({ userId })
          .sort({ createdAt: -1 })
          .toArray();
      }
    } catch (dbError) {
      console.warn("Database fetch failed, using in-memory:", dbError.message);
      // Fallback to in-memory
      const userFiles = global.exportFiles.get(userId);
      files = userFiles || [];
    }

    res.json({
      files,
      total: files.length,
    });
  } catch (error) {
    console.error("Fetch files error:", error);
    res.status(500).json({
      message: "Failed to fetch export files",
      error: error.message,
    });
  }
});

/**
 * @route GET /export/excel/:userId
 * @desc Export user data + test responses as Excel
 */
router.get("/excel/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    let user = await fetchUserById(userId);
    let testResponse = await fetchTestResponseById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If test not taken, use empty object (generator should handle gracefully)
    const responses = testResponse || {};

    // Compile profile and attach to user object passed to generator
    const profile = compileProfile(user || {}, testResponse || {});
    const userForExcel = {
      ...(user || {}),
      profile,
    };

    const excelBuffer = await generateExcel(userForExcel, responses);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Career_Research_Assessment_${userId}.xlsx"`
    );

    // Log the export
    console.log(`[Export] Excel generated for user ${userId}`);

    // Optionally save to export files tracking
    try {
      const fileRecord = {
        id: `excel_${userId}_${Date.now()}`,
        userId,
        name: `Career_Research_Assessment_${userId}.xlsx`,
        type: "excel",
        createdAt: new Date().toISOString(),
        size: excelBuffer.length,
      };

      const db = getDb();
      if (db) {
        await db.collection("exportFiles").insertOne(fileRecord);
      } else {
        // Store in memory
        const userFiles = global.exportFiles.get(userId) || [];
        userFiles.push(fileRecord);
        global.exportFiles.set(userId, userFiles);
      }
    } catch (trackError) {
      console.warn("Failed to track export file:", trackError.message);
    }

    return res.send(excelBuffer);
  } catch (error) {
    console.error("Excel Export Error:", error);
    return res.status(500).json({
      message: "Failed to generate Excel file",
      error: error.message,
    });
  }
});

/**
 * @route POST /export/refresh/:userId
 * @desc Refresh portfolio data for a user
 */
router.post("/refresh/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Fetch fresh data from DB if available
    let user = await fetchUserById(userId);
    let testResponse = await fetchTestResponseById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update in-memory cache with fresh data
    global.userData.set(userId, user);
    if (testResponse) {
      global.testResponses.set(userId, testResponse);
    }

    res.json({
      message: "Portfolio data refreshed successfully",
      userId,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({
      message: "Failed to refresh portfolio data",
      error: error.message,
    });
  }
});

/**
 * @route GET /export/file/:fileId
 * @desc Download a specific export file
 */
router.get("/file/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;

    // Try to find file in database or memory
    let file = null;

    try {
      const db = getDb();
      if (db) {
        file = await db.collection("exportFiles").findOne({ id: fileId });
      }
    } catch (dbError) {
      console.warn("Database lookup failed:", dbError.message);
    }

    // Search in-memory if not found in DB
    if (!file) {
      for (const [userId, files] of global.exportFiles.entries()) {
        file = files.find((f) => f.id === fileId);
        if (file) break;
      }
    }

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // If file has URL, redirect
    if (file.url) {
      return res.redirect(file.url);
    }

    // If file has content, send it
    if (file.content) {
      res.setHeader(
        "Content-Type",
        file.mimeType || "application/octet-stream"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.name}"`
      );
      return res.send(file.content);
    }

    res.status(404).json({ message: "File content not available" });
  } catch (error) {
    console.error("File download error:", error);
    res.status(500).json({
      message: "Failed to download file",
      error: error.message,
    });
  }
});

/**
 * @route DELETE /export/files/:fileId
 * @desc Delete an export file
 */
router.delete("/files/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;

    // Try database first
    try {
      const db = getDb();
      if (db) {
        const result = await db
          .collection("exportFiles")
          .deleteOne({ id: fileId });
        if (result.deletedCount > 0) {
          return res.json({ message: "File deleted successfully", fileId });
        }
      }
    } catch (dbError) {
      console.warn("Database delete failed:", dbError.message);
    }

    // Fallback to in-memory
    for (const [userId, files] of global.exportFiles.entries()) {
      const filtered = files.filter((f) => f.id !== fileId);
      if (filtered.length < files.length) {
        global.exportFiles.set(userId, filtered);
        return res.json({ message: "File deleted successfully", fileId });
      }
    }

    res.status(404).json({ message: "File not found" });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({
      message: "Failed to delete file",
      error: error.message,
    });
  }
});

module.exports = router;
