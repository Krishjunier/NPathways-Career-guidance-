// backend/utils/pdfGenerator.js
const { jsPDF } = require("jspdf");

/**
 * Generate Career Counselling Portfolio PDF
 * A professional, "Modern Premium" styled report.
 */
const generatePDF = async (user = {}, testResponse = {}) => {
  try {
    const doc = new jsPDF({
      unit: "pt",
      format: "a4",
    });

    const PAGE_WIDTH = doc.internal.pageSize.width; // ~595 pt
    const PAGE_HEIGHT = doc.internal.pageSize.height; // ~842 pt
    const MARGIN = 40;

    // Theme Colors (RGB)
    const COLOR_PRIMARY = [99, 102, 241]; // Indigo 500 (#6366f1)
    const COLOR_SECONDARY = [15, 23, 42]; // Slate 900 (#0f172a)
    const COLOR_ACCENT = [20, 184, 166];  // Teal 500 (#14b8a6)
    const COLOR_LIGHT_BG = [241, 245, 249]; // Slate 100 (#f1f5f9)
    const COLOR_TEXT_MAIN = [51, 65, 85];   // Slate 700
    const COLOR_TEXT_LIGHT = [100, 116, 139]; // Slate 500

    let y = 0;

    // --- Helpers ---

    const checkPageBreak = (neededHeight) => {
      if (y + neededHeight > PAGE_HEIGHT - MARGIN) {
        doc.addPage();
        y = MARGIN;
        return true;
      }
      return false;
    };

    const drawHeader = () => {
      // Branding Header Box
      doc.setFillColor(...COLOR_SECONDARY);
      doc.rect(0, 0, PAGE_WIDTH, 120, "F");

      // App Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text("Career Guidance Report", MARGIN, 60);

      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(200, 200, 200);
      doc.text("Comprehensive Analysis & Recommendations", MARGIN, 85);

      // Date on right
      doc.setFontSize(10);
      doc.text(new Date().toLocaleDateString(), PAGE_WIDTH - MARGIN - 60, 60);

      // Decorative Line
      doc.setDrawColor(...COLOR_PRIMARY);
      doc.setLineWidth(3);
      doc.line(MARGIN, 100, MARGIN + 100, 100);

      y = 150;
    };

    const drawSectionTitle = (title, iconChar = "") => {
      checkPageBreak(60);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...COLOR_PRIMARY);
      doc.text(title.toUpperCase(), MARGIN, y);

      // Underline
      doc.setDrawColor(...COLOR_LIGHT_BG);
      doc.setLineWidth(1);
      doc.line(MARGIN, y + 8, PAGE_WIDTH - MARGIN, y + 8);

      doc.setDrawColor(...COLOR_PRIMARY);
      doc.setLineWidth(2);
      doc.line(MARGIN, y + 8, MARGIN + 50, y + 8);

      y += 30;
    };

    const drawInfoRow = (label, value) => {
      // Simple row: Label ...... Value
      checkPageBreak(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...COLOR_TEXT_MAIN);
      doc.text(label, MARGIN, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const valStr = String(value || "—");
      doc.text(valStr, MARGIN + 120, y);

      y += 18;
    };

    const drawGridItem = (label, value, x, yPos, width) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...COLOR_TEXT_LIGHT);
      doc.text(label.toUpperCase(), x, yPos);

      doc.setFont("helvetica", "bold"); // Value bold for emphasis
      doc.setFontSize(11);
      doc.setTextColor(...COLOR_SECONDARY);
      const valStr = String(value || "—");

      // Text wrap value
      const splitVal = doc.splitTextToSize(valStr, width);
      doc.text(splitVal, x, yPos + 14);

      return splitVal.length * 14; // return height used
    };

    // --- Data Preparation ---
    // Ensure we look in the right places for normalized data
    const profile = user.profile || {};
    const otherFields = profile.otherProfileFields || {};

    // Normalize logic similar to original but safer
    const getData = (key, fallback = "") => {
      return profile[key] || otherFields[key] || user[key] || fallback;
    };

    const personalInfo = {
      name: getData("name", "User"),
      email: getData("email"),
      phone: getData("phone"),
      status: getData("class_status") || getData("status"),
    };

    // Education Data
    const edu = {
      studentType: getData("studentType"),
      stream: getData("stream"),
      desiredCourse: getData("desiredCourse"),
      studyCountry: getData("studyCountry"),
      completionYear: getData("completionYear"),
    };

    // --- RENDER ---

    drawHeader();

    // 1. Personal Profile Box
    drawSectionTitle("Personal Profile");

    // Draw a light grey box for personal info
    const infoBoxHeight = 80;
    doc.setFillColor(...COLOR_LIGHT_BG);
    doc.roundedRect(MARGIN, y, PAGE_WIDTH - (MARGIN * 2), infoBoxHeight, 5, 5, "F");

    let infoY = y + 25;
    // 2-column layout
    drawGridItem("Full Name", personalInfo.name, MARGIN + 20, infoY, 200);
    drawGridItem("Email Address", personalInfo.email, MARGIN + 250, infoY, 200);

    infoY += 35;
    drawGridItem("Current Status", personalInfo.status, MARGIN + 20, infoY, 200);
    drawGridItem("Phone Number", personalInfo.phone, MARGIN + 250, infoY, 200);

    y += infoBoxHeight + 30;

    // 2. Career Recommendation (Highlight)
    const suggestion = testResponse.careerSuggestion || {};
    if (suggestion.domain) {
      drawSectionTitle("Career Recommendation");

      // Hero Box for Domain
      doc.setFillColor(...COLOR_PRIMARY);
      doc.roundedRect(MARGIN, y, PAGE_WIDTH - (MARGIN * 2), 60, 5, 5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("Recommended Domain", MARGIN + 20, y + 20);

      doc.setFontSize(18);
      doc.text(suggestion.domain, MARGIN + 20, y + 45);

      y += 80;

      // Description
      if (suggestion.description) {
        checkPageBreak(50);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(...COLOR_TEXT_MAIN);
        const descLines = doc.splitTextToSize(suggestion.description, PAGE_WIDTH - (MARGIN * 2));
        doc.text(descLines, MARGIN, y);
        y += (descLines.length * 16) + 20;
      }

      // Roles & Courses (2 col)
      // 2b. Suggested Roles
      if (suggestion.roles && suggestion.roles.length) {
        checkPageBreak(100);
        drawSectionTitle("Suggested Roles");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(...COLOR_TEXT_MAIN);

        // Render roles in two columns or a clean list
        let roleY = y;
        suggestion.roles.forEach((role, i) => {
          doc.setFillColor(...COLOR_PRIMARY);
          doc.circle(MARGIN + 5, roleY - 4, 3, "F");
          doc.text(role, MARGIN + 15, roleY);
          roleY += 20;
        });
        y = roleY + 30;
      }

      // 2c. Recommended Courses (Detailed)
      if (suggestion.courses && suggestion.courses.length) {
        checkPageBreak(150);
        drawSectionTitle("Recommended Courses");

        suggestion.courses.forEach((course, i) => {
          checkPageBreak(60);

          // Handle both string (legacy) and object (new) formats
          let name = "";
          let duration = "";
          let details = "";

          if (typeof course === 'string') {
            name = course;
          } else {
            name = course.name || "Unknown Course";
            duration = course.duration || "";
            details = course.details || "";
          }

          // Course Box
          doc.setFillColor(...COLOR_LIGHT_BG);
          doc.roundedRect(MARGIN, y, PAGE_WIDTH - (MARGIN * 2), details ? 55 : 35, 3, 3, "F");

          // Course Name
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(...COLOR_SECONDARY);
          doc.text(name, MARGIN + 10, y + 20);

          // Duration Badge (right aligned)
          if (duration) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(...COLOR_ACCENT);
            doc.text(duration, PAGE_WIDTH - MARGIN - 10, y + 20, { align: "right" });
          }

          // Details
          if (details) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(...COLOR_TEXT_LIGHT);
            const detailLines = doc.splitTextToSize(details, PAGE_WIDTH - (MARGIN * 2) - 20);
            doc.text(detailLines, MARGIN + 10, y + 40);
          }

          y += (details ? 70 : 50);
        });

        y += 20;
      }

      // 2d. Recommended Colleges (New)
      if (suggestion.colleges && suggestion.colleges.length) {
        checkPageBreak(150);
        drawSectionTitle("Recommended Colleges", "University");

        suggestion.colleges.forEach((col, i) => {
          checkPageBreak(50);

          let cName = col.college || col.name || "University";
          let cCourse = col.course || "";
          let cCountry = col.country || "";

          // Draw simpler row for College
          doc.setFillColor(...(i % 2 === 0 ? COLOR_LIGHT_BG : [255, 255, 255]));
          doc.rect(MARGIN, y, PAGE_WIDTH - (MARGIN * 2), 40, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(...COLOR_SECONDARY);
          doc.text(cName, MARGIN + 10, y + 15);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(...COLOR_TEXT_MAIN);
          doc.text(cCourse, MARGIN + 10, y + 30);

          if (cCountry) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(...COLOR_PRIMARY);
            doc.text(cCountry, PAGE_WIDTH - MARGIN - 10, y + 22, { align: "right" });
          }

          y += 45;
        });
        y += 20;
      }

      // 2e. Skills (New)
      if (suggestion.skills && suggestion.skills.length) {
        checkPageBreak(80);
        drawSectionTitle("Key Skills");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...COLOR_TEXT_MAIN);

        // Render as comma separated list or bullet points
        const skillText = suggestion.skills.join(", ");
        const lines = doc.splitTextToSize(skillText, PAGE_WIDTH - (MARGIN * 2));
        doc.text(lines, MARGIN, y);
        y += (lines.length * 15) + 30;
      }

      // 2f. Projects (New)
      if (suggestion.projects && suggestion.projects.length) {
        checkPageBreak(100);
        drawSectionTitle("Recommended Projects");

        suggestion.projects.forEach((proj, i) => {
          checkPageBreak(40);
          const pTitle = proj.title || `Project ${i + 1}`;
          const pLink = proj.link || "";

          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(...COLOR_ACCENT);
          doc.text(pTitle, MARGIN + 10, y + 10);

          if (pLink) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(...COLOR_PRIMARY);
            doc.textWithLink("View Code / Demo", MARGIN + 10, y + 22, { url: pLink });
          }
          y += 35;
        });
        y += 20;
      }

    }

    // 3. Education Profile
    drawSectionTitle("Education Profile");
    const eduLabels = [
      { l: "Student Type", v: edu.studentType },
      { l: "Stream", v: edu.stream },
      { l: "Desired Course", v: edu.desiredCourse },
      { l: "Study Country", v: edu.studyCountry },
      { l: "Completion Year", v: edu.completionYear },
    ];

    eduLabels.forEach(item => {
      if (item.v) drawInfoRow(item.l, item.v);
    });

    // Add extra spacing if we printed anything
    if (eduLabels.some(i => i.v)) y += 20;


    // 4. Exam Scores (Table)
    // Extract normalized exam scores
    const examScoresObj = profile.examScores || {};
    const exams = [];
    if (examScoresObj.english && examScoresObj.english.score) exams.push({ ...examScoresObj.english, name: "English" });
    if (examScoresObj.aptitude && examScoresObj.aptitude.score) exams.push({ ...examScoresObj.aptitude, name: "Aptitude" });

    if (exams.length > 0) {
      drawSectionTitle("Exam Scores");

      // Table Header
      doc.setFillColor(...COLOR_SECONDARY);
      doc.rect(MARGIN, y, PAGE_WIDTH - (MARGIN * 2), 25, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("Exam", MARGIN + 10, y + 17);
      doc.text("Score", MARGIN + 200, y + 17);
      doc.text("Percentage", MARGIN + 350, y + 17);
      y += 25;

      // Table Rows
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLOR_TEXT_MAIN);

      exams.forEach((ex, i) => {
        if (i % 2 === 0) doc.setFillColor(245, 247, 250); // stripe
        else doc.setFillColor(255, 255, 255);

        doc.rect(MARGIN, y, PAGE_WIDTH - (MARGIN * 2), 25, "F");

        const name = ex.name || ex.exam || "Exam";
        const score = String(ex.score || "—");
        const pct = String(ex.percentage || "—") + "%";

        doc.text(name, MARGIN + 10, y + 17);
        doc.text(score, MARGIN + 200, y + 17);
        doc.text(pct, MARGIN + 350, y + 17);
        y += 25;
      });
      y += 30;
    }

    // 5. Test Responses (Q&A)
    if (testResponse.answers && (Array.isArray(testResponse.answers) || Object.keys(testResponse.answers).length)) {
      drawSectionTitle("Assessment Responses");

      let answers = [];
      if (Array.isArray(testResponse.answers)) {
        answers = testResponse.answers;
      } else {
        answers = Object.entries(testResponse.answers).map(([k, v]) => ({
          question: isNaN(k) ? k : `Question ${k}`,
          answer: v
        }));
      }

      answers.forEach((ans, i) => {
        const qText = ans.question || `Question ${i + 1}`;
        const aText = typeof ans.answer === 'string' ? ans.answer : JSON.stringify(ans.answer);

        if (!aText) return;

        checkPageBreak(50);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...COLOR_PRIMARY);

        const qLines = doc.splitTextToSize(qText, PAGE_WIDTH - (MARGIN * 2));
        doc.text(qLines, MARGIN, y);
        y += (qLines.length * 12) + 4;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLOR_TEXT_MAIN);
        const aLines = doc.splitTextToSize(aText, PAGE_WIDTH - (MARGIN * 2) - 10);
        doc.text(aLines, MARGIN + 10, y);
        y += (aLines.length * 12) + 15;
      });
    }

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${totalPages}`, PAGE_WIDTH - MARGIN - 40, PAGE_HEIGHT - 20);
      doc.text("Career Counselling Web App", MARGIN, PAGE_HEIGHT - 20);
    }


    const arrayBuffer = doc.output("arraybuffer");
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  }
};

module.exports = {
  generatePDF,
};
