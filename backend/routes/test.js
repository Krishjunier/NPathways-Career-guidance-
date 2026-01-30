// backend/routes/test.js
const express = require("express");
const {
  psychometricQuestions,
  calculateCareerSuggestion,
} = require("../utils/testService");
const router = express.Router();
const { getDb } = require("../utils/db");
const { ObjectId } = require("mongodb");

// Ensure global maps exist
if (!global.userData) global.userData = new Map();
if (!global.testResponses) global.testResponses = new Map();

// Questions array for multi-section tests
const allQuestions = [
  // RIASEC Questions (101-106)
  {
    id: 101,
    question: "I enjoy working with tools and machinery",
    category: "Realistic",
  },
  {
    id: 102,
    question: "I like to analyze and solve complex problems",
    category: "Investigative",
  },
  {
    id: 103,
    question: "I enjoy creating art, music, or writing",
    category: "Artistic",
  },
  {
    id: 104,
    question: "I like helping and teaching others",
    category: "Social",
  },
  {
    id: 105,
    question: "I enjoy leading and managing projects",
    category: "Enterprising",
  },
  {
    id: 106,
    question: "I prefer organized and structured tasks",
    category: "Conventional",
  },

  // Intelligence Questions (201-208)
  {
    id: 201,
    question: "I can easily understand complex ideas",
    category: "Logical",
  },
  {
    id: 202,
    question: "I am good at remembering facts and details",
    category: "Memory",
  },
  {
    id: 203,
    question: "I can solve mathematical problems quickly",
    category: "Mathematical",
  },
  { id: 204, question: "I have a strong vocabulary", category: "Verbal" },
  {
    id: 205,
    question: "I can visualize objects in 3D space",
    category: "Spatial",
  },
  { id: 206, question: "I learn new concepts quickly", category: "Learning" },
  {
    id: 207,
    question: "I can think critically and logically",
    category: "Critical",
  },
  {
    id: 208,
    question: "I am creative in finding solutions",
    category: "Creative",
  },

  // Emotional Intelligence Questions (301-305)
  {
    id: 301,
    question: "I am aware of my emotions",
    category: "Self-Awareness",
  },
  {
    id: 302,
    question: "I can control my impulses",
    category: "Self-Regulation",
  },
  {
    id: 303,
    question: "I am motivated to achieve my goals",
    category: "Motivation",
  },
  { id: 304, question: "I understand how others feel", category: "Empathy" },
  {
    id: 305,
    question: "I communicate effectively with others",
    category: "Social Skills",
  },

  // Personality Questions (401-405)
  {
    id: 401,
    question: "I am the life of the party",
    category: "Extroversion",
  },
  {
    id: 402,
    question: "I sympathize with others' feelings",
    category: "Agreeableness",
  },
  {
    id: 403,
    question: "I get chores done right away",
    category: "Conscientiousness",
  },
  {
    id: 404,
    question: "I have frequent mood swings",
    category: "Neuroticism",
  },
  {
    id: 405,
    question: "I have a vivid imagination",
    category: "Openness",
  },

  // Behavioral Questions (501-505)
  {
    id: 501,
    question: "I adapt easily to new situations",
    category: "Adaptability",
  },
  {
    id: 502,
    question: "I persist when facing difficulties",
    category: "Resilience",
  },
  {
    id: 503,
    question: "I take initiative in team projects",
    category: "Initiative",
  },
  {
    id: 504,
    question: "I manage my time effectively",
    category: "Time Management",
  },
  {
    id: 505,
    question: "I seek feedback to improve",
    category: "Growth Mindset",
  },

  // Work Style (Clarity) 601-605
  { id: 601, question: "I prefer working independently rather than in a specific group", category: "Independence" },
  { id: 602, question: "I like having a clear set of rules and instructions", category: "Structure" },
  { id: 603, question: "I enjoy multitasking and shifting focus often", category: "Variety" },
  { id: 604, question: "I thrive in high-pressure environments", category: "Pressure" },
  { id: 605, question: "I prioritize accuracy over speed", category: "Precision" },

  // Learning Style (Clarity) 701-705
  { id: 701, question: "I learn best by doing and practicing", category: "Kinesthetic" },
  { id: 702, question: "I prefer reading texts and looking at diagrams", category: "Visual" },
  { id: 703, question: "I learn well by listening to lectures and discussions", category: "Auditory" },
  { id: 704, question: "I like to take detailed notes while studying", category: "Read/Write" },
  { id: 705, question: "I prefer studying in groups", category: "Social" },

  // Leadership (Compass) 801-805
  { id: 801, question: "I am comfortable delegating tasks to others", category: "Delegation" },
  { id: 802, question: "I can motivate people to achieve a common goal", category: "Motivation" },
  { id: 803, question: "I am confident in making difficult decisions", category: "Decision Making" },
  { id: 804, question: "I handle conflict between team members effectively", category: "Conflict Resolution" },
  { id: 805, question: "I take responsibility for my team's failures", category: "Accountability" },

  // Stress Management (Compass) 901-905
  { id: 901, question: "I stay calm when things go wrong", category: "Composure" },
  { id: 902, question: "I can disconnect from work/study to relax", category: "Work-Life Balance" },
  { id: 903, question: "I ask for help when I feel overwhelmed", category: "Support Seeking" },
  { id: 904, question: "I view challenges as opportunities", category: "Positivity" },
  { id: 905, question: "I use relaxation techniques effectively", category: "Coping" },

  // Creativity (Compass) 1001-1005
  { id: 1001, question: "I often come up with unique ideas", category: "Originality" },
  { id: 1002, question: "I like to experiment with new approaches", category: "Experimentation" },
  { id: 1003, question: "I can connect unrelated concepts together", category: "Associative" },
  { id: 1004, question: "I enjoy solving riddles and brain teasers", category: "Problem Solving" },
  { id: 1005, question: "I express myself through art, writing, or design", category: "Expression" },
];

/**
 * Helper: try to fetch a user from in-memory store, otherwise DB.
 * Supports string id and ObjectId lookups.
 */
const User = require('../models/User');

/**
 * Helper: fetch user via Mongoose
 */
async function fetchUserById(userId) {
  try {
    const user = await User.findById(userId);
    return user;
  } catch (e) {
    console.warn("fetchUserById (Mongoose) failed:", e.message);
  }
  return null;
}

/**
 * Helper: try to fetch testResponses from in-memory store, otherwise DB.
 */
const TestResponse = require('../models/TestResponse');

// ...

/**
 * Helper: fetch testResponses via Mongoose
 */
async function fetchTestResponseById(userId) {
  try {
    const tr = await TestResponse.findOne({ userId });
    return tr;
  } catch (e) {
    console.warn("fetchTestResponseById (Mongoose) failed:", e.message);
  }
  return null;
}

/**
 * Normalizes and compiles profile-related fields from various possible locations.
 */
function compileProfile(user = {}, testResponse = {}) {
  const uProfile = user.profile || {};
  const tProfile = testResponse.profile || {};

  const profile = {
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
    targetCountry:
      user.targetCountry ||
      uProfile.targetCountry ||
      tProfile.targetCountry ||
      uProfile.UGTargetCountry ||
      uProfile.MasterTargetCountry ||
      uProfile['12thTargetCountry'] ||
      uProfile.workTargetCountry ||
      null,
    goal:
      user.goal ||
      uProfile.goal ||
      tProfile.goal ||
      uProfile.UGGoal ||
      uProfile.MasterGoal ||
      uProfile['12thGoal'] ||
      uProfile.careerGoal ||
      uProfile.childGoals ||
      null,
    department:
      user.department || uProfile.department || tProfile.department || null,
    collegeName:
      user.collegeName || uProfile.collegeName || tProfile.collegeName || null,
    completionYear:
      user.completionYear ||
      uProfile.completionYear ||
      tProfile.completionYear ||
      null,
    // preserve any other profile fields
    otherProfileFields: {
      ...uProfile,
      ...tProfile,
    },
  };

  return profile;
}

/**
 * @route GET /test/questions?type=riasec|intelligence|emotional
 * @desc Fetch psychometric questions filtered by type
 */
router.get("/questions", (req, res) => {
  try {
    const { type } = req.query;

    // If no type specified, return all questions (backward compatibility)
    if (!type) {
      return res.json(allQuestions);
    }

    // Filter questions by type
    let filtered = [];
    if (type === "riasec") {
      filtered = allQuestions.filter((q) => q.id >= 101 && q.id <= 106);
    } else if (type === "intelligence") {
      filtered = allQuestions.filter((q) => q.id >= 201 && q.id <= 208);
    } else if (type === "emotional") {
      filtered = allQuestions.filter((q) => q.id >= 301 && q.id <= 305);
    } else if (type === "personality") {
      filtered = allQuestions.filter((q) => q.id >= 401 && q.id <= 405);
    } else if (type === "behavioral") {
      filtered = allQuestions.filter((q) => q.id >= 501 && q.id <= 505);
    } else if (type === "workstyle") {
      filtered = allQuestions.filter((q) => q.id >= 601 && q.id <= 605);
    } else if (type === "learning") {
      filtered = allQuestions.filter((q) => q.id >= 701 && q.id <= 705);
    } else if (type === "leadership") {
      filtered = allQuestions.filter((q) => q.id >= 801 && q.id <= 805);
    } else if (type === "stress") {
      filtered = allQuestions.filter((q) => q.id >= 901 && q.id <= 905);
    } else if (type === "creativity") {
      filtered = allQuestions.filter((q) => q.id >= 1001 && q.id <= 1005);
    } else {
      // Invalid type, return all
      filtered = allQuestions;
    }

    // Return array directly (not wrapped in object)
    res.json(filtered);
  } catch (error) {
    console.error("Fetch Questions Error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch questions", error: error.message });
  }
});

/**
 * @route POST /test/submit
 * @desc Submit answers and calculate career suggestion
 * @body { userId, answers, section, completed }
 *
 * Supports multi-section submission:
 * - section: "riasec" | "intelligence" | "emotional"
 * - completed: true when section is done
 */
router.post("/submit", async (req, res) => {
  try {
    const { userId, answers, section, completed } = req.body;

    // fetch user (memory or DB)
    const user = await fetchUserById(userId);

    if (!user) {
      return res
        .status(401)
        .json({ message: "User not found or not verified" });
    }

    // Check verification using user.verified or nested profile flag
    const isVerified = !!(
      user.verified ||
      (user.profile && user.profile.verified)
    );
    if (!isVerified) {
      return res
        .status(401)
        .json({ message: "User not found or not verified" });
    }

    // Fetch existing test response
    let testResponse = await fetchTestResponseById(userId);

    if (!testResponse) {
      // Initialize new test response
      testResponse = {
        userId,
        sections: {},
        profile: compileProfile(user, {}),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Update the specific section
    if (section) {
      testResponse.sections = testResponse.sections || {};
      testResponse.sections[section] = {
        answers,
        completed: !!completed,
        submittedAt: new Date(),
      };
    } else {
      // Legacy format: store all answers together
      testResponse.answers = answers;
      testResponse.submittedAt = new Date();
    }

    testResponse.updatedAt = new Date();

    // Check tier completion (Free -> Clarity -> Compass)
    const bundles = {
      free: ['riasec', 'intelligence', 'personality'],
      clarity: ['riasec', 'intelligence', 'personality', 'workstyle', 'learning'],
      compass: ['riasec', 'intelligence', 'personality', 'workstyle', 'learning', 'emotional', 'behavioral', 'leadership', 'stress', 'creativity']
    };

    const completedSections = Object.keys(testResponse.sections || {}).filter(k => testResponse.sections[k].completed);

    let effectivePlan = null;
    if (bundles.compass.every(s => completedSections.includes(s))) effectivePlan = 'compass';
    else if (bundles.clarity.every(s => completedSections.includes(s))) effectivePlan = 'clarity';
    else if (bundles.free.every(s => completedSections.includes(s))) effectivePlan = 'free';

    // Calculate career suggestion and Aggregates if a valid bundle is complete
    if (effectivePlan) {
      console.log(`[Test] Generating AI suggestion for plan level: ${effectivePlan} (${userId})`);

      // 1. Calculate Aggregates for RELEVANT sections (0-10 scale)
      const calculateSectionScore = (sectionName) => {
        const answers = testResponse.sections[sectionName]?.answers || [];
        if (!answers.length) return 0;

        let total = 0;
        let count = 0;
        answers.forEach(a => {
          let val = a.value;
          if (val === undefined) {
            // Fallback: if answer is numeric string
            if (!isNaN(a.answer)) val = parseInt(a.answer);
            else val = 3; // Default neutral
          }
          total += val;
          count++;
        });

        // Normalize to 0-10. Max theoretical score per question is 5.
        // Average = total / count (1-5 range)
        // (Avg / 5) * 10
        const avg = count > 0 ? total / count : 0;
        return Math.round((avg / 5) * 10);
      };

      const aggregates = {};
      bundles[effectivePlan].forEach(sec => {
        aggregates[sec] = calculateSectionScore(sec);
      });

      const getQuestionDetails = (ans) => {
        const qConfig = allQuestions.find(q => q.id === parseInt(ans.questionId)) || {};
        return {
          question: qConfig.question || `Question ${ans.questionId}`,
          category: qConfig.category || "General",
          answer: ans.answer
        };
      };

      let enrichedAnswers = [];
      bundles[effectivePlan].forEach(sec => {
        const ansList = testResponse.sections[sec]?.answers || [];
        enrichedAnswers = [...enrichedAnswers, ...ansList.map(getQuestionDetails)];
      });

      try {
        const { getAICareerSuggestion } = require("../services/aiService");

        // Pass filtered answers/aggregates to AI, ensuring suggestion matches the Plan Scope
        const suggestion = await getAICareerSuggestion(
          testResponse.profile,
          enrichedAnswers,
          aggregates
        );

        testResponse.careerSuggestion = {
          ...suggestion,
          aggregates, // Append calculated aggregates
          planLevel: effectivePlan
        };

        console.log(`[Test] AI Suggestion generated successfully.`);
      } catch (aiError) {
        console.error("AI Generation Failed:", aiError);
        // Fallback with just aggregates
        testResponse.careerSuggestion = { aggregates, planLevel: effectivePlan };
      }
    }

    // Store test responses in memory
    global.testResponses.set(userId, testResponse);

    // Persist to DB when available (upsert)
    try {
      await TestResponse.findOneAndUpdate(
        { userId },
        { $set: testResponse },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (e) {
      console.warn("DB save testResponses failed", e.message);
    }

    const allSectionsComplete = effectivePlan === 'compass';

    res.json({
      message: section
        ? `${section} section submitted successfully`
        : "Test submitted successfully",
      careerSuggestion: testResponse.careerSuggestion || null,
      allComplete: allSectionsComplete,
    });
  } catch (error) {
    console.error("Test Submission Error:", error);
    res
      .status(500)
      .json({ message: "Test submission failed", error: error.message });
  }
});

/**
 * @route GET /test/results/:userId
 * @desc Fetch submitted test results
 */
router.get("/results/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // fetch user and testResponse (memory or DB)
    const user = await fetchUserById(userId);
    const testResponse = await fetchTestResponseById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!testResponse) {
      return res.status(404).json({ message: "Test results not found" });
    }

    // Include compiled profile for client convenience
    const profile = compileProfile(user, testResponse);

    res.json({
      user: {
        id: userId,
        name: user.name || (user.profile && user.profile.name) || null,
        email: user.email || (user.profile && user.profile.email) || null,
        class_status:
          user.class_status ||
          (user.profile && user.profile.class_status) ||
          null,
        profile,
      },
      results: testResponse,
    });
  } catch (error) {
    console.error("Fetch Test Results Error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch results", error: error.message });
  }
});

/**
 * @route GET /test/progress/:userId
 * @desc Get test progress for a user
 */
router.get("/progress/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const testResponse = await fetchTestResponseById(userId);

    if (!testResponse) {
      return res.json({
        riasec: false,
        intelligence: false,
        emotional: false,
        allComplete: false,
      });
    }

    const progress = {
      riasec: !!testResponse.sections?.riasec?.completed,
      intelligence: !!testResponse.sections?.intelligence?.completed,
      emotional: !!testResponse.sections?.emotional?.completed,
      personality: !!testResponse.sections?.personality?.completed,
      behavioral: !!testResponse.sections?.behavioral?.completed,
      allComplete: !!(
        testResponse.sections?.riasec?.completed &&
        testResponse.sections?.intelligence?.completed &&
        testResponse.sections?.emotional?.completed &&
        testResponse.sections?.personality?.completed &&
        testResponse.sections?.behavioral?.completed
      ),
    };

    res.json(progress);
  } catch (error) {
    console.error("Fetch Progress Error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch progress", error: error.message });
  }
});

module.exports = router;
