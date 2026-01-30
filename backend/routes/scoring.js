/**
 * backend/routes/scoring.js
 *
 * API endpoints for exam score categorization
 * Exposes scoring service for:
 * - Getting exam category for a score
 * - Listing available exam presets
 * - Creating custom exam configurations
 * - Batch processing exam results
 * - Generating scoring reports
 */

const express = require("express");
const {
  getExamCategory,
  getExamPreset,
  listExamPresets,
  validateAndCreateCustomConfig,
  createExamResult,
  formatExamResult,
  batchGetCategories,
  generateScoringReport,
} = require("../utils/scoringService");
const { getDb } = require("../utils/db");

const router = express.Router();

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/scoring/health
 * Verify scoring service is operational
 */
router.get("/health", (req, res) => {
  res.json({
    message: "Scoring service is running",
    service: "exam-categorization",
    version: "1.0.0",
  });
});

// ============================================================================
// EXAM PRESETS
// ============================================================================

/**
 * GET /api/scoring/presets
 * List all available exam presets
 *
 * Response: {
 *   presets: [
 *     { name: "IELTS", displayName: "...", maxScore: 9, mode: "ABSOLUTE" },
 *     ...
 *   ]
 * }
 */
router.get("/presets", (req, res) => {
  try {
    const presets = listExamPresets();
    res.json({
      message: "Available exam presets",
      count: presets.length,
      presets,
    });
  } catch (error) {
    console.error("Error listing presets:", error);
    res
      .status(500)
      .json({ message: "Failed to list presets", error: error.message });
  }
});

/**
 * GET /api/scoring/presets/:examName
 * Get configuration for a specific exam preset
 *
 * Response: {
 *   preset: {
 *     displayName: "...",
 *     maxScore: ...,
 *     mode: "ABSOLUTE" | "NORMALIZED",
 *     bins: [...]
 *   }
 * }
 */
router.get("/presets/:examName", (req, res) => {
  try {
    const { examName } = req.params;
    const preset = getExamPreset(examName);

    if (!preset) {
      return res.status(404).json({
        message: `Exam preset "${examName}" not found`,
        suggestion: "Use GET /api/scoring/presets to list available presets",
      });
    }

    res.json({
      examName: examName.toUpperCase(),
      preset,
    });
  } catch (error) {
    console.error("Error fetching preset:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch preset", error: error.message });
  }
});

// ============================================================================
// SCORE CATEGORIZATION
// ============================================================================

/**
 * POST /api/scoring/categorize
 * Get category for a single exam score
 *
 * Request Body: {
 *   examName: string (e.g., "IELTS")
 *   score: number
 *   maxScore: number
 *   config?: {
 *     mode: "ABSOLUTE" | "NORMALIZED"
 *     bins?: [{min, max, category, shortCode}, ...]
 *   }
 * }
 *
 * Response: {
 *   examName: string,
 *   score: number,
 *   maxScore: number,
 *   category: string,
 *   shortCode: string,
 *   normalized: number (0-100),
 *   mode: "ABSOLUTE" | "NORMALIZED"
 * }
 */
router.post("/categorize", (req, res) => {
  try {
    const { examName, score, maxScore, config } = req.body;

    // Validate required fields
    if (!examName || score === undefined || !maxScore) {
      return res.status(400).json({
        message: "Missing required fields: examName, score, maxScore",
      });
    }

    // Use preset if not provided
    let finalConfig = config;
    if (!finalConfig) {
      const preset = getExamPreset(examName);
      if (preset) {
        finalConfig = {
          mode: preset.mode,
          bins: preset.bins,
        };
      }
    }

    // Get category
    const categoryInfo = getExamCategory(score, maxScore, finalConfig);

    res.json({
      success: true,
      examName,
      score,
      maxScore,
      ...categoryInfo,
    });
  } catch (error) {
    console.error("Error categorizing score:", error);
    res.status(400).json({
      message: "Failed to categorize score",
      error: error.message,
    });
  }
});

// ============================================================================
// CUSTOM CONFIGURATIONS
// ============================================================================

/**
 * POST /api/scoring/custom-config
 * Create and validate a custom exam configuration
 *
 * Request Body: {
 *   examName: string
 *   displayName?: string
 *   maxScore: number
 *   mode: "ABSOLUTE" | "NORMALIZED"
 *   bins: [{min, max, category, shortCode}, ...] (for ABSOLUTE mode)
 * }
 *
 * Response: {
 *   success: true,
 *   config: {...}
 * }
 */
router.post("/custom-config", (req, res) => {
  try {
    const config = req.body;

    if (!config) {
      return res.status(400).json({
        message: "Request body is required",
      });
    }

    const validatedConfig = validateAndCreateCustomConfig(config);

    res.json({
      success: true,
      message: "Custom configuration created and validated",
      config: validatedConfig,
    });
  } catch (error) {
    console.error("Error creating custom config:", error);
    res.status(400).json({
      message: "Invalid custom configuration",
      error: error.message,
    });
  }
});

// ============================================================================
// EXAM RESULTS
// ============================================================================

/**
 * POST /api/scoring/results
 * Create an exam result with category information
 *
 * Request Body: {
 *   examName: string
 *   score: number
 *   maxScore: number
 *   config?: {...}
 *   userId?: string
 *   metadata?: {...}
 * }
 *
 * Response: {
 *   success: true,
 *   result: {...}
 * }
 */
router.post("/results", async (req, res) => {
  try {
    const { examName, score, maxScore, config, userId, metadata } = req.body;

    if (!examName || score === undefined || !maxScore) {
      return res.status(400).json({
        message: "Missing required fields: examName, score, maxScore",
      });
    }

    // Get preset if not provided
    let finalConfig = config;
    if (!finalConfig) {
      const preset = getExamPreset(examName);
      if (preset) {
        finalConfig = {
          mode: preset.mode,
          bins: preset.bins,
        };
      } else {
        finalConfig = { mode: "NORMALIZED" };
      }
    }

    // Create result
    const result = createExamResult({
      examName,
      score,
      maxScore,
      config: finalConfig,
      userId,
      metadata,
    });

    // Save to database if userId provided
    if (userId) {
      try {
        const db = getDb();
        if (db) {
          await db.collection("examResults").insertOne(result);
        }
      } catch (dbError) {
        console.warn("Failed to save to database:", dbError.message);
        // Continue anyway, in-memory storage is working
      }
    }

    res.json({
      success: true,
      result,
      formatted: formatExamResult(result),
    });
  } catch (error) {
    console.error("Error creating result:", error);
    res.status(400).json({
      message: "Failed to create exam result",
      error: error.message,
    });
  }
});

/**
 * GET /api/scoring/results/:userId
 * Get all exam results for a user
 *
 * Response: {
 *   userId: string,
 *   results: [...]
 * }
 */
router.get("/results/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const db = getDb();
    if (!db) {
      return res.status(503).json({
        message: "Database not available",
      });
    }

    const results = await db
      .collection("examResults")
      .find({ userId })
      .toArray();

    res.json({
      success: true,
      userId,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    res.status(500).json({
      message: "Failed to fetch results",
      error: error.message,
    });
  }
});

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * POST /api/scoring/batch-categorize
 * Process multiple exam results in batch
 *
 * Request Body: {
 *   exams: [
 *     { examName, score, maxScore, config? },
 *     ...
 *   ]
 * }
 *
 * Response: {
 *   success: true,
 *   results: [...]
 * }
 */
router.post("/batch-categorize", (req, res) => {
  try {
    const { exams } = req.body;

    if (!Array.isArray(exams)) {
      return res.status(400).json({
        message: "exams must be an array",
      });
    }

    // Use presets if not provided
    const examsWithConfigs = exams.map((exam) => {
      if (!exam.config) {
        const preset = getExamPreset(exam.examName);
        if (preset) {
          return {
            ...exam,
            config: {
              mode: preset.mode,
              bins: preset.bins,
            },
          };
        }
      }
      return exam;
    });

    const results = batchGetCategories(examsWithConfigs);

    res.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Error batch categorizing:", error);
    res.status(400).json({
      message: "Failed to batch categorize",
      error: error.message,
    });
  }
});

// ============================================================================
// REPORTING
// ============================================================================

/**
 * POST /api/scoring/report
 * Generate a scoring report for multiple exams
 *
 * Request Body: {
 *   exams: [{examName, score, maxScore, config?}, ...]
 * }
 *
 * Response: {
 *   success: true,
 *   report: {
 *     totalExams: number,
 *     validResults: number,
 *     failedResults: number,
 *     categories: {...},
 *     averageNormalized: number,
 *     summary: string
 *   }
 * }
 */
router.post("/report", (req, res) => {
  try {
    const { exams } = req.body;

    if (!Array.isArray(exams)) {
      return res.status(400).json({
        message: "exams must be an array",
      });
    }

    // Process all exams
    const processedResults = batchGetCategories(
      exams.map((exam) => ({
        ...exam,
        config: exam.config || {
          mode: getExamPreset(exam.examName)?.mode || "NORMALIZED",
          bins: getExamPreset(exam.examName)?.bins || null,
        },
      }))
    );

    // Generate report
    const report = generateScoringReport(processedResults);

    res.json({
      success: true,
      report,
      detailedResults: processedResults,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(400).json({
      message: "Failed to generate report",
      error: error.message,
    });
  }
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

router.use((err, req, res, next) => {
  console.error("[Scoring Router] Error:", err);
  res.status(500).json({
    message: "Scoring service error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

module.exports = router;
