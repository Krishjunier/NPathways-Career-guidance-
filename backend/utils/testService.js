// backend/utils/testService.js

// Unified Likert options used across assessments
const LIKERT = [
  "Strongly Agree",
  "Agree",
  "Neutral",
  "Disagree",
  "Strongly Disagree",
];

// 1) Holland RIASEC questions
const RIASEC_QUESTIONS = [
  {
    id: 101,
    question: "I enjoy working with tools, machines, or physical objects.",
    options: LIKERT,
    category: "RIASEC_R",
  },
  {
    id: 102,
    question: "I like solving math or science problems.",
    options: LIKERT,
    category: "RIASEC_I",
  },
  {
    id: 103,
    question:
      "I enjoy creative activities like drawing, writing, or designing.",
    options: LIKERT,
    category: "RIASEC_A",
  },
  {
    id: 104,
    question: "I like helping people and teaching others.",
    options: LIKERT,
    category: "RIASEC_S",
  },
  {
    id: 105,
    question: "I enjoy leading, selling, or influencing people.",
    options: LIKERT,
    category: "RIASEC_E",
  },
  {
    id: 106,
    question: "I like organizing information and following procedures.",
    options: LIKERT,
    category: "RIASEC_C",
  },
];

// 2) Multiple Intelligences questions (subset)
const MI_QUESTIONS = [
  {
    id: 201,
    question: "I can express myself clearly through writing or speaking.",
    options: LIKERT,
    category: "MI_Linguistic",
  },
  {
    id: 202,
    question: "I enjoy solving puzzles or logic problems.",
    options: LIKERT,
    category: "MI_Logical",
  },
  {
    id: 203,
    question: "I remember things better using pictures or diagrams.",
    options: LIKERT,
    category: "MI_VisualSpatial",
  },
  {
    id: 204,
    question: "I keep rhythm easily and enjoy music.",
    options: LIKERT,
    category: "MI_Musical",
  },
  {
    id: 205,
    question: "I learn best by doing and moving.",
    options: LIKERT,
    category: "MI_Bodily",
  },
  {
    id: 206,
    question: "I understand how others feel and work well in teams.",
    options: LIKERT,
    category: "MI_Interpersonal",
  },
  {
    id: 207,
    question: "I'm good at understanding my own emotions and motivations.",
    options: LIKERT,
    category: "MI_Intrapersonal",
  },
  {
    id: 208,
    question: "I notice patterns in nature and enjoy the outdoors.",
    options: LIKERT,
    category: "MI_Naturalistic",
  },
];

// 3) Emotional Intelligence questions
const EI_QUESTIONS = [
  {
    id: 301,
    question: "I can recognize my emotions as I experience them.",
    options: LIKERT,
    category: "EI_SelfAwareness",
  },
  {
    id: 302,
    question: "I stay calm under pressure or stress.",
    options: LIKERT,
    category: "EI_SelfRegulation",
  },
  {
    id: 303,
    question: "I stay motivated even when things get difficult.",
    options: LIKERT,
    category: "EI_Motivation",
  },
  {
    id: 304,
    question: "I can understand how others feel even when they don't say it.",
    options: LIKERT,
    category: "EI_Empathy",
  },
  {
    id: 305,
    question:
      "I can manage conflicts effectively and maintain good relationships.",
    options: LIKERT,
    category: "EI_SocialSkills",
  },
];

// Backward-compatible minimal set used earlier
const LEGACY_QUESTIONS = [
  {
    id: 1,
    question: "I enjoy working with numbers and data analysis",
    options: LIKERT,
    category: "analytical",
  },
  {
    id: 2,
    question: "I prefer working in teams rather than alone",
    options: LIKERT,
    category: "social",
  },
  {
    id: 3,
    question: "I enjoy creating and designing new things",
    options: LIKERT,
    category: "creative",
  },
  {
    id: 4,
    question: "I like to solve complex technical problems",
    options: LIKERT,
    category: "technical",
  },
  {
    id: 5,
    question: "I enjoy leading and managing others",
    options: LIKERT,
    category: "leadership",
  },
  {
    id: 6,
    question: "I prefer detailed, systematic work",
    options: LIKERT,
    category: "detail-oriented",
  },
  {
    id: 7,
    question: "I enjoy helping and counseling others",
    options: LIKERT,
    category: "helping",
  },
  {
    id: 8,
    question: "I like working with my hands and building things",
    options: LIKERT,
    category: "hands-on",
  },
];

// Exported unified question list
const psychometricQuestions = [
  ...RIASEC_QUESTIONS,
  ...MI_QUESTIONS,
  ...EI_QUESTIONS,
  ...LEGACY_QUESTIONS,
];

// Helper function to convert answer to score
function getScoreFromAnswer(answer) {
  const scoreMap = {
    "Strongly Agree": 5,
    Agree: 4,
    Neutral: 3,
    Disagree: 2,
    "Strongly Disagree": 1,
  };
  return scoreMap[answer] || 0;
}

// Helper function to get career recommendation by category
// Now returns empty default to avoid hardcoded non-AI suggestions
function getCareerRecommendation(category) {
  return {
    domain: "",
    roles: [],
    courses: [],
    description: "",
  };
}

// Calculate career suggestion and aggregate scores from answers
function calculateCareerSuggestion(answers) {
  if (!Array.isArray(answers) || answers.length === 0) {
    return {
      domain: "General",
      roles: [],
      courses: [],
      description: "No sufficient data to provide a recommendation.",
      aggregates: {},
    };
  }

  const scores = {
    // Legacy high-level buckets
    technical: 0,
    creative: 0,
    business: 0,
    social: 0,
    analytical: 0,
    // RIASEC
    RIASEC_R: 0,
    RIASEC_I: 0,
    RIASEC_A: 0,
    RIASEC_S: 0,
    RIASEC_E: 0,
    RIASEC_C: 0,
    // MI
    MI_Linguistic: 0,
    MI_Logical: 0,
    MI_VisualSpatial: 0,
    MI_Musical: 0,
    MI_Bodily: 0,
    MI_Interpersonal: 0,
    MI_Intrapersonal: 0,
    MI_Naturalistic: 0,
    // EI
    EI_SelfAwareness: 0,
    EI_SelfRegulation: 0,
    EI_Motivation: 0,
    EI_Empathy: 0,
    EI_SocialSkills: 0,
  };

  answers.forEach((answer) => {
    const question = psychometricQuestions.find(
      (q) => q.id === answer.questionId
    );
    if (!question) return;
    const score = getScoreFromAnswer(answer.answer);

    // Aggregate detailed buckets
    if (scores.hasOwnProperty(question.category)) {
      scores[question.category] += score;
    }

    // Map detailed to legacy buckets for domain suggestion continuity
    switch (question.category) {
      case "RIASEC_R":
      case "hands-on":
        scores.technical += score;
        break;
      case "RIASEC_I":
      case "analytical":
        scores.technical += score;
        scores.analytical += score;
        break;
      case "RIASEC_A":
      case "creative":
        scores.creative += score;
        break;
      case "RIASEC_S":
      case "helping":
      case "social":
      case "MI_Interpersonal":
        scores.social += score;
        break;
      case "RIASEC_E":
      case "leadership":
      case "detail-oriented":
        scores.business += score;
        break;
      case "RIASEC_C":
        scores.business += score;
        break;
      default:
        break;
    }
  });

  const topCategory = Object.keys({
    technical: 1,
    creative: 1,
    business: 1,
    social: 1,
    analytical: 1,
  }).reduce((a, b) => (scores[a] >= scores[b] ? a : b));

  const suggestion = getCareerRecommendation(topCategory);
  return { ...suggestion, aggregates: scores };
}

// Export all functions and data
module.exports = {
  LIKERT,
  RIASEC_QUESTIONS,
  MI_QUESTIONS,
  EI_QUESTIONS,
  LEGACY_QUESTIONS,
  psychometricQuestions,
  getScoreFromAnswer,
  getCareerRecommendation,
  calculateCareerSuggestion,
};
