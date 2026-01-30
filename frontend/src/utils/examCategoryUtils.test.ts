/**
 * Test Suite: examCategoryUtils.ts
 * Tests for score categorization logic
 */

import {
  getExamCategory,
  formatScoreDisplay,
  getAllCategories,
  validateCategoryConfig,
  getTestCases
} from "./examCategoryUtils";

describe("getExamCategory", () => {
  describe("Default bins (0-100 scale)", () => {
    test("scores 90-100 should return Excellent", () => {
      const result = getExamCategory(95, 100);
      expect(result.category).toBe("Excellent");
      expect(result.suggestion).toContain("Outstanding");
      expect(result.shortCode).toBe("E");
    });

    test("scores 80-89 should return Very Good", () => {
      const result = getExamCategory(85, 100);
      expect(result.category).toBe("Very Good");
      expect(result.suggestion).toContain("Strong");
      expect(result.shortCode).toBe("VG");
    });

    test("scores 70-79 should return Good", () => {
      const result = getExamCategory(75, 100);
      expect(result.category).toBe("Good");
      expect(result.suggestion).toContain("Solid");
      expect(result.shortCode).toBe("G");
    });

    test("scores 50-69 should return Average", () => {
      const result = getExamCategory(60, 100);
      expect(result.category).toBe("Average");
      expect(result.suggestion).toContain("Moderate");
      expect(result.shortCode).toBe("A");
    });

    test("scores 0-49 should return Below Average", () => {
      const result = getExamCategory(40, 100);
      expect(result.category).toBe("Below Average");
      expect(result.suggestion).toContain("Significant");
      expect(result.shortCode).toBe("BA");
    });
  });

  describe("Different max scores", () => {
    test("should normalize 180/200 to Excellent", () => {
      const result = getExamCategory(180, 200);
      expect(result.category).toBe("Excellent"); // 90%
    });

    test("should normalize 9/10 to Excellent", () => {
      const result = getExamCategory(9, 10);
      expect(result.category).toBe("Excellent"); // 90%
    });

    test("should normalize 5/10 to Average", () => {
      const result = getExamCategory(5, 10);
      expect(result.category).toBe("Average"); // 50%
    });
  });

  describe("Color and styling", () => {
    test("Excellent should have green color", () => {
      const result = getExamCategory(95, 100);
      expect(result.color).toBe("#00C853");
      expect(result.bgColor).toBe("#E8F5E9");
    });

    test("Below Average should have red color", () => {
      const result = getExamCategory(40, 100);
      expect(result.color).toBe("#D32F2F");
      expect(result.bgColor).toBe("#FFEBEE");
    });
  });

  describe("Custom category bins", () => {
    const customBins = {
      "High": { min: 70 },
      "Medium": { min: 40 },
      "Low": { min: 0 }
    };

    test("should use custom bins when provided", () => {
      const result = getExamCategory(75, 100, customBins);
      expect(result.category).toBe("High");
    });

    test("should fall back to default suggestion with custom bins", () => {
      const result = getExamCategory(50, 100, customBins);
      expect(result.category).toBe("Medium");
    });
  });

  describe("Edge cases", () => {
    test("perfect score should be Excellent", () => {
      const result = getExamCategory(100, 100);
      expect(result.category).toBe("Excellent");
    });

    test("zero score should be Below Average", () => {
      const result = getExamCategory(0, 100);
      expect(result.category).toBe("Below Average");
    });

    test("boundary score 90 should be Excellent", () => {
      const result = getExamCategory(90, 100);
      expect(result.category).toBe("Excellent");
    });

    test("boundary score 89 should be Very Good", () => {
      const result = getExamCategory(89, 100);
      expect(result.category).toBe("Very Good");
    });
  });

  describe("Error handling", () => {
    test("should throw error for negative score", () => {
      expect(() => getExamCategory(-5, 100)).toThrow();
    });

    test("should throw error for score > maxScore", () => {
      expect(() => getExamCategory(150, 100)).toThrow();
    });

    test("should throw error for non-positive maxScore", () => {
      expect(() => getExamCategory(50, 0)).toThrow();
    });

    test("should throw error for non-numeric score", () => {
      expect(() => getExamCategory("invalid" as any, 100)).toThrow();
    });
  });
});

describe("formatScoreDisplay", () => {
  test("should format 95/100 correctly", () => {
    const result = formatScoreDisplay(95, 100);
    expect(result.raw).toBe("95/100");
    expect(result.normalized).toBe("95.0%");
    expect(result.category).toBe("Excellent");
    expect(result.progressPercent).toBe(95);
  });

  test("should format 5/10 correctly", () => {
    const result = formatScoreDisplay(5, 10);
    expect(result.raw).toBe("5/10");
    expect(result.normalized).toBe("50.0%");
    expect(result.displayScore).toBe("50.0%");
    expect(result.category).toBe("Average");
  });

  test("should cap progress at 100%", () => {
    const result = formatScoreDisplay(100, 100);
    expect(result.progressPercent).toBe(100);
  });
});

describe("getAllCategories", () => {
  test("should return all default categories", () => {
    const categories = getAllCategories();
    expect(categories.length).toBe(5);
    expect(categories[0].name).toBe("Excellent");
    expect(categories[4].name).toBe("Below Average");
  });

  test("each category should have required fields", () => {
    const categories = getAllCategories();
    categories.forEach(cat => {
      expect(cat).toHaveProperty("name");
      expect(cat).toHaveProperty("min");
      expect(cat).toHaveProperty("color");
      expect(cat).toHaveProperty("bg");
    });
  });
});

describe("validateCategoryConfig", () => {
  test("should validate correct config", () => {
    const config = {
      "High": { min: 70 },
      "Low": { min: 0 }
    };
    expect(validateCategoryConfig(config)).toBe(true);
  });

  test("should reject invalid config with negative min", () => {
    const config = {
      "High": { min: -5 }
    };
    expect(validateCategoryConfig(config)).toBe(false);
  });

  test("should reject null config", () => {
    expect(validateCategoryConfig(null as any)).toBe(false);
  });
});

describe("Test case runner", () => {
  test("all test cases should pass", () => {
    const testCases = getTestCases();
    testCases.forEach(tc => {
      const result = getExamCategory(tc.score, tc.maxScore);
      expect(result.category).toBe(tc.expected);
    });
  });
});
