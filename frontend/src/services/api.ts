// src/services/api.ts
import axios, { AxiosInstance, AxiosResponse } from "axios";

/**
 * Frontend API service for Career Counselling app
 * - Normalizes question shape so front-end code can rely on `question: string`
 * - Adds getUserProfile (used by ResearchPage)
 * - Provides aliases to maintain backward compatibility
 */

// Base URL (fallback to localhost if env var missing)
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "https://npathways-career-guidance.onrender.com").replace(/\/$/, "");

const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("cc_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed network errors
    if (error.message === "Network Error") {
      console.error("🚨 Network Error: Backend might be down or CORS issue.");
    }
    return Promise.reject(error);
  }
);

const handleResponse = <T = any>(res: AxiosResponse<T>): T => res.data;

const handleError = (err: any, context = "api") => {
  const server = err?.response?.data;
  const message =
    server?.message || server?.error || err?.message || "Unknown error";
  console.error(`API error [${context}]`, err?.response || err);
  // Throw a proper Error instance and attach raw response for debugging
  const e = new Error(message);
  // attach raw error for callers that need it
  (e as any).raw = err;
  throw e;
};

// ---------- Types ----------
export type UserRegistrationData = {
  name: string;
  email: string;
  phone: string;
  class_status?: string;
  status?: string;
  // extras:
  studentStage?: string;
  stream?: string;
  academicPercent?: string;
  experienceYears?: string;
  currentDomain?: string;
  targetCountry?: string;
  timeline?: string;
  goal?: string;
};

export type RawQuestion = {
  id?: string;
  question?: string;
  text?: string;
  options?: string[];
  type?: string;
};

export type TestQuestion = {
  id: string;
  question: string; // normalized, guaranteed
  options?: string[];
};

export type TestAnswer = {
  questionId: string;
  answer: string | number | string[];
};

export type ChatResponse = {
  message: string;
  showEndGoalForm?: boolean;
  nextStage?: string;
  profileDraft?: Record<string, any>;
};

// ---------- API Service ----------
export const apiService = {
  // ----------------------
  // Auth / Registration
  // ----------------------
  /**
   * Send OTP for Login/Register (Email-based)
   */
  async sendOTP(data: { email: string; name?: string; phone?: string; class_status?: string }) {
    try {
      const res = await apiClient.post("/auth/send-otp", data);
      return handleResponse(res);
    } catch (err) {
      handleError(err, "sendOTP");
    }
  },

  /**
   * Verify OTP (Email-based)
   */
  async verifyOTP(email: string, otp: string) {
    try {
      const res = await apiClient.post("/auth/verify-otp", {
        email,
        otp,
      });
      return handleResponse(res);
    } catch (err) {
      handleError(err, "verifyOTP");
    }
  },

  /**
   * Guest Login (Start without OTP)
   */
  async guestLogin(payload: { name: string; email?: string; phone?: string; class_status?: string }) {
    try {
      const res = await apiClient.post("/auth/guest-login", payload);
      return handleResponse(res);
    } catch (err) {
      handleError(err, "guestLogin");
    }
  },

  /**
   * Request Free Counselling - Sends email to admin
   */
  async requestCounselling() {
    try {
      // Get userId from localStorage as fallback if token is expired
      let userId = '';
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('cc_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          userId = user.userId || user.id || user._id;
        }
      }

      const res = await apiClient.post("/auth/request-counselling", { userId });
      return handleResponse(res);
    } catch (err) {
      handleError(err, "requestCounselling");
    }
  },

  /**
   * Get Dashboard Data (User + Plan + Status)
   */
  async getDashboard(userId: string) {
    try {
      const [userRes, portfolioRes] = await Promise.all([
        this.getUserProfile(userId).catch(() => ({})),
        this.getPortfolioData(userId).catch(() => ({}))
      ]);

      const user = userRes?.user || userRes || {};
      const portfolio = portfolioRes?.portfolio || {};
      const testResults = portfolio.testResults || [];
      const careerSuggestion = portfolio.careerSuggestion;

      const isFreeTestComplete = !!(careerSuggestion?.domain || testResults.length > 0);

      // Determine Plan
      let plan = user.plan || 'free';
      const bundles = user.purchasedBundles || [];
      if (bundles.includes('compass_bundle')) plan = 'compass';
      else if (bundles.includes('clarity_bundle')) plan = 'clarity';

      if (typeof window !== 'undefined') {
        const localPlan = localStorage.getItem(`premium_plan_${userId}`);
        const hasGenericPremium = localStorage.getItem(`premium_${userId}`);
        if (localPlan === 'compass_bundle') plan = 'compass';
        else if (localPlan === 'clarity_bundle') plan = 'clarity';
        else if (hasGenericPremium && plan === 'free') plan = 'clarity';
      }

      return {
        user: { ...user, id: userId },
        testStatus: {
          isFreeTestComplete,
          personalityScore: 0,
          aptitudeScore: 0,
          interestScore: 0
        },
        plan
      };
    } catch (err) {
      handleError(err, "getDashboard");
    }
  },

  /* Legacy - mapped to new flow */
  async registerUser(payload: UserRegistrationData) {
    return this.sendOTP({
      email: payload.email,
      name: payload.name,
      phone: payload.phone,
      class_status: payload.class_status || payload.status
    });
  },

  async sendMessage(content: string, stage: string, profileDraft: Record<string, any>): Promise<ChatResponse> {
    try {
      const res = await apiClient.post("/chat/message", { message: content, stage, profileDraft });
      return handleResponse<ChatResponse>(res);
    } catch (err) {
      handleError(err, "sendMessage");
      throw err; // Ensure error propagates
    }
  },

  async updateProfile(userId: string, profile: any) {
    try {
      const res = await apiClient.post("/auth/update-profile", {
        userId,
        profile,
      });
      return handleResponse(res);
    } catch (err) {
      handleError(err, "updateProfile");
    }
  },

  async getUserProfile(userId: string) {
    try {
      const res = await apiClient.get(`/profile/${encodeURIComponent(userId)}`);
      return handleResponse(res);
    } catch (err) {
      handleError(err, "getUserProfile");
    }
  },

  // ----------------------
  // Questions / Test
  // ----------------------
  /**
   * Get questions and normalize shape:
   * returns TestQuestion[] where `question` is always a string (never undefined).
   * Accepts optional `type` query param (e.g. 'riasec', 'intelligence', 'emotional').
   */
  async getTestQuestions(type?: string): Promise<TestQuestion[]> {
    try {
      const url = type ? `/test/questions?type=${encodeURIComponent(type)}` : "/test/questions";
      const res = await apiClient.get(url);
      const data = handleResponse(res);

      // data might be an array or { questions: [...] }
      let raw: RawQuestion[] = [];
      if (Array.isArray(data)) raw = data;
      else if (Array.isArray((data as any).questions)) raw = (data as any).questions;
      else raw = [];

      // Normalize each item: ensure id and question exist
      const normalized: TestQuestion[] = raw
        .map((r, idx) => {
          if (!r) return { id: `q-${idx}`, question: `Question ${idx + 1}` };
          const id = (r.id as string) || `q-${idx}`;
          const questionText = (r.question ?? r.text ?? "").toString().trim();
          return {
            id,
            question: questionText || `Question ${idx + 1}`,
            options: Array.isArray(r.options) ? r.options : undefined,
          };
        });

      return normalized;
    } catch (err) {
      handleError(err, "getTestQuestions");
      return [];
    }
  },

  // alias for legacy code
  async getQuestions(type?: string) {
    return this.getTestQuestions(type);
  },

  /**
   * Submit test answers.
   * Uses POST /test/submit with { userId, answers } shape (server in your repo accepts this).
   */
  async submitTest(userId: string, answers: TestAnswer[]) {
    try {
      const res = await apiClient.post("/test/submit", { userId, answers });
      return handleResponse(res);
    } catch (err) {
      handleError(err, "submitTest");
    }
  },

  async submitTestAnswers(userId: string, answers: TestAnswer[]) {
    return this.submitTest(userId, answers);
  },

  async getTestResults(userId: string) {
    try {
      const res = await apiClient.get(`/test/results/${encodeURIComponent(userId)}`);
      return handleResponse(res);
    } catch (err) {
      handleError(err, "getTestResults");
    }
  },

  // ----------------------
  // Reports / Scholarships
  // ----------------------
  async getCareerReport(userId: string) {
    try {
      const res = await apiClient.get(`/report/career-guidance/${encodeURIComponent(userId)}`);
      return handleResponse(res);
    } catch (err) {
      handleError(err, "getCareerReport");
    }
  },



  // ----------------------
  // Portfolio & exports
  // ----------------------
  async getPortfolioData(userId: string) {
    try {
      const res = await apiClient.get(`/portfolio/data/${encodeURIComponent(userId)}`);
      return handleResponse(res);
    } catch (err) {
      handleError(err, "getPortfolioData");
    }
  },

  async refreshPortfolioData(userId: string) {
    try {
      const res = await apiClient.get(`/portfolio/data/${encodeURIComponent(userId)}?refresh=true`);
      return handleResponse(res);
    } catch (err) {
      handleError(err, "refreshPortfolioData");
    }
  },

  getPortfolioPDFUrl(userId: string): string {
    return `${API_BASE_URL}/api/portfolio/generate/${encodeURIComponent(userId)}`;
  },

  async downloadPortfolioPDF(userId: string): Promise<Blob> {
    try {
      const res = await apiClient.get(`/portfolio/generate/${encodeURIComponent(userId)}`, { responseType: "blob" });
      return res.data as Blob;
    } catch (err) {
      handleError(err, "downloadPortfolioPDF");
      throw err;
    }
  },

  getExcelExportUrl(userId: string): string {
    return `${API_BASE_URL}/api/export/excel/${encodeURIComponent(userId)}`;
  },

  async downloadExcel(userId: string): Promise<Blob> {
    try {
      const res = await apiClient.get(`/export/excel/${encodeURIComponent(userId)}`, { responseType: "blob" });
      return res.data as Blob;
    } catch (err) {
      handleError(err, "downloadExcel");
      throw err;
    }
  },

  async listExportFiles(userId: string) {
    try {
      try {
        const r = await apiClient.get(`/export/files/${encodeURIComponent(userId)}`);
        return handleResponse(r);
      } catch (e) {
        const r2 = await apiClient.get(`/export/files?userId=${encodeURIComponent(userId)}`);
        return handleResponse(r2);
      }
    } catch (err) {
      handleError(err, "listExportFiles");
    }
  },

  async deleteExportFile(fileId: string) {
    try {
      const res = await apiClient.delete(`/export/files/${encodeURIComponent(fileId)}`);
      return handleResponse(res);
    } catch (err) {
      handleError(err, "deleteExportFile");
    }
  },

  // ----------------------
  // Courses / counselling
  // ----------------------
  async getRecommendedCourses(userId: string) {
    try {
      const res = await apiClient.get(`/courses/${encodeURIComponent(userId)}`);
      return handleResponse(res);
    } catch (err) {
      handleError(err, "getRecommendedCourses");
    }
  },

  async getCounsellingData(userId: string) {
    try {
      const res = await apiClient.get(`/counselling/${encodeURIComponent(userId)}`);
      return handleResponse(res);
    } catch (err) {
      handleError(err, "getCounsellingData");
    }
  },

  // ----------------------
  // Research & extras
  // ----------------------
  async submitResearch(userId: string, researchData: any) {
    try {
      const res = await apiClient.post("/research", { userId, ...researchData });
      return handleResponse(res);
    } catch (err) {
      handleError(err, "submitResearch");
    }
  },

  async getExtras(userId: string) {
    try {
      const res = await apiClient.get(`/extras/${encodeURIComponent(userId)}`);
      return handleResponse(res);
    } catch (err) {
      handleError(err, "getExtras");
    }
  },

  async recordPayment(userId: string, item: string, amount: number) {
    try {
      const res = await apiClient.post("/payment/success", { userId, item, amount });
      return handleResponse(res);
    } catch (err) {
      handleError(err, "recordPayment");
    }
  },

  async getResearch(userId: string) {
    try {
      try {
        const r = await apiClient.get(`/research?userId=${encodeURIComponent(userId)}`);
        return handleResponse(r);
      } catch (e) {
        return this.getExtras(userId);
      }
    } catch (err) {
      handleError(err, "getResearch");
    }
  },

  // ----------------------
  // Utilities
  // ----------------------
  normalizePortfolio(raw: any) {
    return {
      personalInfo:
        raw?.personalInfo ||
        raw?.profile?.personalInfo || {
          name: "Unknown",
          email: "",
          phone: "",
          status: "",
        },
      educationalBackground: raw?.educationalBackground || raw?.education || raw?.profile?.education,
      professionalBackground: raw?.professionalBackground || raw?.profile?.professional,
      careerSuggestion: raw?.careerSuggestion || raw?.career || raw?.profile?.careerSuggestion || {
        domain: "N/A",
        roles: [],
        courses: [],
        description: "",
      },
      testResults: raw?.testResults || raw?.profile?.testResults || [],
      skills: raw?.skills || raw?.profile?.skills || [],
      projects: raw?.projects || raw?.profile?.projects || [],
      generatedAt: raw?.generatedAt || raw?.profile?.generatedAt || new Date().toISOString(),
    };
  },
};

export default apiService;
