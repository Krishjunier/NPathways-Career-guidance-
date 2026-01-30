// backend/routes/chat.js
const express = require("express");
const router = express.Router();

/**
 * @route POST /chat/message
 * @desc Process chat messages and return appropriate responses
 */
router.post("/message", async (req, res) => {
  try {
    const { message = "", stage = "", profileDraft = {} } = req.body;
    const msg = (message || "").toString();

    // Handle initial 'start' message
    if (msg.toLowerCase() === "start" && stage === "welcome") {
      return res.json({
        message:
          "Welcome! 👋 I'm your Career Quest Guide. Let's start by getting to know you better. What's your name?",
        nextStage: "collect_name",
      });
    }

    // Process messages based on current stage
    let response = {
      message: "",
      nextStage: stage,
      profileDraft: { ...profileDraft },
    };

    switch (stage) {
      case "collect_name":
        if (typeof message !== "string" || message.trim().length < 2) {
          response.message =
            "Please enter a valid name (at least 2 characters).";
        } else {
          response.message = `Nice to meet you, ${message.trim()}! Could you please share your email address?`;
          response.nextStage = "collect_email";
          response.profileDraft = { ...profileDraft, name: message.trim() };
        }
        break;

      case "collect_email":
        if (
          typeof message !== "string" ||
          !message.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        ) {
          response.message =
            "That doesn't look like a valid email address. Could you please check and try again?";
        } else {
          response.message =
            "Perfect! Are you a student, working professional, or looking for a job change?";
          response.nextStage = "collect_status";
          response.profileDraft = { ...profileDraft, email: message.trim() };
        }
        break;

      case "collect_status":
        {
          const statusMsg = (message || "").toString().toLowerCase();
          // Accept a few variants
          if (statusMsg.includes("student") || statusMsg.includes("stud")) {
            response.profileDraft = { ...profileDraft, status: "student" };
            response.message =
              "What's your current educational level? (e.g., 12th, UG, PG)";
            response.nextStage = "collect_student_stage";
          } else if (
            statusMsg.includes("work") ||
            statusMsg.includes("professional") ||
            statusMsg.includes("working")
          ) {
            response.profileDraft = {
              ...profileDraft,
              status: "working professional",
            };
            response.message = "How many years of work experience do you have?";
            response.nextStage = "collect_experience";
          } else if (
            statusMsg.includes("job") ||
            statusMsg.includes("change")
          ) {
            response.profileDraft = { ...profileDraft, status: "job change" };
            response.message =
              "How many years of experience do you have, and what role are you targeting?";
            response.nextStage = "collect_experience";
          } else {
            response.message =
              "Please specify: student, working professional, or looking for a job change.";
          }
        }
        break;

      case "collect_student_stage":
        {
          // Robust parsing: accept natural replies like "I'm pursuing B.Tech in Computer Science"
          const eduRaw = (message || "").toString().toLowerCase();
          let detectedStage = null;
          if (
            eduRaw.includes("12") ||
            eduRaw.includes("12th") ||
            eduRaw.includes("class 12")
          )
            detectedStage = "12th";
          else if (
            eduRaw.match(
              /b\.?tech|btech|b\.sc|bsc|be\b|bachelor|undergrad|undergraduate/
            )
          )
            detectedStage = "ug";
          else if (
            eduRaw.match(/m\.?tech|mtech|msc|master|postgrad|postgraduate|pg/)
          )
            detectedStage = "pg";

          // try to extract stream/department if mentioned: look for "in <stream>" or trailing words
          let detectedStream = null;
          const inMatch = message.match(/in\s+([a-zA-Z &()+\-0-9\.]+)/i);
          if (inMatch && inMatch[1]) {
            detectedStream = inMatch[1].trim();
          } else {
            // try common abbreviations
            if (
              eduRaw.includes("computer") ||
              eduRaw.includes("cse") ||
              eduRaw.includes("cs")
            )
              detectedStream = "Computer Science";
            else if (eduRaw.includes("ece") || eduRaw.includes("electronics"))
              detectedStream = "Electronics";
            else if (eduRaw.includes("mechanical"))
              detectedStream = "Mechanical";
          }

          if (!detectedStage) {
            // If user responded with short words like 'UG' or 'PG' not caught above
            const token = eduRaw.trim();
            if (token === "ug" || token === "u.g." || token === "undergraduate")
              detectedStage = "ug";
            else if (
              token === "pg" ||
              token === "p.g." ||
              token === "postgraduate"
            )
              detectedStage = "pg";
            else if (token === "12th" || token === "12") detectedStage = "12th";
          }

          if (!detectedStage) {
            response.message =
              "Please specify your education level more clearly (12th / UG / PG). For example: 'I'm pursuing B.Tech in Computer Science'.";
            response.nextStage = "collect_student_stage";
          } else {
            // save detected values
            response.profileDraft = {
              ...profileDraft,
              studentStage: detectedStage,
            };
            if (detectedStream)
              response.profileDraft = {
                ...response.profileDraft,
                stream: detectedStream,
              };

            // If we already have stream, move to academics; otherwise ask for stream
            if (detectedStream) {
              response.message =
                "Thanks — could you share your latest academic percentage or CGPA?";
              response.nextStage = "collect_education";
            } else {
              response.message =
                "What's your stream or field of study? (e.g., Computer Science, Electronics)";
              response.nextStage = "collect_stream";
            }
          }
        }
        break;

      case "collect_stream":
        if (typeof message !== "string" || message.trim().length < 2) {
          response.message =
            "Please enter your stream/field (e.g., Computer Science).";
          response.nextStage = "collect_stream";
        } else {
          response.profileDraft = { ...profileDraft, stream: message.trim() };
          response.message = "What's your latest academic percentage or CGPA?";
          response.nextStage = "collect_education";
        }
        break;

      case "collect_education":
        {
          const score = parseFloat(
            (message || "").toString().replace("%", "").trim()
          );
          if (isNaN(score) || score < 0 || score > 100) {
            response.message =
              "Please enter a valid percentage between 0 and 100 (e.g., 75 or 8.0 for CGPA converted to percent).";
            response.nextStage = "collect_education";
          } else {
            response.profileDraft = { ...profileDraft, academicPercent: score };
            response.nextStage = "collect_career_goals";
            response.message =
              "What are your career goals? Feel free to describe them briefly.";
            response.showEndGoalForm = true;
          }
        }
        break;

      case "collect_experience":
        {
          const years = parseFloat((message || "").toString());
          if (isNaN(years) || years < 0) {
            response.message =
              "Please enter a valid number of years (e.g., 2 or 3.5).";
            response.nextStage = "collect_experience";
          } else {
            response.message =
              "What's your current domain or industry? (e.g., Software, Finance)";
            response.nextStage = "collect_company";
            response.profileDraft = { ...profileDraft, experienceYears: years };
          }
        }
        break;

      case "collect_company":
        response.message = "What's your current/last role or position?";
        response.nextStage = "collect_role";
        response.profileDraft = { ...profileDraft, currentDomain: message };
        break;

      case "collect_role":
        response.message =
          "Please share your career goals. Feel free to describe them briefly.";
        response.nextStage = "collect_career_goals";
        response.profileDraft = { ...profileDraft, currentRole: message };
        response.showEndGoalForm = true;
        break;

      case "collect_career_goals":
        response.message =
          "Thank you for sharing! I'll now analyze your profile and provide personalized career guidance. Would you like to take our career assessment test to get more detailed insights?";
        response.nextStage = "info_complete";
        response.profileDraft = {
          ...profileDraft,
          careerGoals: message,
          completed: true,
        };
        break;

      default:
        response.message =
          "I'm sorry, I couldn't process that. Could you please try again?";
    }

    res.json(response);
  } catch (error) {
    console.error("Chat processing error:", error);
    res.status(500).json({
      message: "Sorry, I encountered an error. Please try again.",
      error: error.message,
    });
  }
});

module.exports = router;
