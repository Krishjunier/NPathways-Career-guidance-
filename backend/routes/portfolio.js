// backend/routes/portfolio.js
const express = require("express");
const { generatePDF } = require("../utils/pdfGenerator");
const { getDb } = require("../utils/db");
const { Types } = require("mongoose");
const { getAICareerSuggestion } = require("../services/aiService"); // Import AI service
const TestResponse = require("../models/TestResponse"); // Import Model
const router = express.Router();

// Ensure global in-memory storage exists
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
    // Core consolidated fields
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
    // Note: targetCountry handled above
    department: user.department || uProfile.department || tProfile.department || null,
    collegeName: user.collegeName || uProfile.collegeName || tProfile.collegeName || null,
    completionYear: user.completionYear || uProfile.completionYear || tProfile.completionYear || null,
    // fallback container for any other profile fields
    otherProfileFields: {
      ...uProfile,
      ...tProfile,
    },
  };

  return profile;
}

/**
 * @route GET /portfolio/generate/:userId
 * @desc Generate portfolio PDF for download
 */
router.get("/generate/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    let user = await fetchUserById(userId);
    let testResponse = await fetchTestResponseById(userId);

    if (!user && !testResponse) {
      return res.status(404).json({ message: "User not found" });
    }

    // If test not completed, send empty data structure
    const responses = testResponse || { careerSuggestion: [], answers: {} };

    // Merge/compile profile info so generator can use course/branch/country etc.
    const profile = compileProfile(user || {}, testResponse || {});

    // Create a user-like object to pass to PDF generator which contains both user fields and profile
    const userForPdf = {
      ...(user || {}),
      profile,
    };

    const pdfBuffer = await generatePDF(userForPdf, responses);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Career_Research_Assessment.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Portfolio PDF Error:", error);
    res.status(500).json({
      message: "Failed to generate portfolio",
      error: error.message,
    });
  }
});

/**
 * @route GET /portfolio/data/:userId
 * @desc Fetch portfolio data for online view
 */
router.get("/data/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    let user = await fetchUserById(userId);
    let testResponse = await fetchTestResponseById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- REGENERATION LOGIC ---
    console.log(`[Portfolio] Hit data route for ${userId}. Query:`, req.query);

    if (req.query.refresh === 'true') {
      console.log(`[Portfolio] Refresh requested.`);
      if (testResponse) {
        console.log(`[Portfolio] testResponse found. Answers count:`, testResponse.answers ? testResponse.answers.length : 'N/A');
        console.log(`[Portfolio] Calling AI Service...`);
      } else {
        console.log(`[Portfolio] testResponse MISSING for user! Cannot regenerate.`);
      }
    }

    if (req.query.refresh === 'true') {
      try {
        // Collect answers for AI (if testResponse exists)
        let allAnswers = [];
        if (testResponse) {
          if (testResponse.sections) {
            allAnswers = [
              ...(testResponse.sections.riasec?.answers || []),
              ...(testResponse.sections.intelligence?.answers || []),
              ...(testResponse.sections.emotional?.answers || []),
            ];
          } else if (testResponse.answers) {
            allAnswers = Array.isArray(testResponse.answers) ? testResponse.answers : [];
          }
        }

        // Use whatever profile data we have
        const profileForAI = compileProfile(user, testResponse || {});

        console.log(`[Portfolio] Generating AI suggestion for ${user.email} with ${allAnswers.length} answers...`);
        const newSuggestion = await getAICareerSuggestion(profileForAI, allAnswers);

        if (newSuggestion) {
          if (testResponse) {
            testResponse.careerSuggestion = newSuggestion;
            testResponse.generatedAt = new Date(); // Track when it was freshened

            // Update DB
            await TestResponse.findOneAndUpdate(
              { userId },
              { $set: { careerSuggestion: newSuggestion, generatedAt: new Date() } }
            );
            // Update Cache
            global.testResponses.set(userId, testResponse);
          } else {
            // Create new TestResponse if missing
            const newTR = new TestResponse({
              userId,
              answers: [],
              sections: {},
              careerSuggestion: newSuggestion,
              generatedAt: new Date()
            });
            await newTR.save();
            testResponse = newTR; // Update local var for response construction
            global.testResponses.set(userId, newTR);
          }
          console.log(`[Portfolio] AI Regenerated successfully.`);
        }
      } catch (err) {
        console.error("Regeneration Failed:", err);
        // Continue with old data on error
      }
    }
    // --------------------------

    // If test not completed, send empty suggestions
    let careerSuggestion = testResponse?.careerSuggestion || {
      domain: "",
      roles: [],
      courses: [],
      description: "",
    };

    // SCRUB LEGACY DEFAULTS: Removed aggressively scrubbing "Software Developer"
    // as it caused valid AI results to be hidden.
    // if (careerSuggestion && careerSuggestion.roles) { ... }

    // Aggregate answers from sections or legacy field
    let answersArray = [];
    if (testResponse?.sections) {
      Object.values(testResponse.sections).forEach((section) => {
        if (section.answers && Array.isArray(section.answers)) {
          answersArray.push(...section.answers);
        }
      });
    } else if (testResponse?.answers) {
      if (Array.isArray(testResponse.answers)) {
        answersArray = testResponse.answers;
      } else {
        // Convert object-style answers to array if necessary
        answersArray = Object.entries(testResponse.answers).map(([key, val]) => ({
          questionId: parseInt(key),
          answer: val,
        }));
      }
    }

    // Compile profile/education preferences
    const profile = compileProfile(user || {}, testResponse || {});

    const portfolioData = {
      personalInfo: {
        name: user.name || (user.profile && user.profile.name) || "User",
        email: user.email || (user.profile && user.profile.email) || "",
        phone: user.phone || (user.profile && user.profile.phone) || "",
        status:
          user.class_status ||
          (user.profile && user.profile.class_status) ||
          "Student",
      },
      educationPreferences: {
        desiredCourse: profile.desiredCourse,
        preferredBranch: profile.preferredBranch,
        studyCountry: profile.studyCountry,
        bachelorStream: profile.bachelorStream,
        ugCourseCategory: profile.ugCourseCategory,
        ugBranch: profile.ugBranch,
        targetCountry: profile.targetCountry,
        department: profile.department,
        collegeName: profile.collegeName,
        completionYear: profile.completionYear,
        other: profile.otherProfileFields,
      },
      careerSuggestion,
      testResults: answersArray,
      examScores: [], // Placeholder for future feature
      skills: Array.isArray(careerSuggestion.skills) ? careerSuggestion.skills : [],
      projects: Array.isArray(careerSuggestion.projects) ? careerSuggestion.projects : [],
      generatedAt: new Date(),
    };

    res.json({
      message: "Portfolio data fetched successfully",
      portfolio: portfolioData,
    });
  } catch (error) {
    console.error("Portfolio Data Error:", error);
    res.status(500).json({
      message: "Failed to fetch portfolio data",
      error: error.message,
    });
  }
});

module.exports = router;
