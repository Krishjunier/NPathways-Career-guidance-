// backend/utils/excelExport.js
const XLSX = require("xlsx");

/**
 * Flatten nested objects into dot-notated key/value pairs.
 * Arrays of primitives -> joined string.
 * Arrays of objects -> flattened with index suffix: key.0.subkey
 */
function flattenObject(obj, prefix = "", res = {}) {
  if (obj === null || obj === undefined) {
    res[prefix.replace(/\.$/, "")] = obj;
    return res;
  }
  if (typeof obj !== "object" || obj instanceof Date) {
    res[prefix.replace(/\.$/, "")] = obj;
    return res;
  }

  if (Array.isArray(obj)) {
    // Array of primitives
    const primitives = obj.every((v) => v === null || typeof v !== "object");
    if (primitives) {
      res[prefix.replace(/\.$/, "")] = obj.join(", ");
      return res;
    }
    // Array of objects -> flatten each with index
    obj.forEach((el, idx) => {
      flattenObject(el, `${prefix}${idx}.`, res);
    });
    return res;
  }

  // plain object
  Object.entries(obj).forEach(([key, val]) => {
    flattenObject(val, `${prefix}${key}.`, res);
  });
  return res;
}

/**
 * Convert an object to an array-of-arrays sheet with headers: Field | Value
 */
function objectToAoA(obj) {
  const flat = flattenObject(obj);
  const rows = [["Field", "Value"]];
  Object.keys(flat).forEach((k) => {
    let val = flat[k];
    if (val === null || val === undefined) val = "";
    else if (typeof val === "object") val = JSON.stringify(val);
    else val = String(val);
    rows.push([k, val]);
  });
  return rows;
}

/**
 * Try to coerce a value to a readable string for CSV/Excel cells
 */
function readableVal(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/**
 * Generate Excel workbook buffer from user and test data
 * @param {Object} user - User object from in-memory storage (may include user.profile)
 * @param {Object} testResponse - Test response object from in-memory storage
 * @returns {Buffer} Excel workbook buffer
 */
const generateExcel = async (user = {}, testResponse = {}) => {
  try {
    const workbook = XLSX.utils.book_new();

    // --- Normalize profile object (frontend attaches many fields to user.profile or top-level) ---
    const profile = (user && user.profile) || {};

    // Helper read shortcuts for nested fields (safe)
    const twelfth = (profile.education && profile.education.twelfth) || {};
    const ug = (profile.education && profile.education.ug) || {};
    const pg = (profile.education && profile.education.pg) || {};

    // normalize examScores: support object { english: {...}, aptitude: {...}, ... }
    const examScoresObj =
      profile.examScores && typeof profile.examScores === "object"
        ? profile.examScores
        : {};
    // convert to array for table display: { exam, score, percentage, source }
    const examScoresArray = [];
    // common English and aptitude keys
    if (examScoresObj.english) {
      examScoresArray.push({
        exam: examScoresObj.english.exam || "English Exam",
        score: examScoresObj.english.score ?? "",
        percentage: examScoresObj.english.percentage ?? "",
        kind: "english",
      });
    }
    if (examScoresObj.aptitude) {
      examScoresArray.push({
        exam: examScoresObj.aptitude.exam || "Aptitude Exam",
        score: examScoresObj.aptitude.score ?? "",
        percentage: examScoresObj.aptitude.percentage ?? "",
        kind: "aptitude",
      });
    }
    // also include any other keys (e.g., extra exams) in examScoresObj
    Object.entries(examScoresObj).forEach(([k, v]) => {
      if (k === "english" || k === "aptitude") return;
      if (v && (v.exam || v.score || v.percentage)) {
        examScoresArray.push({
          exam: v.exam || k,
          score: v.score ?? "",
          percentage: v.percentage ?? "",
          kind: k,
        });
      }
    });

    // --- Build a normalized object for the Profile Snapshot (for debug / raw) ---
    const normalized = {
      // basic / legacy
      studentType: profile.studentType || user.studentType || null,
      stream: profile.stream || user.stream || null,
      academicPercentile:
        profile.academicPercentile || user.academicPercentile || null,
      ieltsSat: profile.ieltsSat || user.ieltsSat || null,
      bachelorStream: profile.bachelorStream || user.bachelorStream || null,
      careerGoal: profile.careerGoal || user.careerGoal || null,
      greGmat: profile.greGmat || user.greGmat || null,
      experienceYears:
        profile.experienceYears != null
          ? profile.experienceYears
          : user.experienceYears != null
          ? user.experienceYears
          : "",
      researchPapers: profile.researchPapers || user.researchPapers || [],

      // newly added education/work preferences
      desiredCourse: profile.desiredCourse || user.desiredCourse || null,
      preferredBranch: profile.preferredBranch || user.preferredBranch || null,
      studyCountry: profile.studyCountry || user.studyCountry || null,
      ugCourseCategory:
        profile.ugCourseCategory || user.ugCourseCategory || null,
      ugBranch: profile.ugBranch || user.ugBranch || null,
      targetCountry:
        profile.targetCountry ||
        profile.WorkTargetCountry ||
        user.targetCountry ||
        user.WorkTargetCountry ||
        null,
      workTargetCountry:
        profile.WorkTargetCountry || user.WorkTargetCountry || null,
      workTargetRole: profile.WorkTargetRole || user.WorkTargetRole || null,
      department: profile.department || user.department || null,
      collegeName: profile.collegeName || user.collegeName || null,
      completionYear: profile.completionYear || user.completionYear || null,

      // Education structured fields (twelfth/ug/pg + master alias)
      education: {
        twelfth: {
          stream: twelfth.stream || "",
          academicPercentile:
            twelfth.academicPercentile ?? twelfth.percentile ?? "",
          percentage: twelfth.percentage ?? "",
          aptitudeExamType: twelfth.aptitudeExamType || "",
          aptitudeExamScore: twelfth.aptitudeExamScore ?? "",
          aptitudeExamPercentage: twelfth.aptitudeExamPercentage ?? "",
          englishExamType: twelfth.englishExamType || "",
          englishExamScore: twelfth.englishExamScore ?? "",
          englishExamPercentage: twelfth.englishExamPercentage ?? "",
          collegeName: twelfth.collegeName || "",
          completionYear: twelfth.completionYear || "",
        },
        ug: {
          bachelorStream: ug.bachelorStream || "",
          ugCourseCategory: ug.ugCourseCategory || "",
          ugBranch: ug.ugBranch || "",
          targetCountry: ug.targetCountry || "",
          department: ug.department || "",
          currentlyStudying: ug.currentlyStudying || "",
          collegeName: ug.collegeName || "",
          completionYear: ug.completionYear || "",
          aptitudeExamType: ug.aptitudeExamType || "",
          aptitudeExamScore: ug.aptitudeExamScore ?? "",
          aptitudeExamPercentage: ug.aptitudeExamPercentage ?? "",
          englishExamType: ug.englishExamType || "",
          englishExamScore: ug.englishExamScore ?? "",
          percentage: ug.percentage ?? "",
        },
        pg: {
          currentDegreeStream: pg.currentDegreeStream || "",
          department: pg.department || "",
          currentlyStudying: pg.currentlyStudying || "",
          collegeName: pg.collegeName || "",
          completionYear: pg.completionYear || "",
          aptitudeExamType: pg.aptitudeExamType || "",
          aptitudeExamScore: pg.aptitudeExamScore ?? "",
          aptitudeExamPercentage: pg.aptitudeExamPercentage ?? "",
          englishExamType: pg.englishExamType || "",
          englishExamScore: pg.englishExamScore ?? "",
          percentage: pg.percentage ?? "",
        },
        master: {
          currentDegreeStream: pg.currentDegreeStream || "",
          department: pg.department || "",
          currentlyStudying: pg.currentlyStudying || "",
          collegeName: pg.collegeName || "",
          completionYear: pg.completionYear || "",
          aptitudeExamType: pg.aptitudeExamType || "",
          aptitudeExamScore: pg.aptitudeExamScore ?? "",
          aptitudeExamPercentage: pg.aptitudeExamPercentage ?? "",
          englishExamType: pg.englishExamType || "",
          englishExamScore: pg.englishExamScore ?? "",
          percentage: pg.percentage ?? "",
        },
      },

      // exam scores array for easy import
      examScores: examScoresArray,

      // other arrays
      skills: profile.skills || user.skills || [],
      projects: profile.projects || user.projects || [],

      // raw profile for debugging
      rawProfile: profile,
    };

    // --- Personal Information Sheet ---
    const personalData = [
      ["Personal Information", ""],
      ["Name", user.name || ""],
      ["Email", user.email || ""],
      ["Phone", user.phone || ""],
      ["Status", user.class_status || ""],
      ["Student Type", normalized.studentType || ""],
      ["Stream", normalized.stream || ""],
      [
        "Academic % (12th)",
        normalized.education.twelfth.academicPercentile || "",
      ],
      ["IELTS/SAT", normalized.ieltsSat || ""],
      ["Bachelor Stream", normalized.bachelorStream || ""],
      ["Career Goal", normalized.careerGoal || ""],
      ["GRE/GMAT", normalized.greGmat || ""],
      [
        "Experience (yrs)",
        normalized.experienceYears != null ? normalized.experienceYears : "",
      ],
      [
        "Registration Date",
        user.createdAt ? new Date(user.createdAt).toLocaleString() : "",
      ],
    ];
    const personalSheet = XLSX.utils.aoa_to_sheet(personalData);
    XLSX.utils.book_append_sheet(workbook, personalSheet, "Personal Info");

    // --- Education Preferences Sheet (compact) ---
    const eduData = [
      ["Education Preferences", ""],
      ["Desired Course (12th)", normalized.desiredCourse || ""],
      ["Preferred Branch (12th)", normalized.preferredBranch || ""],
      ["Study Country (12th)", normalized.studyCountry || ""],
      ["UG Course Category", normalized.ugCourseCategory || ""],
      ["UG Branch", normalized.ugBranch || ""],
      ["UG Target Country", normalized.targetCountry || ""],
      ["Department / Specialization", normalized.department || ""],
      ["College Name", normalized.collegeName || ""],
      ["Completion Year", normalized.completionYear || ""],
    ];
    const eduSheet = XLSX.utils.aoa_to_sheet(eduData);
    XLSX.utils.book_append_sheet(workbook, eduSheet, "Education Preferences");

    // --- Education Percentages Sheet (12th / UG / PG) ---
    const eduPercentData = [
      ["Level", "Percentage / GPA", "Notes"],
      [
        "12th",
        readableVal(
          normalized.education.twelfth.percentage ||
            normalized.education.twelfth.academicPercentile ||
            ""
        ),
        "",
      ],
      ["UG", readableVal(normalized.education.ug.percentage || ""), ""],
      ["PG", readableVal(normalized.education.pg.percentage || ""), ""],
    ];
    const eduPercentSheet = XLSX.utils.aoa_to_sheet(eduPercentData);
    XLSX.utils.book_append_sheet(
      workbook,
      eduPercentSheet,
      "Education Percentages"
    );

    // --- Exam Scores Sheet (English + Aptitude + any others) ---
    const examHeader = [["Exam", "Kind", "Score", "Percentage"]];
    const examRows = examHeader.concat(
      (normalized.examScores || []).map((e) => [
        e.exam || "",
        e.kind || "",
        readableVal(e.score),
        readableVal(e.percentage),
      ])
    );
    // If no exam scores, add placeholder row
    if ((normalized.examScores || []).length === 0) {
      examRows.push(["No exam scores available", "", "", ""]);
    }
    const examSheet = XLSX.utils.aoa_to_sheet(examRows);
    XLSX.utils.book_append_sheet(workbook, examSheet, "Exam Scores");

    // --- Test Responses Sheet (robust to array or object) ---
    const testData = [["Question ID", "Question", "Answer"]];
    if (Array.isArray(testResponse.answers)) {
      testResponse.answers.forEach((answer) => {
        testData.push([
          answer.questionId || "",
          answer.question || `Question ${answer.questionId || ""}`,
          answer.answer || "",
        ]);
      });
    } else if (
      testResponse.answers &&
      typeof testResponse.answers === "object"
    ) {
      Object.entries(testResponse.answers).forEach(([qid, ans]) => {
        if (
          ans &&
          typeof ans === "object" &&
          ("answer" in ans || "question" in ans)
        ) {
          testData.push([
            qid,
            ans.question || `Question ${qid}`,
            ans.answer || "",
          ]);
        } else {
          testData.push([
            qid,
            `Question ${qid}`,
            typeof ans === "string" || typeof ans === "number"
              ? ans
              : JSON.stringify(ans),
          ]);
        }
      });
    }
    const testSheet = XLSX.utils.aoa_to_sheet(testData);
    XLSX.utils.book_append_sheet(workbook, testSheet, "Test Responses");

    // --- Career Recommendation Sheet ---
    const career =
      testResponse.careerSuggestion || testResponse.careerRecommendation || {};
    const careerData = [
      ["Career Recommendation", ""],
      ["Domain", career.domain || ""],
      ["Description", career.description || ""],
      ["Suggested Roles", ""],
      ...(career.roles && Array.isArray(career.roles)
        ? career.roles.map((role) => ["", role])
        : []),
      ["Recommended Courses", ""],
      ...(career.courses && Array.isArray(career.courses)
        ? career.courses.map((c) => ["", c])
        : []),
    ];
    const careerSheet = XLSX.utils.aoa_to_sheet(careerData);
    XLSX.utils.book_append_sheet(
      workbook,
      careerSheet,
      "Career Recommendation"
    );

    // --- Aggregates Sheet (RIASEC/MI/EI) ---
    if (career.aggregates && typeof career.aggregates === "object") {
      const entries = Object.entries(career.aggregates).sort(
        (a, b) => b[1] - a[1]
      );
      const aggData = [
        ["Dimension", "Score"],
        ...entries.map(([k, v]) => [k, v]),
      ];
      const aggSheet = XLSX.utils.aoa_to_sheet(aggData);
      XLSX.utils.book_append_sheet(workbook, aggSheet, "Aggregates");
    }

    // --- Research Papers Sheet (if any) ---
    const papers = normalized.researchPapers || [];
    if (Array.isArray(papers) && papers.length) {
      const papersData = [["Title", "Venue", "Year", "Link"]];
      papers.forEach((p) => {
        papersData.push([
          p.title || "",
          p.venue || "",
          p.year || "",
          p.link || "",
        ]);
      });
      const papersSheet = XLSX.utils.aoa_to_sheet(papersData);
      XLSX.utils.book_append_sheet(workbook, papersSheet, "Research Papers");
    }

    // --- Meta Sheet (timestamps, ids, verification) ---
    const metaData = [
      ["Meta", ""],
      ["User ID", user._id || user.id || ""],
      [
        "Verified",
        user.verified || (user.profile && user.profile.verified) ? "Yes" : "No",
      ],
      [
        "Test Submitted",
        testResponse.submittedAt
          ? new Date(testResponse.submittedAt).toLocaleString()
          : "",
      ],
      ["Exported At", new Date().toLocaleString()],
    ];
    const metaSheet = XLSX.utils.aoa_to_sheet(metaData);
    XLSX.utils.book_append_sheet(workbook, metaSheet, "Meta");

    // --- Profile Snapshot (PRETTIFIED) ---
    const profileAoA = objectToAoA(normalized.rawProfile || normalized);
    const profileSheet = XLSX.utils.aoa_to_sheet(profileAoA);
    // set column widths for readability
    profileSheet["!cols"] = [{ wch: 50 }, { wch: 120 }];
    XLSX.utils.book_append_sheet(workbook, profileSheet, "Profile Snapshot");

    // --- Full Raw Data (PRETTIFIED) ---
    const fullDump = {
      user,
      testResponse,
      generatedAt: new Date().toISOString(),
    };
    const dumpAoA = objectToAoA(fullDump);
    const dumpSheet = XLSX.utils.aoa_to_sheet(dumpAoA);
    dumpSheet["!cols"] = [{ wch: 50 }, { wch: 120 }];
    XLSX.utils.book_append_sheet(workbook, dumpSheet, "Full Raw Data");

    // Generate Excel buffer
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  } catch (error) {
    console.error("Excel Generation Error:", error);
    throw error;
  }
};

module.exports = {
  generateExcel,
};
