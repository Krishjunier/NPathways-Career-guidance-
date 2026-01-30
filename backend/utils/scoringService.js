/**
 * backend/utils/scoringService.js
 *
 * Per-exam configurable score→category mapping system
 * Supports:
 * 1) ABSOLUTE: Admin-defined raw-score bins (e.g., 0-3=Below, 4-5=Avg, 6-8=Good, 9+=Excellent)
 * 2) NORMALIZED: Use (score/maxScore)*100 with descending thresholds
 *
 * Auto-fills exam presets (IELTS/TOEFL/SAT/GRE/ACT/etc.)
 * Validates inputs and falls back to normalized if no absolute bin
 */

// ============================================================================
// EXAM PRESETS
// ============================================================================

/**
 * Predefined exam configurations with absolute scoring bins and metadata
 */
const EXAM_PRESETS = {
  // English Proficiency Exams
  IELTS: {
    displayName: "IELTS (International English Language Testing System)",
    maxScore: 9,
    mode: "ABSOLUTE",
    bins: [
      { min: 0, max: 3.9, category: "Below Average", shortCode: "BA" },
      { min: 4, max: 5.4, category: "Average", shortCode: "AVG" },
      { min: 5.5, max: 6.9, category: "Good", shortCode: "GOOD" },
      { min: 7, max: 8, category: "Very Good", shortCode: "VG" },
      { min: 8.1, max: 9, category: "Excellent", shortCode: "EXC" },
    ],
  },

  TOEFL: {
    displayName: "TOEFL (Test of English as a Foreign Language)",
    maxScore: 120,
    mode: "ABSOLUTE",
    bins: [
      { min: 0, max: 30, category: "Below Average", shortCode: "BA" },
      { min: 31, max: 60, category: "Average", shortCode: "AVG" },
      { min: 61, max: 90, category: "Good", shortCode: "GOOD" },
      { min: 91, max: 110, category: "Very Good", shortCode: "VG" },
      { min: 111, max: 120, category: "Excellent", shortCode: "EXC" },
    ],
  },

  PTE: {
    displayName: "PTE (Pearson Test of English)",
    maxScore: 90,
    mode: "ABSOLUTE",
    bins: [
      { min: 0, max: 25, category: "Below Average", shortCode: "BA" },
      { min: 26, max: 45, category: "Average", shortCode: "AVG" },
      { min: 46, max: 60, category: "Good", shortCode: "GOOD" },
      { min: 61, max: 75, category: "Very Good", shortCode: "VG" },
      { min: 76, max: 90, category: "Excellent", shortCode: "EXC" },
    ],
  },

  DUOLINGO: {
    displayName: "Duolingo English Test",
    maxScore: 160,
    mode: "ABSOLUTE",
    bins: [
      { min: 0, max: 80, category: "Below Average", shortCode: "BA" },
      { min: 81, max: 100, category: "Average", shortCode: "AVG" },
      { min: 101, max: 120, category: "Good", shortCode: "GOOD" },
      { min: 121, max: 140, category: "Very Good", shortCode: "VG" },
      { min: 141, max: 160, category: "Excellent", shortCode: "EXC" },
    ],
  },

  // Aptitude & Entrance Exams
  SAT: {
    displayName: "SAT (Scholastic Assessment Test)",
    maxScore: 1600,
    mode: "ABSOLUTE",
    bins: [
      { min: 0, max: 600, category: "Below Average", shortCode: "BA" },
      { min: 601, max: 1000, category: "Average", shortCode: "AVG" },
      { min: 1001, max: 1200, category: "Good", shortCode: "GOOD" },
      { min: 1201, max: 1400, category: "Very Good", shortCode: "VG" },
      { min: 1401, max: 1600, category: "Excellent", shortCode: "EXC" },
    ],
  },

  ACT: {
    displayName: "ACT (American College Testing)",
    maxScore: 36,
    mode: "ABSOLUTE",
    bins: [
      { min: 0, max: 12, category: "Below Average", shortCode: "BA" },
      { min: 13, max: 18, category: "Average", shortCode: "AVG" },
      { min: 19, max: 24, category: "Good", shortCode: "GOOD" },
      { min: 25, max: 30, category: "Very Good", shortCode: "VG" },
      { min: 31, max: 36, category: "Excellent", shortCode: "EXC" },
    ],
  },

  GRE: {
    displayName: "GRE (Graduate Record Examination)",
    maxScore: 340,
    mode: "ABSOLUTE",
    bins: [
      { min: 260, max: 280, category: "Below Average", shortCode: "BA" },
      { min: 281, max: 300, category: "Average", shortCode: "AVG" },
      { min: 301, max: 315, category: "Good", shortCode: "GOOD" },
      { min: 316, max: 325, category: "Very Good", shortCode: "VG" },
      { min: 326, max: 340, category: "Excellent", shortCode: "EXC" },
    ],
  },

  GMAT: {
    displayName: "GMAT (Graduate Management Admission Test)",
    maxScore: 800,
    mode: "ABSOLUTE",
    bins: [
      { min: 200, max: 400, category: "Below Average", shortCode: "BA" },
      { min: 401, max: 550, category: "Average", shortCode: "AVG" },
      { min: 551, max: 650, category: "Good", shortCode: "GOOD" },
      { min: 651, max: 720, category: "Very Good", shortCode: "VG" },
      { min: 721, max: 800, category: "Excellent", shortCode: "EXC" },
    ],
  },

  JEE_MAIN: {
    displayName: "JEE Main (Joint Entrance Examination)",
    maxScore: 300,
    mode: "ABSOLUTE",
    bins: [
      { min: 0, max: 50, category: "Below Average", shortCode: "BA" },
      { min: 51, max: 100, category: "Average", shortCode: "AVG" },
      { min: 101, max: 150, category: "Good", shortCode: "GOOD" },
      { min: 151, max: 200, category: "Very Good", shortCode: "VG" },
      { min: 201, max: 300, category: "Excellent", shortCode: "EXC" },
    ],
  },

  JEE_ADVANCED: {
    displayName: "JEE Advanced",
    maxScore: 360,
    mode: "ABSOLUTE",
    bins: [
      { min: 0, max: 60, category: "Below Average", shortCode: "BA" },
      { min: 61, max: 120, category: "Average", shortCode: "AVG" },
      { min: 121, max: 180, category: "Good", shortCode: "GOOD" },
      { min: 181, max: 240, category: "Very Good", shortCode: "VG" },
      { min: 241, max: 360, category: "Excellent", shortCode: "EXC" },
    ],
  },

  NEET: {
    displayName: "NEET (National Eligibility cum Entrance Test)",
    maxScore: 720,
    mode: "ABSOLUTE",
    bins: [
      { min: 0, max: 150, category: "Below Average", shortCode: "BA" },
      { min: 151, max: 300, category: "Average", shortCode: "AVG" },
      { min: 301, max: 450, category: "Good", shortCode: "GOOD" },
      { min: 451, max: 600, category: "Very Good", shortCode: "VG" },
      { min: 601, max: 720, category: "Excellent", shortCode: "EXC" },
    ],
  },

  CAT: {
    displayName: "CAT (Common Admission Test)",
    maxScore: 300,
    mode: "ABSOLUTE",
    bins: [
      { min: 0, max: 50, category: "Below Average", shortCode: "BA" },
      { min: 51, max: 100, category: "Average", shortCode: "AVG" },
      { min: 101, max: 150, category: "Good", shortCode: "GOOD" },
      { min: 151, max: 200, category: "Very Good", shortCode: "VG" },
      { min: 201, max: 300, category: "Excellent", shortCode: "EXC" },
    ],
  },

  // Generic Percentage Score
  PERCENTAGE: {
    displayName: "Percentage Score (0-100)",
    maxScore: 100,
    mode: "ABSOLUTE",
    bins: [
      { min: 0, max: 40, category: "Below Average", shortCode: "BA" },
      { min: 41, max: 60, category: "Average", shortCode: "AVG" },
      { min: 61, max: 75, category: "Good", shortCode: "GOOD" },
      { min: 76, max: 90, category: "Very Good", shortCode: "VG" },
      { min: 91, max: 100, category: "Excellent", shortCode: "EXC" },
    ],
  },

  // Normalized/Custom scores
  CUSTOM_NORMALIZED: {
    displayName: "Custom Normalized Score (0-maxScore)",
    maxScore: 100, // Default, can be overridden
    mode: "NORMALIZED",
    bins: null, // Uses normalized thresholds instead
  },
};

// ============================================================================
// NORMALIZED SCORING THRESHOLDS
// ============================================================================

/**
 * Normalized thresholds applied when mode="NORMALIZED"
 * Maps percentages to categories (descending order for clarity)
 */
const NORMALIZED_THRESHOLDS = [
  { minPercentage: 90, category: "Excellent", shortCode: "EXC" },
  { minPercentage: 75, category: "Very Good", shortCode: "VG" },
  { minPercentage: 60, category: "Good", shortCode: "GOOD" },
  { minPercentage: 40, category: "Average", shortCode: "AVG" },
  { minPercentage: 0, category: "Below Average", shortCode: "BA" },
];

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

/**
 * Get exam category based on score, max score, and config
 *
 * @param {number} score - The raw score achieved
 * @param {number} maxScore - Maximum possible score for the exam
 * @param {object} config - Exam configuration object with:
 *   - mode: "ABSOLUTE" or "NORMALIZED"
 *   - bins: (for ABSOLUTE mode) array of {min, max, category, shortCode}
 *   - Custom bins can override presets
 * @returns {object} Result object with:
 *   - category: Assigned category
 *   - shortCode: Short category code
 *   - normalized: Normalized percentage (0-100)
 *   - mode: Which mode was used
 *   - binInfo: The matching bin (if ABSOLUTE)
 */
function getExamCategory(score, maxScore, config = {}) {
  // Input validation
  if (typeof score !== "number" || isNaN(score)) {
    throw new Error("Score must be a valid number");
  }
  if (typeof maxScore !== "number" || maxScore <= 0) {
    throw new Error("maxScore must be a positive number");
  }
  if (score < 0 || score > maxScore) {
    console.warn(
      `Score ${score} outside valid range [0, ${maxScore}]. Clamping to range.`
    );
    score = Math.max(0, Math.min(score, maxScore));
  }

  // Calculate normalized percentage
  const normalized = Math.round((score / maxScore) * 100);

  // Determine mode
  const mode = config.mode || "NORMALIZED";

  // Try ABSOLUTE mode with bins
  if (mode === "ABSOLUTE" && config.bins && Array.isArray(config.bins)) {
    return getAbsoluteCategory(score, normalized, config.bins);
  }

  // Fallback to NORMALIZED
  return getNormalizedCategory(normalized);
}

/**
 * Get category using ABSOLUTE mode with defined bins
 * @private
 */
function getAbsoluteCategory(score, normalized, bins) {
  // Find matching bin
  const matchingBin = bins.find((bin) => score >= bin.min && score <= bin.max);

  if (matchingBin) {
    return {
      category: matchingBin.category,
      shortCode: matchingBin.shortCode,
      normalized,
      mode: "ABSOLUTE",
      binInfo: {
        min: matchingBin.min,
        max: matchingBin.max,
      },
    };
  }

  // If no bin matches, fallback to normalized
  console.warn(
    `Score ${score} does not fall in any defined bin. Falling back to NORMALIZED mode.`
  );
  return getNormalizedCategory(normalized);
}

/**
 * Get category using NORMALIZED mode with percentage thresholds
 * @private
 */
function getNormalizedCategory(normalized) {
  const matchingThreshold = NORMALIZED_THRESHOLDS.find(
    (t) => normalized >= t.minPercentage
  );

  if (matchingThreshold) {
    return {
      category: matchingThreshold.category,
      shortCode: matchingThreshold.shortCode,
      normalized,
      mode: "NORMALIZED",
      binInfo: null,
    };
  }

  // Fallback (should not reach here)
  return {
    category: "Below Average",
    shortCode: "BA",
    normalized,
    mode: "NORMALIZED",
    binInfo: null,
  };
}

// ============================================================================
// EXAM CONFIGURATION MANAGEMENT
// ============================================================================

/**
 * Get preset configuration for a known exam
 * @param {string} examName - Name of the exam (e.g., "IELTS", "SAT")
 * @returns {object|null} Exam preset or null if not found
 */
function getExamPreset(examName) {
  return EXAM_PRESETS[examName?.toUpperCase()] || null;
}

/**
 * Get all available exam presets (names and display names)
 * @returns {array} Array of {name, displayName}
 */
function listExamPresets() {
  return Object.entries(EXAM_PRESETS).map(([name, config]) => ({
    name,
    displayName: config.displayName,
    maxScore: config.maxScore,
    mode: config.mode,
  }));
}

/**
 * Create or update custom exam configuration
 * Validates that bins are properly ordered and don't overlap
 *
 * @param {object} customConfig - Custom exam configuration with:
 *   - examName: string
 *   - displayName: string (optional)
 *   - maxScore: number
 *   - mode: "ABSOLUTE" or "NORMALIZED"
 *   - bins: array of {min, max, category, shortCode} (for ABSOLUTE mode)
 * @returns {object} Validated configuration
 */
function validateAndCreateCustomConfig(customConfig) {
  if (!customConfig || typeof customConfig !== "object") {
    throw new Error("Custom config must be an object");
  }

  const { examName, displayName, maxScore, mode, bins } = customConfig;

  if (!examName) throw new Error("examName is required");
  if (typeof maxScore !== "number" || maxScore <= 0) {
    throw new Error("maxScore must be a positive number");
  }
  if (mode !== "ABSOLUTE" && mode !== "NORMALIZED") {
    throw new Error('mode must be "ABSOLUTE" or "NORMALIZED"');
  }

  let validatedBins = null;

  if (mode === "ABSOLUTE") {
    if (!bins || !Array.isArray(bins) || bins.length === 0) {
      throw new Error(
        "For ABSOLUTE mode, bins array is required and must not be empty"
      );
    }

    validatedBins = validateBins(bins, maxScore);
  }

  return {
    examName,
    displayName: displayName || examName,
    maxScore,
    mode,
    bins: validatedBins,
  };
}

/**
 * Validate bins for proper ordering and non-overlap
 * @private
 */
function validateBins(bins, maxScore) {
  // Sort by min score
  const sorted = [...bins].sort((a, b) => a.min - b.min);

  for (let i = 0; i < sorted.length; i++) {
    const bin = sorted[i];

    // Check required fields
    if (
      typeof bin.min !== "number" ||
      typeof bin.max !== "number" ||
      !bin.category ||
      !bin.shortCode
    ) {
      throw new Error(
        `Bin ${i}: must have min, max (numbers), category, and shortCode`
      );
    }

    // Check min <= max
    if (bin.min > bin.max) {
      throw new Error(`Bin ${i}: min (${bin.min}) must be <= max (${bin.max})`);
    }

    // Check within range
    if (bin.min < 0 || bin.max > maxScore) {
      throw new Error(
        `Bin ${i}: range [${bin.min}, ${bin.max}] outside [0, ${maxScore}]`
      );
    }

    // Check for gaps or overlaps with previous bin
    if (i > 0) {
      const prevBin = sorted[i - 1];
      if (bin.min > prevBin.max + 1) {
        console.warn(
          `Bin ${i}: gap detected between ${prevBin.max} and ${bin.min}`
        );
      }
      if (bin.min <= prevBin.max) {
        throw new Error(
          `Bin ${i}: overlaps with previous bin [${prevBin.min}, ${prevBin.max}]`
        );
      }
    }

    // Check if bins cover full range
    if (i === sorted.length - 1 && bin.max < maxScore) {
      console.warn(`Final bin max (${bin.max}) < maxScore (${maxScore})`);
    }
  }

  return sorted;
}

// ============================================================================
// EXAM RESULT PERSISTENCE
// ============================================================================

/**
 * Create a complete exam result object ready to save to database
 *
 * @param {object} params - Object containing:
 *   - examName: string
 *   - score: number
 *   - maxScore: number
 *   - config: exam configuration (preset or custom)
 *   - userId: string (optional, for database linking)
 *   - metadata: object (optional, additional data)
 * @returns {object} Complete exam result object with category info
 */
function createExamResult(params) {
  const { examName, score, maxScore, config, userId, metadata = {} } = params;

  if (!examName) throw new Error("examName is required");

  // Get category information
  const categoryInfo = getExamCategory(score, maxScore, config);

  // Create result object
  const result = {
    examName,
    score,
    maxScore,
    mode: config?.mode || "NORMALIZED",
    category: categoryInfo.category,
    shortCode: categoryInfo.shortCode,
    normalized: categoryInfo.normalized,
    createdAt: new Date(),
    ...metadata,
  };

  if (userId) {
    result.userId = userId;
  }

  if (categoryInfo.binInfo) {
    result.binInfo = categoryInfo.binInfo;
  }

  return result;
}

/**
 * Format exam result for display (e.g., in reports or UI)
 *
 * @param {object} result - Exam result object from createExamResult
 * @returns {string} Formatted display string
 */
function formatExamResult(result) {
  return `${result.examName}: ${result.score}/${result.maxScore} (${result.category}, ${result.shortCode}, ${result.normalized}%)`;
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Process multiple exam results in batch
 * Useful for bulk scoring or importing exam data
 *
 * @param {array} examResults - Array of {examName, score, maxScore, config}
 * @returns {array} Array of processed results with categories
 */
function batchGetCategories(examResults) {
  if (!Array.isArray(examResults)) {
    throw new Error("examResults must be an array");
  }

  return examResults.map((result, index) => {
    try {
      const categoryInfo = getExamCategory(
        result.score,
        result.maxScore,
        result.config
      );

      return {
        examName: result.examName,
        score: result.score,
        maxScore: result.maxScore,
        ...categoryInfo,
        error: null,
      };
    } catch (err) {
      return {
        examName: result.examName,
        error: err.message,
      };
    }
  });
}

/**
 * Generate a scoring report for an array of exams
 * Shows statistics and category distributions
 *
 * @param {array} examResults - Array of processed results
 * @returns {object} Report with statistics
 */
function generateScoringReport(examResults) {
  const valid = examResults.filter((r) => !r.error);

  if (valid.length === 0) {
    return {
      totalExams: examResults.length,
      validResults: 0,
      failedResults: examResults.length,
      categories: {},
      averageNormalized: null,
      summary: "No valid results to report",
    };
  }

  const categories = {};
  let totalNormalized = 0;

  valid.forEach((result) => {
    const cat = result.category;
    categories[cat] = (categories[cat] || 0) + 1;
    totalNormalized += result.normalized;
  });

  const averageNormalized = Math.round(totalNormalized / valid.length);

  return {
    totalExams: examResults.length,
    validResults: valid.length,
    failedResults: examResults.filter((r) => r.error).length,
    categories,
    averageNormalized,
    summary: `${valid.length} valid exams scored with average normalized score: ${averageNormalized}%`,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Constants
  EXAM_PRESETS,
  NORMALIZED_THRESHOLDS,

  // Core Functions
  getExamCategory,
  getExamPreset,
  listExamPresets,

  // Configuration
  validateAndCreateCustomConfig,

  // Persistence
  createExamResult,
  formatExamResult,

  // Batch Operations
  batchGetCategories,
  generateScoringReport,
};
