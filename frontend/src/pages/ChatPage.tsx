// src/pages/ChatPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ChatBubble from '../components/ChatBubble';
import InputField from '../components/InputField';
import { v4 as uuidv4 } from 'uuid';
import { apiService } from '../services/api';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date | string;
  options?: string[];
  type?: 'text' | 'input' | 'select' | 'typing';
  inputType?: string;
}

type Stage =
  // Initial entry (all users)
  | 'welcome' | 'collect_name' | 'collect_email' | 'collect_status'
  // Student stages
  | 'collect_student_stage' | 'collect_10th_path'
  | 'collect_12th_stream' | 'collect_12th_course' | 'collect_12th_currently_studying'
  | 'collect_12th_college' | 'collect_12th_country' | 'collect_12th_completion_year'
  | 'collect_12th_skills' | 'collect_12th_aptitude_exam' | 'collect_12th_aptitude_details'
  | 'collect_12th_aptitude_score' | 'collect_12th_english_exam' | 'collect_12th_english_details'
  | 'collect_12th_english_score' | 'collect_12th_academic'
  | 'collect_12th_goal' | 'collect_12th_target_country'
  | 'collect_diploma_course' | 'collect_diploma_currently_studying' | 'collect_diploma_college'
  | 'collect_diploma_country' | 'collect_diploma_completion_year'
  | 'collect_ug_stream' | 'collect_ug_course' | 'collect_ug_currently_studying'
  | 'collect_ug_college' | 'collect_ug_country' | 'collect_ug_completion_year'
  | 'collect_ug_projects' | 'collect_ug_goal' | 'collect_ug_target_country' | 'collect_ug_skills'
  | 'collect_ug_aptitude_exam' | 'collect_ug_aptitude_details' | 'collect_ug_aptitude_score'
  | 'collect_ug_english_exam' | 'collect_ug_english_details' | 'collect_ug_english_score'
  | 'collect_ug_diploma_course' | 'collect_ug_diploma_currently_studying'
  | 'collect_master_stream' | 'collect_master_course' | 'collect_master_currently_studying'
  | 'collect_master_college' | 'collect_master_country' | 'collect_master_completion_year'
  | 'collect_master_projects' | 'collect_master_goal' | 'collect_master_target_country' | 'collect_master_skills'
  | 'collect_master_aptitude_exam' | 'collect_master_aptitude_details' | 'collect_master_aptitude_score'
  | 'collect_master_english_exam' | 'collect_master_english_details' | 'collect_master_english_score'
  // PG stages
  | 'collect_pg_college' | 'collect_pg_country' | 'collect_pg_completion_year'
  | 'collect_pg_goal' | 'collect_pg_aptitude_exam' | 'collect_pg_aptitude_details'
  | 'collect_pg_aptitude_score' | 'collect_pg_english_exam' | 'collect_pg_english_details'
  | 'collect_pg_english_score'
  // Working professional stages
  | 'collect_work_edu_level' | 'collect_work_edu_course' | 'collect_work_college'
  | 'collect_work_exp' | 'collect_work_company' | 'collect_work_role'
  | 'collect_work_industry' | 'collect_work_skills' | 'collect_work_goal'
  | 'collect_work_target_country' | 'collect_work_switch' | 'collect_work_target_role'
  // Parent/Guardian stages
  | 'collect_parent_priority' | 'collect_child_level' | 'collect_child_stream' | 'collect_child_school'
  | 'collect_child_goals' | 'collect_child_understanding'
  // Common stages
  | 'collect_phone' | 'awaiting_register' | 'collect_otp' | 'awaiting_verify'
  | 'info_complete' | 'show_summary';

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [stage, setStage] = useState<Stage>('welcome');
  const [userId, setUserId] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [classStatus, setClassStatus] = useState(''); // Student, Worker, Parent
  const [profileDraft, setProfileDraft] = useState<any>({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [aptitudeScore, setAptitudeScore] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [englishScore, setEnglishScore] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const hasWelcomedRef = useRef<boolean>(false);

  const courseCategories = ['Engineering', 'Business', 'Arts', 'Science', 'Medicine', 'Law'];
  const branchMapping: Record<string, string[]> = {
    Engineering: ['Computer Science', 'Mechanical', 'Civil', 'Electrical', 'Electronics', 'Biotechnology', 'Other'],
    Business: ['Finance', 'Marketing', 'Accounting', 'Human Resources', 'Management', 'Entrepreneurship', 'Other'],
    Arts: ['Literature', 'Visual Arts', 'Performing Arts', 'History', 'Sociology', 'Other'],
    Science: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Environmental Science', 'Other'],
    Medicine: ['MBBS', 'Dentistry', 'Nursing', 'Pharmacy', 'Physiotherapy', 'Other'],
    Law: ['International Law', 'Corporate Law', 'Criminal Law', 'Constitutional Law', 'Other'],
  };
  // Use full ISO 3166 country list for autocomplete


  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const pushBot = (text: string, opts?: Partial<Message>) => {
    setMessages(prev => [...prev, { id: uuidv4(), text, isBot: true, timestamp: new Date(), ...opts }]);
  };

  const pushUser = (text: string) => {
    setMessages(prev => [...prev, { id: uuidv4(), text, isBot: false, timestamp: new Date() }]);
  };

  useEffect(() => {
    console.log("🔍 [ChatPage] Component mounted");
    console.log("🔍 [ChatPage] Current stage:", stage);

    // CRITICAL: Check if tests are completed - if so, don't show welcome
    const testsCompleted = localStorage.getItem('tests_completed');
    const onCompletionPage = sessionStorage.getItem('on_completion_page');

    if (testsCompleted === 'true' && onCompletionPage === 'true') {
      return;
    }

    if (hasWelcomedRef.current) return;

    // Check for pre-filled data from Landing Page
    const state = location.state as any;
    if (state && state.name) {
      hasWelcomedRef.current = true;
      console.log("👋 [ChatPage] Initializing with pre-filled data:", state);

      setName(state.name);
      setEmail(state.email);

      let mapped = 'Student';
      if (state.status === 'Working Professional') mapped = 'Worker';
      else if (state.status === 'Parent / Guardian') mapped = 'Parent';
      setClassStatus(mapped);

      setProfileDraft((prev: any) => ({
        ...prev,
        name: state.name,
        email: state.email,
        status: mapped,
        phone: state.phone
      }));

      pushBot(`Welcome back, ${state.name}! 👋`);

      if (mapped === 'Parent') {
        setStage('collect_parent_priority');
        pushBot('What is your main priority for your child?', {
          options: ['Career Growth', 'Higher Studies', 'Skill Development', 'Overall Development']
        });
      } else if (mapped === 'Worker') {
        setStage('collect_work_edu_level');
        pushBot('What is your highest qualification?', {
          options: ['UG', 'PG', 'Diploma', 'Doctorate', 'Other']
        });
      } else {
        setStage('collect_student_stage');
        pushBot('Select your Student Stage', {
          options: ['10th Grade', '12th', '10th + Diploma', 'UG', 'UG + Diploma', 'Master']
        });
      }
      return;
    }

    // Default Welcome Flow
    if (stage === 'welcome') {
      hasWelcomedRef.current = true;
      console.log("👋 [ChatPage] Showing welcome message");
      pushBot('👋 Welcome! Would you like to take a Free Career Counselling Test?', {
        options: ['Yes, start the test', 'Maybe later'],
      });
    }
  }, [stage, location.state]);

  // Rest of your handler functions remain the same...
  const handleOptionClick = async (option: string) => {
    pushUser(option);

    if (stage === 'welcome') {
      if (option.startsWith('Yes')) {
        setStage('collect_name');
        pushBot('Great! What is your full name?', { type: 'input', inputType: 'text' });
      } else {
        pushBot("No problem! You can start anytime by typing 'start'.");
      }
      return;
    }

    if (stage === 'collect_name' && !option) {
      // This is handled by handleInputSubmit
      return;
    }

    if (stage === 'collect_email' && !option) {
      // This is handled by handleInputSubmit
      return;
    }

    // Check for status (Student/Working/Parent) - this comes from collect_email flow
    if (stage === 'collect_status') {
      let mapped = 'Student';
      if (option === 'Working Professional') {
        mapped = 'Worker';
      } else if (option === 'Parent / Guardian') {
        mapped = 'Parent';
        setClassStatus(mapped);
        setProfileDraft((p: any) => ({ ...p, status: 'Parent' }));
        setStage('collect_parent_priority');
        pushBot('What is your main priority for your child?', {
          options: ['Career Growth', 'Higher Studies', 'Skill Development', 'Overall Development']
        });
        return;
      }

      setClassStatus(mapped);
      if (mapped === 'Student') {
        setStage('collect_student_stage');
        pushBot('Select your Student Stage', {
          options: ['10th Grade', '12th', '10th + Diploma', 'UG', 'UG + Diploma', 'Master']
        });
      } else {
        setProfileDraft((p: any) => ({ ...p, status: 'Working' }));
        // CHANGED: Go to Education Collection first
        setStage('collect_work_edu_level');
        pushBot('What is your highest qualification?', {
          options: ['UG', 'PG', 'Diploma', 'Doctorate', 'Other']
        });
      }
      return;
    }

    // Handlers for Working Professional Education
    if (stage === 'collect_work_edu_level') {
      setProfileDraft((p: any) => ({ ...p, educationLevel: option }));
      setStage('collect_work_edu_course');
      pushBot('What was your major/specialization?', { options: [...courseCategories, 'Other'] });
      return;
    }

    if (stage === 'collect_work_edu_course') {
      if (option === 'Change Option') {
        // Allow going back if needed, but for now just reset
        setStage('collect_work_edu_level');
        pushBot('What is your highest qualification?', { options: ['UG', 'PG', 'Diploma', 'Doctorate', 'Other'] });
        return;
      }
      setProfileDraft((p: any) => ({ ...p, educationCourse: option }));
      setStage('collect_work_college');
      pushBot('Which college or university did you attend?', { type: 'input', inputType: 'text' });
      return;
    }

    if (stage === 'collect_student_stage') {
      if (option === '10th Grade') {
        setProfileDraft((p: any) => ({ ...p, educationLevel: '10th' }));
        setStage('collect_10th_path');
        pushBot('What path are you considering for your future?', { options: ['Higher Secondary (11th/12th)', 'Diploma'] });
      } else if (option === '12th') {
        setProfileDraft((p: any) => ({ ...p, educationLevel: '12th' }));
        setStage('collect_12th_stream');
        pushBot('What stream are you in?', { options: [...courseCategories, 'Change Option'] });
      } else if (option === '10th + Diploma') {
        setProfileDraft((p: any) => ({ ...p, educationLevel: '10th + Diploma' }));
        setStage('collect_diploma_course');
        pushBot('What is your diploma field?', { options: [...courseCategories, 'Change Option'] });
      } else if (option === 'UG') {
        setProfileDraft((p: any) => ({ ...p, educationLevel: 'UG' }));
        setStage('collect_ug_stream');
        pushBot('What stream are you pursuing?', { options: [...courseCategories, 'Change Option'] });
      } else if (option === 'UG + Diploma') {
        setProfileDraft((p: any) => ({ ...p, educationLevel: 'UG + Diploma' }));
        setStage('collect_ug_diploma_course');
        pushBot('What is your UG + Diploma field?', { options: [...courseCategories, 'Change Option'] });
      } else if (option === 'Master') {
        setProfileDraft((p: any) => ({ ...p, educationLevel: 'Master' }));
        setStage('collect_master_stream');
        pushBot('What is your stream/field?', { options: [...courseCategories, 'Change Option'] });
      }
      return;
    }

    // Handle "Change Option" from any stage - go back to student stage selection
    // This should be checked AFTER verifying it's a valid option for the current stage
    // Only allow from initial flows (stream, course, diploma), NOT after education path (aptitude, english, etc.)
    if (option === 'Change Option' &&
      (stage.includes('_stream') ||
        stage === 'collect_diploma_course' ||
        stage === 'collect_ug_diploma_course')) {
      setStage('collect_student_stage');
      pushBot('Select your Student Stage', {
        options: ['10th Grade', '12th', '10th + Diploma', 'UG', 'UG + Diploma', 'Master']
      });
      return;
    }

    // Education stream selection handler
    if (stage.includes('_stream')) {
      const level = stage.includes('12th') ? '12th' : stage.includes('ug') ? 'UG' : 'Master';
      setProfileDraft((p: any) => ({ ...p, [`${level}Stream`]: option }));
      const nextStage = level === '12th' ? 'collect_12th_course' as Stage :
        level === 'UG' ? 'collect_ug_course' as Stage :
          'collect_master_course' as Stage;
      setStage(nextStage);
      pushBot('Select your course:', { options: branchMapping[option] || [] });
      return;
    }


    // Handle 10th grade path selection
    if (stage === 'collect_10th_path') {
      if (option === 'Higher Secondary (11th/12th)') {
        setStage('collect_12th_stream');
        pushBot('Which stream are you interested in?', { options: [...courseCategories, 'Change Option'] });
      } else {
        setStage('collect_diploma_course');
        pushBot('Which diploma field are you interested in?', { options: [...courseCategories, 'Change Option'] });
      }
      return;
    }

    // Handle diploma course selection
    if (stage === 'collect_diploma_course' || stage === 'collect_ug_diploma_course') {
      if (stage === 'collect_diploma_course') {
        setProfileDraft((p: any) => ({ ...p, diplomaCourse: option }));
        setStage('collect_12th_currently_studying');
      } else if (stage === 'collect_ug_diploma_course') {
        setProfileDraft((p: any) => ({ ...p, ugDiplomaCourse: option }));
        setStage('collect_ug_currently_studying');
      }
      pushBot('Are you currently studying?', { options: ['Yes', 'No'] });
      return;
    }


    // Work experience handler
    if (stage === 'collect_work_exp') {
      setProfileDraft((p: any) => ({ ...p, workExperience: option }));
      setStage('collect_work_company');
      pushBot('Which company do you work for?', { type: 'input', inputType: 'text' });
      return;
    }

    // Work role and industry handlers
    if (stage === 'collect_work_role') {
      setProfileDraft((p: any) => ({ ...p, workRole: option }));
      setStage('collect_work_industry');
      pushBot('Which industry do you work in?', {
        options: [
          'Information Technology', 'Finance/Banking', 'Healthcare',
          'Manufacturing', 'Education', 'Retail', 'Other'
        ]
      });
      return;
    }

    if (stage === 'collect_work_industry') {
      setProfileDraft((p: any) => ({ ...p, workIndustry: option }));
      setStage('collect_work_skills');
      pushBot('What are your key skills?', { type: 'input', inputType: 'text' });
      return;
    }

    // Career goals and switch handlers
    if (stage === 'collect_work_goal') {
      setProfileDraft((p: any) => ({ ...p, careerGoal: option }));
      setStage('collect_work_target_country');
      pushBot('Which country are you targeting for your career?', { type: 'input', inputType: 'text' });
      return;
    }

    if (stage === 'collect_work_switch') {
      setProfileDraft((p: any) => ({ ...p, consideringSwitch: option === 'Yes' }));
      if (option === 'Yes') {
        setStage('collect_work_target_role');
        pushBot('What type of role are you targeting?', { type: 'input', inputType: 'text' });
      } else {
        setStage('collect_phone');
        pushBot('Please enter your phone number to complete verification:', { type: 'input', inputType: 'tel' });
      }
      return;
    }

    if (stage.includes('_course') && !stage.includes('diploma')) {
      const level = stage.includes('12th') ? '12th' : stage.includes('ug') ? 'UG' : 'Master';
      setProfileDraft((p: any) => ({ ...p, [`${level}Course`]: option }));

      if (level === '12th') {
        setStage('collect_12th_currently_studying');
        pushBot('Are you currently studying?', { options: ['Yes', 'No'] });
      } else if (level === 'UG') {
        setStage('collect_ug_currently_studying');
        pushBot('Are you currently studying?', { options: ['Yes', 'No'] });
      } else {
        setStage('collect_master_currently_studying');
        pushBot('Are you currently studying?', { options: ['Yes', 'No'] });
      }
      return;
    }

    // 12th/UG/Master Branch handler (for when branch options are displayed)
    if (stage.includes('_branch')) {
      const level = stage.includes('12th') ? '12th' : stage.includes('ug') ? 'UG' : 'Master';
      setProfileDraft((p: any) => ({ ...p, [`${level}Branch`]: option }));

      if (level === '12th') {
        setStage('collect_12th_currently_studying');
        pushBot('Are you currently studying?', { options: ['Yes', 'No'] });
      } else if (level === 'UG') {
        setStage('collect_ug_currently_studying');
        pushBot('Are you currently studying?', { options: ['Yes', 'No'] });
      } else {
        setStage('collect_master_currently_studying');
        pushBot('Are you currently studying?', { options: ['Yes', 'No'] });
      }
      return;
    }


    if (stage.includes('currently_studying')) {
      // Don't process "Change Option" here - it's handled above
      if (option === 'Change Option') {
        // Already handled in the "Change Option" handler above, shouldn't reach here
        return;
      }

      const level = stage.includes('12th') ? '12th' : stage.includes('ug') ? 'UG' : 'Master';
      setProfileDraft((p: any) => ({ ...p, [`${level}CurrentlyStudying`]: option === 'Yes' }));

      if (option === 'Yes') {
        if (level === '12th') setStage('collect_12th_college');
        else if (level === 'UG') setStage('collect_ug_college');
        else setStage('collect_master_college');
        pushBot('Which college/institution are you studying at?', { type: 'input', inputType: 'text' });
      } else if (option === 'No') {
        if (level === '12th') setStage('collect_12th_completion_year');
        else if (level === 'UG') setStage('collect_ug_completion_year');
        else setStage('collect_master_completion_year');
        pushBot('What year did you complete your studies?', { type: 'input', inputType: 'number' });
      }
      return;
    }

    // [ALL YOUR OTHER OPTION HANDLERS - keeping them exactly as they are]
    // I'm truncating here for space, but include ALL your existing handlers

    // Handle English exam flow
    if (stage.includes('english_exam')) {
      const level = stage.includes('12th') ? '12th' : stage.includes('ug') ? 'UG' : 'Master';
      setProfileDraft((p: any) => ({ ...p, [`${level}HasEnglishExam`]: option === 'Yes' }));

      if (option === 'Yes') {
        if (level === '12th') setStage('collect_12th_english_details');
        else if (level === 'UG') setStage('collect_ug_english_details');
        else setStage('collect_master_english_details');
        pushBot('Which English exam(s) did you take?', {
          options: ['IELTS', 'TOEFL', 'PTE', 'Duolingo', 'Other']
        });
      } else {
        // If no English exam, move to next stage based on education level
        if (level === '12th') {
          setStage('collect_12th_academic');
          pushBot('What is your academic performance (percentage/CGPA)?', { type: 'input', inputType: 'text' });
        } else if (level === 'UG') {
          setStage('collect_ug_goal');
          pushBot('What are your career goals after graduation?', { type: 'input', inputType: 'text' });
        } else {
          setStage('collect_master_goal');
          pushBot('What are your career goals?', { type: 'input', inputType: 'text' });
        }
      }
      return;
    }

    // Handle aptitude option flow (Yes/No) when options are used
    if (stage.includes('aptitude_exam')) {
      const level = stage.includes('12th') ? '12th' : stage.includes('ug') ? 'UG' : 'Master';
      setProfileDraft((p: any) => ({ ...p, [`${level}HasAptitude`]: option === 'Yes' }));

      if (option === 'Yes') {
        const nextStage = level === '12th' ? 'collect_12th_aptitude_details' as Stage :
          level === 'UG' ? 'collect_ug_aptitude_details' as Stage :
            'collect_master_aptitude_details' as Stage;
        setStage(nextStage);
        pushBot('Which exam(s) did you take?', { type: 'input', inputType: 'text' });
      } else {
        const nextStage = level === '12th' ? 'collect_12th_english_exam' as Stage :
          level === 'UG' ? 'collect_ug_english_exam' as Stage :
            'collect_master_english_exam' as Stage;
        setStage(nextStage);
        pushBot('Have you taken any English proficiency exams (IELTS/TOEFL)?', { options: ['Yes', 'No'] });
      }
      return;
    }

    // Handle English exam details
    if (stage.includes('english_details')) {
      const level = stage.includes('12th') ? '12th' : stage.includes('ug') ? 'UG' : 'Master';
      setProfileDraft((p: any) => ({ ...p, [`${level}EnglishExam`]: option }));

      if (level === '12th') setStage('collect_12th_english_score');
      else if (level === 'UG') setStage('collect_ug_english_score');
      else setStage('collect_master_english_score');
      pushBot('What was your score?', { type: 'input', inputType: 'text' });
      return;
    }

    // Handle academic details for 12th
    if (stage === 'collect_12th_academic') {
      setProfileDraft((p: any) => ({ ...p, academicScore: option }));
      setStage('collect_12th_goal');
      // Changed to text input as per user request
      pushBot('What is your long-term career goal or dream job?', { type: 'input', inputType: 'text' });
      return;
    }

    // Handle UG projects (keep existing placeholder or logic if any)

    // Handle UG/Master/12th goals - this block handled selection, now we need to handle INPUT for goal
    // We will keep this block if there are other flows using it, but `collect_12th_goal` is now input.
    // However, if we change the pushBot above to input, the response will go to `handleInputSubmit`, not `handleOptionClick`.
    // So we need to ensure `handleInputSubmit` handles 'collect_12th_goal'.

    // Let's comment this out or modify it if it's only triggered by options.
    // Since we're changing the prompt to input, `handleOptionClick` won't receive `collect_12th_goal` anymore.
    // Checking `handleInputSubmit` for goal handling...


    // Parent/Guardian priority handler
    if (stage === 'collect_parent_priority') {
      setProfileDraft((p: any) => ({ ...p, parentPriority: option }));
      setStage('collect_child_level');
      pushBot('What is your child\'s current education level?', {
        options: ['10th Grade', '12th', '10th + Diploma', 'UG', 'UG + Diploma', 'Master']
      });
      return;
    }

    // Parent - child level handler
    if (stage === 'collect_child_level') {
      setProfileDraft((p: any) => ({ ...p, childLevel: option }));
      setStage('collect_child_stream');
      pushBot('What stream/field is your child pursuing? (Optional - type "Skip" to skip)', { type: 'input', inputType: 'text' });
      return;
    }

    // Parent/Guardian child goals handler
    if (stage === 'collect_child_goals') {
      setProfileDraft((p: any) => ({ ...p, childGoals: option }));
      setStage('collect_child_understanding');
      pushBot('How would you rate your understanding of education options?', {
        options: ['Beginner', 'Intermediate', 'Advanced']
      });
      return;
    }

    // Parent/Guardian understanding handler
    if (stage === 'collect_child_understanding') {
      setProfileDraft((p: any) => ({ ...p, parentUnderstanding: option }));
      setStage('collect_phone');
      pushBot('Thank you for the information! Please enter your phone number to complete verification:', { type: 'input', inputType: 'tel' });
      return;
    }
  };

  const handleInputSubmit = async (value: string) => {
    pushUser(value);

    if (stage === 'collect_name') {
      setName(value.trim());
      setStage('collect_email');
      pushBot('Thanks! What is your email address?', { type: 'input', inputType: 'email' });
      return;
    }

    if (stage === 'collect_email') {
      setEmail(value.trim());
      setStage('collect_status');
      pushBot('What describes you best?', { options: ['Student', 'Working Professional', 'Parent / Guardian'] });
      return;
    }

    // Handle goal/purpose input
    if (stage.includes('_goal')) {
      if (stage.includes('work')) {
        setProfileDraft((p: any) => ({ ...p, careerGoal: value.trim() }));
        setStage('collect_work_target_country');
      } else {
        const level = stage.includes('ug') ? 'UG' : stage.includes('master') ? 'Master' : '12th';
        setProfileDraft((p: any) => ({ ...p, [`${level}Goal`]: value.trim() }));
        setStage(`collect_${level.toLowerCase()}_target_country` as Stage);
      }
      pushBot('Which country are you targeting? (e.g. India, USA, UK)', { type: 'input', inputType: 'text' });
      return;
    }

    // Handle target country for higher studies (Work handled separately)
    if (stage.includes('_target_country') && !stage.includes('work')) {
      const level = stage.includes('ug') ? 'UG' : stage.includes('master') ? 'Master' : stage.includes('12th') ? '12th' : 'Work';
      setProfileDraft((p: any) => ({ ...p, [`${level}TargetCountry`]: value.trim() }));

      // Goal -> Target Country -> Phone (Standardized Flow)
      setStage('collect_phone');
      pushBot('Please enter your phone number to complete verification:', { type: 'input', inputType: 'tel' });
      return;
    }

    // Handle skills collection
    if (stage.includes('_skills')) {
      const level = stage.includes('12th') ? '12th' :
        stage.includes('ug') ? 'UG' :
          stage.includes('master') ? 'Master' :
            'Work';
      setProfileDraft((p: any) => ({ ...p, [`${level}Skills`]: value.trim() }));

      // After skills, move to aptitude exams (Students) or Goal (Work)
      if (level === 'Work') {
        setStage('collect_work_goal');
        pushBot('What are your career goals?', { type: 'input', inputType: 'text' });
      } else {
        const nextStage = level === '12th' ? 'collect_12th_aptitude_exam' as Stage :
          level === 'UG' ? 'collect_ug_aptitude_exam' as Stage :
            'collect_master_aptitude_exam' as Stage;

        setStage(nextStage);
        pushBot('Have you taken any aptitude/entrance exams?', { options: ['Yes', 'No'] });
      }
      return;
    }

    if (stage === 'collect_phone') {
      const phoneVal = value.trim();
      if (phoneVal.length < 10) {
        pushBot('Please enter a valid phone number (at least 10 digits).');
        return;
      }

      setStage('awaiting_register');
      pushBot(`Sending OTP to your email (${email})...`);

      try {
        await apiService.sendOTP({
          name,
          email,
          phone: phoneVal,
          class_status: classStatus || 'Student'
        });

        setProfileDraft((p: any) => ({ ...p, phone: phoneVal }));
        setStage('collect_otp');
        pushBot('Please enter the 6-digit OTP sent to your email.', { type: 'input', inputType: 'text' });
      } catch (e: any) {
        setStage('collect_phone');
        console.error("OTP Error", e);
        const errMsg = e?.response?.data?.message || 'Failed to send OTP.';
        pushBot(`${errMsg} Please check your email and try again.`, { type: 'input', inputType: 'tel' });
      }
      return;
    }

    if (stage === 'collect_otp') {
      setStage('awaiting_verify');
      pushBot('Verifying your OTP...');
      try {
        const res = await apiService.verifyOTP(email, value.trim());
        const userId = res.user.id || res.user._id;
        setUserId(userId);

        // Store Token FIRST so updateProfile can use it
        if (typeof window !== 'undefined') {
          localStorage.setItem('cc_token', res.token);
          localStorage.setItem('cc_user', JSON.stringify({ userId, name: res.user.name, email: res.user.email }));
        }

        // Save profile data
        if (Object.keys(profileDraft).length > 0) {
          try { await apiService.updateProfile(userId, profileDraft); } catch (e) { console.error("Profile update silent fail", e); }
        }

        setStage('info_complete');
        pushBot('✅ Email Verified! Your profile is ready.');
        pushBot('Let\'s choose your assessment plan...');

        setTimeout(() => {
          navigate('/select-plan');
        }, 1500);
      } catch (e: any) {
        setStage('collect_otp');
        const errMsg = e?.response?.data?.message || 'Invalid OTP.';
        pushBot(`${errMsg} Please re-enter the OTP.`, { type: 'input', inputType: 'text' });
      }
      return;
    }



    // Handle completion year inputs
    if (stage.includes('completion_year')) {
      const year = parseInt(value);
      const currentYear = new Date().getFullYear();

      if (isNaN(year) || year < 1900 || year > currentYear + 5) {
        pushBot('Please enter a valid year between 1900 and ' + (currentYear + 5));
        return;
      }

      const level: '12th' | 'UG' | 'Master' = stage.includes('12th') ? '12th' : stage.includes('ug') ? 'UG' : 'Master';
      setProfileDraft((p: any) => ({ ...p, [`${level}CompletionYear`]: year }));

      if (level === '12th') {
        setStage('collect_12th_aptitude_exam');
        pushBot('Have you taken any aptitude exams?', { options: ['Yes', 'No'] });
      } else if (level === 'UG') {
        setStage('collect_ug_projects');
        pushBot('Tell us about your projects/internships (if any):', { type: 'input', inputType: 'text' });
      } else {
        setStage('collect_master_projects');
        pushBot('Tell us about your projects/research work (if any):', { type: 'input', inputType: 'text' });
      }
      return;
    }

    // Handle college/institution names
    if (stage.includes('college')) {
      // If user types "Change Option", go back to student stage selection
      if (value.trim().toLowerCase() === 'change option') {
        setStage('collect_student_stage');
        pushBot('Select your Student Stage', {
          options: ['10th Grade', '12th', '10th + Diploma', 'UG', 'UG + Diploma', 'Master']
        });
        return;
      }

      if (!value.trim()) {
        pushBot('Please enter your college/institution name');
        return;
      }

      const level = stage.includes('12th') ? '12th' : stage.includes('ug') ? 'UG' : 'Master';
      setProfileDraft((p: any) => ({ ...p, [`${level}College`]: value.trim() }));
      // After collecting college name, ask for the country (free text input)
      const countryStage = level === '12th' ? 'collect_12th_country' as Stage :
        level === 'UG' ? 'collect_ug_country' as Stage :
          'collect_master_country' as Stage;
      setStage(countryStage);
      pushBot('Which country is your college/institution in?', { type: 'input', inputType: 'text' });
      return;
    }

    // Handle country input (autocomplete input)
    if (stage.includes('_country')) {
      const level = stage.includes('12th') ? '12th' : stage.includes('ug') ? 'UG' : 'Master';
      setProfileDraft((p: any) => ({ ...p, [`${level}Country`]: value.trim() }));

      if (level === '12th') {
        setStage('collect_12th_aptitude_exam');
        pushBot('Have you taken any aptitude exams?', { options: ['Yes', 'No'] });
      } else if (level === 'UG') {
        setStage('collect_ug_aptitude_exam');
        pushBot('Have you taken any entrance exams?', { options: ['Yes', 'No'] });
      } else {
        setStage('collect_master_completion_year');
        pushBot('What year did you complete your studies?', { type: 'input', inputType: 'number' });
      }
      return;
    }


    // Handle aptitude exam responses
    if (stage.includes('aptitude_exam')) {
      const level = stage.includes('12th') ? '12th' : stage.includes('ug') ? 'UG' : 'Master';
      setProfileDraft((p: any) => ({ ...p, [`${level}HasAptitude`]: value.toLowerCase() === 'yes' }));

      if (value.toLowerCase() === 'yes') {
        const nextStage = level === '12th' ? 'collect_12th_aptitude_details' as Stage :
          level === 'UG' ? 'collect_ug_aptitude_details' as Stage :
            'collect_master_aptitude_details' as Stage;
        setStage(nextStage);
        pushBot('Which exam(s) did you take?', { type: 'input', inputType: 'text' });
      } else {
        const nextStage = level === '12th' ? 'collect_12th_english_exam' as Stage :
          level === 'UG' ? 'collect_ug_english_exam' as Stage :
            'collect_pg_english_exam' as Stage;
        setStage(nextStage);
        pushBot('Have you taken any English proficiency exams (IELTS/TOEFL)?', { options: ['Yes', 'No'] });
      }
      return;
    }

    // Handle aptitude exam details
    if (stage.includes('aptitude_details')) {
      const level = stage.includes('12th') ? '12th' : stage.includes('ug') ? 'UG' : 'PG';
      setProfileDraft((p: any) => ({ ...p, [`${level}AptitudeExams`]: value.trim() }));

      const nextStage = level === '12th' ? 'collect_12th_aptitude_score' as Stage :
        level === 'UG' ? 'collect_ug_aptitude_score' as Stage :
          'collect_pg_aptitude_score' as Stage;
      setStage(nextStage);
      pushBot('What was your score?', { type: 'input', inputType: 'text' });
      return;
    }

    // Handle aptitude scores
    if (stage.includes('aptitude_score')) {
      const level = stage.includes('12th') ? '12th' : stage.includes('ug') ? 'UG' : 'PG';
      const score = parseInt(value.trim());

      if (isNaN(score) || score < 0 || score > 100) {
        pushBot('Please enter a valid score between 0 and 100');
        return;
      }

      setAptitudeScore(score);
      setProfileDraft((p: any) => ({ ...p, [`${level}AptitudeScores`]: score }));

      const nextStage = level === '12th' ? 'collect_12th_english_exam' as Stage :
        level === 'UG' ? 'collect_ug_english_exam' as Stage :
          'collect_pg_english_exam' as Stage;
      setStage(nextStage);
      pushBot(`Your aptitude score has been recorded (${score}/100).
      
Have you taken any English proficiency exams (IELTS/TOEFL)?`, { options: ['Yes', 'No'] });
      return;
    }

    // Handle parent - child stream (optional)
    if (stage === 'collect_child_stream') {
      if (value.trim().toLowerCase() !== 'skip') {
        setProfileDraft((p: any) => ({ ...p, childStream: value.trim() }));
      }
      // CHANGED: Go to School Name input
      setStage('collect_child_school');
      pushBot('What is the name of your child\'s School/College?', { type: 'input', inputType: 'text' });
      return;
    }

    // Handle work-related inputs
    if (stage === 'collect_work_company') {
      setProfileDraft((p: any) => ({ ...p, workCompany: value.trim() }));
      setStage('collect_work_role');
      pushBot('What is your current role?', {
        options: [
          'Software Engineer', 'Data Scientist', 'Product Manager',
          'Business Analyst', 'Marketing Manager', 'Other'
        ]
      });
      return;
    }

    if (stage === 'collect_work_college') {
      if (!value.trim()) {
        pushBot('Please enter your college/university name');
        return;
      }
      setProfileDraft((p: any) => ({ ...p, college: value.trim() }));
      // Resume original flow
      setStage('collect_work_exp');
      pushBot('Years of Experience', { options: ['1–3', '3–5', '5+'] });
      return;
    }

    if (stage === 'collect_child_school') {
      if (!value.trim()) {
        pushBot('Please enter the school/college name');
        return;
      }
      setProfileDraft((p: any) => ({ ...p, childCollege: value.trim() })); // Using childCollege or school field
      // Resume original flow
      setStage('collect_child_goals');
      pushBot('What are your expectations for your child\'s learning path?', {
        options: ['Career-oriented', 'Academic Excellence', 'Skill Development', 'Holistic Growth']
      });
      return;
    }



    if (stage === 'collect_work_target_country') {
      setProfileDraft((p: any) => ({ ...p, workTargetCountry: value.trim() }));
      setStage('collect_work_switch');
      pushBot('Are you considering a career switch?', { options: ['Yes', 'No'] });
      return;
    }

    if (stage === 'collect_work_target_role') {
      setProfileDraft((p: any) => ({ ...p, targetRole: value.trim() }));
      setStage('collect_phone');
      pushBot('Please enter your phone number to complete verification:', { type: 'input', inputType: 'tel' });
      return;
    }

    // Handle English exam scores
    if (stage.includes('english_score')) {
      const level = stage.includes('12th') ? '12th' : stage.includes('ug') ? 'UG' : 'PG';
      const score = parseInt(value.trim());

      // Basic validation for common English test scores
      if (isNaN(score) || score < 0 || score > 100) {
        pushBot('Please enter a valid score between 0 and 100');
        return;
      }

      setEnglishScore(score);
      setProfileDraft((p: any) => ({ ...p, [`${level}EnglishScore`]: score }));

      // After English score, route based on education level
      if (level === '12th') {
        setStage('collect_12th_academic');
        pushBot(`Your English score has been recorded (${score}/100).
        
What is your academic performance (percentage/CGPA)?`, { type: 'input', inputType: 'text' });
      } else if (level === 'UG') {
        setStage('collect_ug_goal');
        pushBot(`Your English score has been recorded (${score}/100).
        
What are your career goals after graduation?`, { type: 'input', inputType: 'text' });
      } else {
        setStage('collect_master_goal');
        pushBot(`Your English score has been recorded (${score}/100).
        
What are your career goals?`, { type: 'input', inputType: 'text' });
      }
      return;
    }

    // Handle academic score input
    if (stage === 'collect_12th_academic') {
      const score = value.trim();
      if (!score) {
        pushBot('Please enter your academic score');
        return;
      }

      setProfileDraft((p: any) => ({ ...p, academicScore: score }));
      setStage('collect_phone');
      pushBot('Please enter your phone number to complete verification:', { type: 'input', inputType: 'tel' });
      return;
    }

    // Handle project details
    if (stage === 'collect_ug_projects') {
      if (!value.trim()) {
        pushBot('Please provide some details about your projects');
        return;
      }

      setProfileDraft((p: any) => ({ ...p, projects: value.trim() }));
      setStage('collect_ug_skills');
      pushBot('What skills do you have? (technical, academic, communication, tools)', { type: 'input', inputType: 'text' });
      return;
    }

    if (stage === 'collect_master_projects') {
      if (!value.trim()) {
        pushBot('Please provide some details about your projects');
        return;
      }

      setProfileDraft((p: any) => ({ ...p, projects: value.trim() }));
      setStage('collect_master_skills');
      pushBot('What skills do you have? (technical, academic, communication, tools)', { type: 'input', inputType: 'text' });
      return;
    }

    // [ALL YOUR OTHER INPUT HANDLERS - keeping them exactly as they are]
    // I'm truncating here for space, but include ALL your existing handlers
  };

  const showFreeInput = useMemo(() => {
    const inputStages: Stage[] = [
      'collect_name',
      'collect_email',
      'collect_phone',
      'collect_otp',
      'collect_12th_college',
      'collect_12th_country',
      'collect_12th_completion_year',
      'collect_12th_aptitude_details',
      'collect_12th_aptitude_score',
      'collect_12th_english_score',
      'collect_12th_academic',
      'collect_ug_college',
      'collect_ug_country',
      'collect_ug_completion_year',
      'collect_ug_projects',
      'collect_ug_aptitude_details',
      'collect_ug_aptitude_score',
      'collect_ug_english_score',
      'collect_master_college',
      'collect_master_country',
      'collect_master_completion_year',
      'collect_master_projects',
      'collect_master_aptitude_details',
      'collect_master_aptitude_score',
      'collect_master_aptitude_score',
      'collect_master_english_score',
      'collect_work_college',
      'collect_work_company',
      'collect_work_skills',
      'collect_work_target_country',
      'collect_work_target_role',
      'collect_12th_goal',
      'collect_ug_goal',
      'collect_master_goal',
      'collect_work_goal',
      'collect_child_school'
    ];
    return inputStages.includes(stage);
  }, [stage]);

  const sendFreeText = (text: string) => {
    const t = text.trim();
    if (!t) return;
    pushUser(t);

    if (stage === 'welcome' && t.toLowerCase().includes('start')) {
      setStage('collect_name');
      pushBot('Great! What is your full name?', { type: 'input', inputType: 'text' });
    } else if (stage === 'info_complete' && t.toLowerCase().includes('start')) {
      console.log("🚀 [ChatPage] Starting RIASEC test");
      navigate('/psychometric/ria-sec', { state: { userId } });
    } else {
      pushBot("I'm guiding you through the flow. Use the options or fields above.");
    }
  };

  return (
    <div className="min-vh-100 font-sans d-flex flex-column bg-surface">

      {/* Navbar (Unified Theme) */}
      <nav className="navbar navbar-expand-lg navbar-light bg-surface py-4 px-4 sticky-top">
        <div className="container bg-white rounded-pill shadow-sm py-2 px-4 border" style={{ maxWidth: '1200px' }}>
          <a className="navbar-brand d-flex align-items-center gap-2" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            <span className="fw-bolder text-dark" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.5rem', letterSpacing: '-1px' }}>
              NPathways <span className="fw-light text-secondary">Global</span>
            </span>
          </a>

          <div className="d-none d-lg-flex gap-4 mx-auto fw-medium small text-dark text-uppercase tracking-wide">
            <button onClick={() => navigate('/')} className="btn-ghost text-decoration-none text-dark hover-opacity p-0 border-0 bg-transparent">Home</button>
            <button className="btn-ghost text-decoration-none text-dark hover-opacity p-0 border-0 bg-transparent">About</button>
            <button className="btn-ghost text-decoration-none text-dark hover-opacity p-0 border-0 bg-transparent">Services</button>
            <button className="btn-ghost text-decoration-none text-dark hover-opacity p-0 border-0 bg-transparent">Products</button>
            <button className="btn-ghost text-decoration-none text-dark hover-opacity p-0 border-0 bg-transparent">Contact</button>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="small text-muted d-none d-md-block">
              {name ? `Hi, ${name}` : 'Guest'}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-grow-1 container pb-4 d-flex flex-column" style={{ maxWidth: '800px' }}>
        <div className="text-center mb-4 mt-2">
          <small className="text-secondary fw-bold text-uppercase tracking-widest" style={{ fontSize: '0.75rem', letterSpacing: '2px' }}>AI Career Counselling</small>
          <h2 className="display-6 fw-bold mt-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            {stage === 'welcome' ? 'Start Your Journey' : 'Tell Us About Yourself'}
          </h2>
        </div>

        <div className="glass-card shadow-sm border-0 d-flex flex-column flex-grow-1 position-relative overflow-hidden" style={{ minHeight: '60vh' }}>

          {/* Messages Area */}
          <div className="flex-grow-1 overflow-auto px-3 py-4 d-flex flex-column gap-3 custom-scrollbar" style={{ scrollBehavior: 'smooth' }}>
            <AnimatePresence>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ width: '100%' }}
                  layout
                >
                  <ChatBubble
                    message={msg}
                    onOptionClick={(option) => {
                      if (stage === 'info_complete' && option === 'Start RIASEC Test') {
                        navigate('/psychometric/ria-sec', { state: { userId } });
                      } else if (stage === 'info_complete' && option === 'Go to Dashboard') {
                        navigate('/completion');
                      } else {
                        handleOptionClick(option);
                      }
                    }}
                    onInputSubmit={handleInputSubmit}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Input Wrapper - Only show if simple free text is needed/allowed */}
          <div className="p-3 border-top bg-white">
            {!showFreeInput && (
              <InputField onSend={sendFreeText} placeholder="Type or select an option above..." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
