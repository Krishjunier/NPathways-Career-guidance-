# Career Counselling Master Flow Implementation

## Overview
This document outlines the complete implementation of the career counselling chat flow for Students, Working Professionals, and Parents/Guardians.

## User Types & Routing

### After OTP Verification:
- **Students** & **Working Professionals** → Psychometric Tests → Completion
- **Parents/Guardians** → Direct to Completion Dashboard

---

## Complete Flow Paths

### 1. STUDENT FLOWS

#### A. 10th Grade Path (NEW)
```
Welcome → Name → Email → Status (Student) → Student Stage (10th Grade)
→ Path Selection (Higher Secondary / Diploma)
  → Higher Secondary: Stream (Science/Arts/etc) → Course → Currently Studying (Yes/No)
  → Diploma: Diploma Field → Currently Studying (Yes/No)
→ Currently Studying (Yes/No)
  → Yes: College → Country → Completion Year → ...
  → No: Completion Year → ...
→ OTP → Psychometric Tests
```

#### B. 12th Standard Path
```
Welcome → Name → Email → Status (Student) → Student Stage (12th)
→ Stream (Science/Commerce/Arts/Engineering/Medical/Other)
→ Course (Based on stream)
→ Currently Studying (Yes/No)
  → Yes: College → Country → Completion Year → Skills → Aptitude Exam
  → No: Completion Year → Skills → Aptitude Exam
→ Aptitude Exam (Yes/No)
  → Yes: Aptitude Details → Aptitude Score → English Exam
  → No: English Exam
→ English Exam (Yes/No)
  → Yes: English Details → English Score → Academic Performance → Phone
  → No: Academic Performance → Phone
→ OTP → Psychometric Tests
```

#### C. 10th + Diploma Path (Legacy/Specific)
```
Welcome → Name → Email → Status (Student) → Student Stage (10th + Diploma)
→ Diploma Course (field of diploma)
→ Currently Studying (Yes/No)
  → Yes: College → Country → Completion Year
  → No: Completion Year
→ Phone → OTP → Psychometric Tests
```

#### D. UG (Undergraduate) Path
```
Welcome → Name → Email → Status (Student) → Student Stage (UG)
→ Stream (Science/Commerce/Arts/Engineering/Medical/Other)
→ Course (Based on stream)
→ Currently Studying (Yes/No)
  → Yes: College → Country → Completion Year
  → No: Completion Year
→ Projects (text input - internships/projects)
→ Goal (Higher Studies/Job/Entrepreneurship/Research/Other)
→ Target Country (text input)
→ Skills (text input)
→ Aptitude Exam (Yes/No)
  → Yes: Aptitude Details → Aptitude Score → English Exam
  → No: English Exam
→ English Exam (Yes/No)
  → Yes: English Details → English Score → Phone
  → No: Phone
→ OTP → Psychometric Tests
```

#### E. UG + Diploma Path
```
Welcome → Name → Email → Status (Student) → Student Stage (UG + Diploma)
→ UG Diploma Course (field)
→ Currently Studying (Yes/No)
  → Yes: College → Country → Completion Year
  → No: Completion Year
→ Phone → OTP → Psychometric Tests
```

#### F. Master's Path
```
Welcome → Name → Email → Status (Student) → Student Stage (Master)
→ Stream (Department/Field)
→ Course (Based on stream)
→ Currently Studying (Yes/No)
  → Yes: College → Country → Completion Year
  → No: Completion Year
→ Projects (text input - research/projects)
→ Goal (Higher Studies/Job/Entrepreneurship/Research/Other)
→ Target Country (text input)
→ Skills (text input)
→ Aptitude Exam (Yes/No)
  → Yes: Aptitude Details → Aptitude Score → English Exam
  → No: English Exam
→ English Exam (Yes/No)
  → Yes: English Details → English Score → Phone
  → No: Phone
→ OTP → Psychometric Tests
```

---

### 2. WORKING PROFESSIONAL FLOW

```
Welcome → Name → Email → Status (Working Professional)
→ Experience (1-3/3-5/5+ years)
→ Company (text input)
→ Role (Software Engineer/Data Scientist/Product Manager/Business Analyst/Marketing Manager/Other)
→ Industry (IT/Finance/Healthcare/Manufacturing/Education/Retail/Other)
→ Skills (text input)
→ Goal (Career Growth/Switch Industry/Start Business/Higher Studies/Other)
→ Target Country (text input)
→ Considering Switch (Yes/No)
  → Yes: Target Role (text input) → Phone
  → No: Phone
→ OTP → Psychometric Tests
```

---

### 3. PARENT/GUARDIAN FLOW

```
Welcome → Name → Email → Status (Parent/Guardian)
→ Priority (Career Growth/Higher Studies/Skill Development/Overall Development)
→ Child's Education Level (12th/10th + Diploma/UG/UG + Diploma/Master)
→ Child's Stream (Science/Commerce/Arts/Engineering/Medical/Other)
→ Child's Goals (Higher Studies/Job/Entrepreneurship/Competitive Exams/Skill Development/Other)
→ Phone → OTP → Dashboard (No Psychometric Tests)
```

---

## Key Features

### Change Option
- Users can select "Change Option" at any stream/course/diploma selection stage
- Returns to Student Stage selection menu

### OTP Flow
- Phone collection → OTP sent → OTP verification
- User data saved to database
- Profile data updated with all collected information

### Post-OTP Routing
- **Students & Working Professionals**: Psychometric Assessment (RIASEC → Emotional Intelligence → General Intelligence)
- **Parents**: Direct to Dashboard (skip psychometric tests)

---

## Stage Definitions

### Common Stages
- `welcome`, `collect_name`, `collect_email`, `collect_status`, `collect_phone`, `collect_otp`
- `awaiting_register`, `awaiting_verify`, `info_complete`

### Student Stages
**10th Grade (New):** path_selection, stream/course (branch dependent)

**12th:** stream, course, currently_studying, college, country, completion_year, skills, aptitude_exam, aptitude_details, aptitude_score, english_exam, english_details, english_score, academic

**Diploma:** course, currently_studying, college, country, completion_year

**UG:** stream, course, currently_studying, college, country, completion_year, projects, goal, target_country, skills, aptitude_exam, aptitude_details, aptitude_score, english_exam, english_details, english_score

**UG + Diploma:** course, currently_studying

**Master:** stream, course, currently_studying, college, country, completion_year, goal, target_country, skills, aptitude_exam, aptitude_details, aptitude_score, english_exam, english_details, english_score

### Working Professional Stages
- `collect_work_exp`, `collect_work_company`, `collect_work_role`
- `collect_work_industry`, `collect_work_skills`, `collect_work_goal`
- `collect_work_target_country`, `collect_work_switch`, `collect_work_target_role`

### Parent/Guardian Stages
- `collect_parent_priority`, `collect_child_level`, `collect_child_stream`
- `collect_child_goals`, `collect_child_understanding`

---

## Implementation Status

✅ **Completed**
- All student paths (10th, 12th, Diploma, UG, UG+Diploma, Master)
- Working professional complete flow with target country
- Parent/guardian flow with proper routing
- OTP verification with user-type-based routing
- Psychometric test integration for students/working
- Dashboard routing for parents
- Backend Logic fixed for all Goal/Target Country permutations

✅ **Fixed Issues**
- Added 10th Grade Flow with Higher Secondary/Diploma branching
- Fixed backend report compilation for consistent data access
- Removed Twilio/Firebase dependencies
- Fixed UG flow loop (projects asked twice)
- Added UG education options
- Fixed english exam routing to phone
- Added work target country collection

---

## Next Steps
- End-to-end testing of 10th grade path
- Verify Payment Gateway logic in Production

---

**Last Updated:** 2026-01-30
**File:** `frontend/src/pages/ChatPage.tsx`
