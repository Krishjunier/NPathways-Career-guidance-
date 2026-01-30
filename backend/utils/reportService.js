// backend/utils/reportService.js

/**
 * Generate a career guidance report
 * @param {Object} user - User object
 * @param {Object} testResponse - Test response with careerSuggestion
 * @returns {Object} Career guidance report
 */
const generateCareerReport = (user, testResponse) => {
  const suggestion = testResponse?.careerSuggestion || {};

  return {
    personalInfo: {
      name: user.name || "",
      email: user.email || "",
      status: user.class_status || "",
    },
    careerGuidance: {
      recommendedDomain: suggestion.domain || "",
      suggestedRoles: Array.isArray(suggestion.roles) ? suggestion.roles : [],
      recommendedCourses: Array.isArray(suggestion.courses)
        ? suggestion.courses
        : [],
      description: suggestion.description || "",
    },
    nextSteps: Array.isArray(suggestion.nextSteps) ? suggestion.nextSteps : [],
    skills: Array.isArray(suggestion.skills) ? suggestion.skills : [],
    projects: Array.isArray(suggestion.projects) ? suggestion.projects : [],
    aggregates: suggestion.aggregates || undefined,
    generatedAt: new Date(),
  };
};

/**
 * Get dynamic scholarship options based on user profile
 * @param {Object} user - User object with class_status, interests, aptitude
 * @returns {Array} List of scholarships
 */
const getScholarshipOptions = (user) => {
  const scholarships = [
    // --- Students ---
    {
      name: "Merit Scholarship Program",
      amount: "₹50,000 - ₹2,00,000",
      eligibility: "Students with 85%+ marks",
      deadline: "March 31, 2025",
      type: "Academic Excellence",
      target: "Student",
      domains: ["Tech", "Business", "Creative"],
    },
    {
      name: "STEM Education Grant",
      amount: "₹1,00,000 - ₹3,00,000",
      eligibility: "Science & Tech students",
      deadline: "April 15, 2025",
      type: "Subject Specific",
      target: "Student",
      domains: ["Tech"],
    },
    {
      name: "Need-Based Financial Aid",
      amount: "₹25,000 - ₹1,50,000",
      eligibility: "Family income < ₹5 LPA",
      deadline: "May 30, 2025",
      type: "Financial Support",
      target: "Student",
      domains: ["Tech", "Business", "Creative", "Skilled"],
    },
    // --- Workers ---
    {
      name: "Professional Development Grant",
      amount: "₹30,000 - ₹1,00,000",
      eligibility: "Working professionals",
      deadline: "June 30, 2025",
      type: "Skill Enhancement",
      target: "Worker",
      domains: ["Tech", "Business"],
    },
    {
      name: "Career Transition Support",
      amount: "₹50,000 - ₹2,00,000",
      eligibility: "Career changers",
      deadline: "July 15, 2025",
      type: "Career Change",
      target: "Worker",
      domains: ["Business", "Creative"],
    },
  ];

  // Filter scholarships by user class_status and optional interests/domains
  const filtered = scholarships.filter((sch) => {
    if (sch.target !== user.class_status) return false;
    // Optional: filter by domain if user has careerSuggestion
    if (
      user.careerSuggestion &&
      user.careerSuggestion.domain &&
      !sch.domains.includes(user.careerSuggestion.domain)
    ) {
      return false;
    }
    return true;
  });

  return filtered;
};

// Simple college/course recommendation by country + status
const getCollegeRecommendations = (user) => {
  // Removed hardcoded defaults.
  // In future this should be populated by AI or a real database.
  return [];
};

module.exports = {
  generateCareerReport,
  getScholarshipOptions,
  getCollegeRecommendations,
};
