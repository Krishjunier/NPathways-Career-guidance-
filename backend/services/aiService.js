const dotenv = require("dotenv");
dotenv.config();

const Groq = require("groq-sdk");

// Initialize Groq client lazy or with check
let groq;
try {
    groq = new Groq({
        apiKey: process.env.GROQ_API_KEY || process.env.groq_api_key,
    });
} catch (e) {
    console.warn("Groq Init Warning:", e.message);
}

/**
 * Generate career suggestion using Groq LLM
 * @param {Object} profile - User profile data
 * @param {Array} answers - Array of answer objects {question, answer, category}
 * @returns {Promise<Object>} - Structrued recommendation
 */
async function getAICareerSuggestion(profile, answers, aggregates = null, plan = 'free') {
    try {
        // console.log("Checking API Key:", process.env.groq_api_key ? "Present" : "Missing");
        // if (!process.env.groq_api_key) throw new Error("API Key Missing"); // Bypass check as we hardcoded fallback above for robustness

        let planContext = "";
        if (plan === 'compass') {
            planContext = `
            USER IS A PREMIUM 'COMPASS' SUBSCRIBER.
            - Provide extremely detailed and personalized insights.
            - Focus deeply on Leadership potential, Stress management, and Creative conceptualization based on their answers.
            - The "description" should be 4-5 sentences, very specific to their psychometric profile.
            - Suggest 5 "nextSteps" instead of 3-4.
            `;
        } else if (plan === 'clarity') {
            planContext = `
            USER IS A 'CLARITY' BUNDLE SUBSCRIBER.
            - Provide enhanced detailed insights.
            - Focus on Work Style and Learning Style fit.
            - The "description" should be 3-4 sentences.
            `;
        } else {
            planContext = `
            USER IS A FREE TIER USER.
            - Provide standard, concise, high-quality guidance.
            `;
        }

        const systemPrompt = `
      You are an expert Career Counsellor AI.
      Analyze the user's psychometric test results (RIASEC, Intelligence, Emotional, Personality, Behavioral) and profile.
      ${planContext}
      
      Generate a detailed career recommendation JSON containing:
      1. domain: The most suitable career field (e.g., "Data Science", "Digital Marketing").
      2. roles: Array of exactly 5 specific job titles.
      3. courses: Array of objects [{ "name": "Course Name", "duration": "Duration (e.g. 3-4 Years)", "details": "Brief description of the course scope and value" }] based on their "Target Country".
      4. description: A personalized explanation of why this fits them.
      5. skills: Array of top 5 skills they should learn.
      6. nextSteps: Array of actionable next steps.
      7. colleges: Array of exactly 15 top colleges/universities [{ "name": "University Name", "course": "Specific Degree/Program", "country": "Country Name" }] located specifically in the user's "targetCountry" (or globally if not specified).
      8. projects: Array of 3 relevant real-world projects [{ "title": "Project Title", "link": "" }] that would strengthen their portfolio.
      
      CRITICAL INSTRUCTION:
      - You MUST prioritize the user's "goal" (e.g., Job, Research, Entrepreneurship) when suggesting roles and courses.
      - You MUST STICTLY recommend colleges/courses in the user's "targetCountry". If "targetCountry" is "Any" or null, suggest top global options.
      - Use the provided "Test Aggregates" (scores out of 10) to refine the personality analysis.
      - Output JSON ONLY. No markdown, no conversational text.
    `;

        // Format inputs for the prompt
        const profileSummary = JSON.stringify(profile);

        // Resolve Goal and Target Country logic
        const resolvedGoal = profile.goal || profile.careerGoal || profile['12thGoal'] || profile['UGGoal'] || profile['MasterGoal'] || "Not specified";
        const resolvedTargetCountry = profile.targetCountry || profile['12thTargetCountry'] || profile['UGTargetCountry'] || profile['MasterTargetCountry'] || profile.workTargetCountry || "Not specified";

        const answersSummary = answers
            .map((a) => `[${a.category || "General"}] Q: ${a.question} -> A: ${a.answer}`)
            .join("\n");

        const aggregatesSummary = aggregates ? JSON.stringify(aggregates) : "Not available";

        const userMessage = `
      User Profile: ${profileSummary}
      Goal: ${resolvedGoal}
      Target Country: ${resolvedTargetCountry}
      
      Education Level: ${profile.educationLevel || "Not specified"}
      Current Course/Major: ${profile.educationCourse || profile.ugCourse || profile.course || "Not specified"}
      Current College/School: ${profile.college || profile.ugCollege || profile.childCollege || profile.childSchool || "Not specified"}
      
      Test Aggregates (Scores / 10):
      ${aggregatesSummary}

      Test Responses:
      ${answersSummary}
      
      Based on this, what is the best career path?
    `;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
        return result;
    } catch (error) {
        console.error("AI Service Error:", JSON.stringify(error.error || error, null, 2));
        // Fallback to basic rule-based or empty suggestion if AI fails
        // Return null to indicate no AI suggestion available
        return null;
    }
}

module.exports = {
    getAICareerSuggestion,
};
