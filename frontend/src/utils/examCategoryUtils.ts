/**
 * Exam Category Utility Functions
 * Determines score categories with badges, suggestions, and normalized percentages
 */

// Default category bins (used if exam config not provided)
const DEFAULT_BINS = {
  "Excellent": { min: 90, color: "#00C853", bg: "#E8F5E9" },
  "Very Good": { min: 80, color: "#1976D2", bg: "#E3F2FD" },
  "Good": { min: 70, color: "#2E7D32", bg: "#F1F8E9" },
  "Average": { min: 50, color: "#F57C00", bg: "#FFF3E0" },
  "Below Average": { min: 0, color: "#D32F2F", bg: "#FFEBEE" }
};

interface ExamCategory {
  category: string;
  suggestion: string;
  color: string;
  bgColor: string;
  shortCode: string;
}

interface CategoryConfig {
  min: number;
  suggestion?: string;
  color?: string;
  bg?: string;
}

interface CategoryMap {
  [key: string]: CategoryConfig;
}

/**
 * Get exam category based on score and config
 * @param score - Numeric score
 * @param maxScore - Maximum possible score
 * @param configBins - Optional exam-specific category bins
 * @returns {ExamCategory} Category info with badge and suggestion
 */
export function getExamCategory(
  score: number,
  maxScore: number,
  configBins?: CategoryMap
): ExamCategory {
  // Validate inputs
  if (typeof score !== "number" || score < 0) {
    throw new Error("Score must be a non-negative number");
  }
  if (typeof maxScore !== "number" || maxScore <= 0) {
    throw new Error("Max score must be a positive number");
  }
  if (score > maxScore) {
    throw new Error("Score cannot exceed max score");
  }

  // Calculate normalized percentage
  const normalized = (score / maxScore) * 100;

  // Use provided config bins or fall back to default
  const bins = configBins || DEFAULT_BINS;

  // Find matching category
  let matchedCategory: string = "Below Average";
  let categoryConfig: CategoryConfig = DEFAULT_BINS["Below Average"];
  
  for (const [category, config] of Object.entries(bins)) {
    if (normalized >= config.min) {
      matchedCategory = category;
      categoryConfig = config;
      break;
    }
  }

  // Fallback to default if not found
  if (!categoryConfig) {
    categoryConfig = DEFAULT_BINS["Below Average"];
  }

  // Generate suggestion text
  const suggestion = generateSuggestion(matchedCategory, normalized);

  return {
    category: matchedCategory,
    suggestion,
    color: categoryConfig.color || DEFAULT_BINS["Average"].color,
    bgColor: categoryConfig.bg || DEFAULT_BINS["Average"].bg,
    shortCode: getShortCode(matchedCategory)
  };
}

/**
 * Generate contextual suggestion based on category
 * @param category - Category name
 * @param normalized - Normalized percentage
 * @returns {string} Suggestion text
 */
function generateSuggestion(category: string, normalized: number): string {
  const suggestions: { [key: string]: string } = {
    "Excellent": "Outstanding performance! You're well-prepared for advanced opportunities.",
    "Very Good": "Strong performance. You're on track for competitive programs.",
    "Good": "Solid foundation. Consider targeted preparation for specific areas.",
    "Average": "Moderate performance. Additional practice and focus areas recommended.",
    "Below Average": "Significant improvement needed. Dedicated study plan recommended."
  };

  return suggestions[category] || "Keep working to improve your score.";
}

/**
 * Get short code for category (e.g., "A", "VG", "BA")
 * @param category - Category name
 * @returns {string} Short code
 */
function getShortCode(category: string): string {
  const codes: { [key: string]: string } = {
    "Excellent": "E",
    "Very Good": "VG",
    "Good": "G",
    "Average": "A",
    "Below Average": "BA"
  };

  return codes[category] || "N/A";
}

/**
 * Get all category options for reference
 * @returns {Array} Array of category info
 */
export function getAllCategories() {
  return Object.entries(DEFAULT_BINS).map(([name, config]) => ({
    name,
    min: config.min,
    color: config.color,
    bg: config.bg
  }));
}

/**
 * Format score display with category
 * @param score - Numeric score
 * @param maxScore - Maximum possible score
 * @param configBins - Optional exam-specific bins
 * @returns {object} Formatted display data
 */
export function formatScoreDisplay(
  score: number,
  maxScore: number,
  configBins?: CategoryMap
) {
  const normalized = (score / maxScore) * 100;
  const categoryInfo = getExamCategory(score, maxScore, configBins);

  return {
    raw: `${score}/${maxScore}`,
    normalized: `${normalized.toFixed(1)}%`,
    displayScore: maxScore === 100 ? score : `${normalized.toFixed(1)}%`,
    category: categoryInfo.category,
    suggestion: categoryInfo.suggestion,
    color: categoryInfo.color,
    bgColor: categoryInfo.bgColor,
    shortCode: categoryInfo.shortCode,
    progressPercent: Math.min(normalized, 100)
  };
}

/**
 * Validate exam configuration
 * @param config - Category configuration
 * @returns {boolean} True if valid
 */
export function validateCategoryConfig(config: CategoryMap): boolean {
  if (!config || typeof config !== "object") {
    return false;
  }

  for (const [category, values] of Object.entries(config)) {
    if (typeof values.min !== "number" || values.min < 0) {
      console.warn(`Invalid min for category ${category}`);
      return false;
    }
  }

  return true;
}

/**
 * Unit test helper - Get test cases for category mapping
 * @returns {Array} Test cases with expected results
 */
export function getTestCases() {
  return [
    { score: 95, maxScore: 100, expected: "Excellent" },
    { score: 85, maxScore: 100, expected: "Very Good" },
    { score: 75, maxScore: 100, expected: "Good" },
    { score: 60, maxScore: 100, expected: "Average" },
    { score: 40, maxScore: 100, expected: "Below Average" },
    { score: 190, maxScore: 200, expected: "Excellent" }, // 95%
    { score: 150, maxScore: 200, expected: "Average" }, // 75%
    { score: 5, maxScore: 10, expected: "Average" }, // 50%
  ];
}
