
const express = require("express");
const {
  generateCareerReport,
  getCollegeRecommendations,
} = require("../utils/reportService");
const { Types } = require("mongoose");
const router = express.Router();
const { getDb } = require("../utils/db");

// Ensure global maps exist
if (!global.userData) global.userData = new Map();
if (!global.testResponses) global.testResponses = new Map();

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
    if (Types.ObjectId.isValid(userId)) {
      user = await db.collection("users").findOne({ _id: new Types.ObjectId(userId) });
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

    tr = await db.collection("testResponses").findOne({ _id: userId });
    if (tr) return tr;

    if (Types.ObjectId.isValid(userId)) {
      tr = await db.collection("testResponses").findOne({ _id: new Types.ObjectId(userId) });
      if (tr) return tr;
    }
  } catch (e) {
    console.warn("fetchTestResponseById DB lookup failed:", e.message || e);
  }
  return null;
}

/**
 * Normalizes and compiles profile-related fields from various possible locations.
 * Looks into user object top-level fields, user.profile sub-object, and testResponse.profile.
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

  const profile = {
    // Core fields
    goal,
    targetCountry,

    // 12th fields
    desiredCourse: user.desiredCourse || uProfile.desiredCourse || tProfile.desiredCourse || null,
    preferredBranch: user.preferredBranch || uProfile.preferredBranch || tProfile.preferredBranch || null,
    studyCountry: user.studyCountry || uProfile.studyCountry || tProfile.studyCountry || null,
    // UG fields
    bachelorStream: user.bachelorStream || uProfile.bachelorStream || tProfile.bachelorStream || null,
    ugCourseCategory: user.ugCourseCategory || uProfile.ugCourseCategory || tProfile.ugCourseCategory || null,
    ugBranch: user.ugBranch || uProfile.ugBranch || tProfile.ugBranch || null,
    // Note: 'targetCountry' is now handled above, but keeping specific field if needed by consumers
    department: user.department || uProfile.department || tProfile.department || null,
    collegeName: user.collegeName || uProfile.collegeName || tProfile.collegeName || null,
    completionYear: user.completionYear || uProfile.completionYear || tProfile.completionYear || null,
    // preserve anything else useful
    otherProfileFields: {
      ...uProfile,
      ...tProfile,
    },
  };

  return profile;
}

/**
 * @route GET /report/career-guidance/:userId
 * @desc Generate career guidance report based on user profile and test results
 */
router.get("/career-guidance/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    let user = await fetchUserById(userId);
    let testResponse = await fetchTestResponseById(userId);

    if (!user && !testResponse) {
      return res.status(404).json({ message: "User not found" });
    }

    // If test not completed, default structure
    const reportData = testResponse || { careerSuggestion: [], answers: {} };

    // SCRUB LEGACY DEFAULTS: Removed.
    // if (reportData.careerSuggestion ...) { ... }

    // Compile profile fields for consistent downstream consumption
    const profile = compileProfile(user || {}, testResponse || {});

    // Build a unified user object to pass to report generator
    const userForReport = {
      ...(user || {}),
      profile,
    };

    // generateCareerReport may rely on both profile and test results
    const report = generateCareerReport(userForReport, reportData);

    // Provide college recommendations; give them context (user + careerSuggestion)
    // Provide college recommendations from AI data
    // Normalize: AI might return strings ["Harvard"], frontend expects objects [{college: "Harvard"}]
    const careerSuggestion = reportData?.careerSuggestion || {};
    const rawColleges = Array.isArray(careerSuggestion.colleges)
      ? careerSuggestion.colleges
      : [];

    const colleges = rawColleges.map(c => {
      // If AI returns string, wrapper it
      if (typeof c === 'string') {
        return {
          college: c,
          course: careerSuggestion.domain || "Recommended Course",
          country: profile.targetCountry || user.studyCountry || "—"
        };
      }
      // If AI returns object { name, course }
      return {
        college: c.name || c.college || "University",
        course: c.course || careerSuggestion.domain || "Recommended Course",
        country: c.country || profile.targetCountry || user.studyCountry || "—"
      };
    });

    const userPlan = user.purchasedBundles?.includes('compass_bundle') ? 'compass' :
      user.purchasedBundles?.includes('clarity_bundle') ? 'clarity' : 'free';

    res.json({
      message: "Career guidance report generated successfully",
      report,
      colleges,
      plan: userPlan
    });
  } catch (error) {
    console.error("Career Report Error:", error);
    res.status(500).json({
      message: "Failed to generate report",
      error: error.message,
    });
  }
});



module.exports = router;
