// src/pages/Psychometric/RiaSecPage.tsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Loader2, Briefcase, Code, Heart, Palette, Leaf, Gavel, HelpCircle } from 'lucide-react';
import { apiService } from '../../services/api';

type Question = {
  id: string | number;
  question: string;
  options?: string[];
  category?: string;
};

type AnswerMap = Record<string | number, number>;

export default function RiaSecPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userIdFromState = (location.state as any)?.userId;
  const saved = typeof window !== "undefined" ? localStorage.getItem("cc_user") : null;
  const savedUserId = saved ? (JSON.parse(saved)?.userId as string | undefined) : undefined;
  const userId = userIdFromState ?? savedUserId;

  const [step, setStep] = useState<'intro' | 'test'>('intro');
  // const [selectedInterest, setSelectedInterest] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedRef = useRef(false);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!userId) {
      navigate("/information");
      return;
    }

    if (hasLoadedRef.current) return;

    async function loadQuestions() {
      setLoading(true);
      setError(null);
      try {
        const questionsUrl = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/test/questions?type=riasec`;
        const res = await fetch(questionsUrl);
        if (!res.ok) throw new Error(`Failed to load questions (${res.status})`);

        const data: any = await res.json();
        const q: Question[] = Array.isArray(data) ? data : data.questions ?? [];
        setQuestions(q);
        hasLoadedRef.current = true;

        const initial: AnswerMap = {};
        q.forEach((qq) => {
          const key = typeof qq.id === 'number' ? qq.id : qq.id;
          initial[key] = 0;
        });
        setAnswers(initial);
      } catch (err: any) {
        console.error("RiaSecPage load error:", err);
        setError(err?.message || "Unable to load questions. Try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [userId, navigate]);

  const handleInterestSelect = async (interest: string) => {
    // setSelectedInterest(interest);
    setLoading(true);
    try {
      if (userId) {
        // Update profile with "desiredCourse" or "careerGoal" to hint the AI
        await apiService.updateProfile(userId, { desiredCourse: interest });
      }
      setStep('test');
    } catch (err) {
      console.error("Failed to save interest", err);
      // Proceed anyway
      setStep('test');
    } finally {
      setLoading(false);
    }
  };

  const interests = [
    { id: 'Technology', label: 'Technology & IT', icon: Code, color: 'text-primary', bg: 'bg-primary' },
    { id: 'Business', label: 'Business & Management', icon: Briefcase, color: 'text-success', bg: 'bg-success' },
    { id: 'Medical', label: 'Medical & Healthcare', icon: Heart, color: 'text-danger', bg: 'bg-danger' },
    { id: 'Arts', label: 'Arts & Types', icon: Palette, color: 'text-warning', bg: 'bg-warning' },
    { id: 'Science', label: 'Science & Research', icon: Leaf, color: 'text-info', bg: 'bg-info' },
    { id: 'Law', label: 'Law & Humanities', icon: Gavel, color: 'text-secondary', bg: 'bg-secondary' },
    { id: 'Undecided', label: 'I am not sure yet', icon: HelpCircle, color: 'text-muted', bg: 'bg-dark' },
  ];

  function setAnswer(questionId: string | number, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        scrollToCurrentQuestion();
      }
    }, 300);
  }

  function scrollToCurrentQuestion() {
    const element = questionRefs.current[currentQuestionIndex + 1];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function allAnswered(): boolean {
    if (questions.length === 0) return false;
    return questions.every((q) => {
      const key = typeof q.id === 'number' ? q.id : q.id;
      return typeof answers[key] === "number" && answers[key] > 0;
    });
  }

  function getProgress(): number {
    if (questions.length === 0) return 0;
    const answered = questions.filter((q) => {
      const key = typeof q.id === 'number' ? q.id : q.id;
      return answers[key] > 0;
    }).length;
    return Math.round((answered / questions.length) * 100);
  }

  function mapAnswerToLikert(value: number): string {
    const likertScale = [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree"
    ];
    return likertScale[value - 1] || "Neutral";
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);

    if (!allAnswered()) {
      setError("Please answer all questions before continuing.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        userId,
        section: "riasec",
        answers: questions.map((q) => ({
          questionId: typeof q.id === 'string' ? parseInt(q.id) : q.id,
          answer: mapAnswerToLikert(answers[q.id]),
        })),
        completed: true,
      };

      const submitUrl = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/test/submit`;
      const res = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || `Submission failed (${res.status})`);
      }

      navigate("/assessment-transition", { state: { userId, completedTestId: 'riasec' } });
    } catch (err: any) {
      console.error("RiaSecPage submit error:", err);
      setError(err?.message || "Failed to submit answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const progress = getProgress();

  if (step === 'intro') {
    return (
      <div className="modern-container">
        <div className="modern-bg-orb orb-1"></div>
        <div className="container position-relative z-1" style={{ maxWidth: '800px' }}>
          <div className="text-center mb-5 pt-5">
            <h1 className="fw-bold mb-3">Before we begin</h1>
            <p className="lead text-secondary">What category interests you the most right now?</p>
            <p className="small text-muted">This helps our AI personalize your career suggestions.</p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Loader2 className="spin text-primary mb-3" size={48} />
              <p>Saving preference...</p>
            </div>
          ) : (
            <div className="row g-3 justify-content-center">
              {interests.map((interest) => (
                <div key={interest.id} className="col-md-4 col-sm-6">
                  <button
                    onClick={() => handleInterestSelect(interest.id)}
                    className="btn btn-white w-100 p-4 h-100 border text-start hover-shadow transition-all rounded-4 d-flex flex-column align-items-center justify-content-center gap-3"
                  >
                    <div className={`p-3 rounded-circle ${interest.bg} bg-opacity-10 ${interest.color}`}>
                      <interest.icon size={32} />
                    </div>
                    <span className="fw-bold text-dark">{interest.label}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="text-center mt-5">
            <button onClick={() => setStep('test')} className="btn btn-link text-secondary">Skip this step</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-container">
      {/* Background Orbs */}
      <div className="modern-bg-orb orb-1"></div>
      <div className="modern-bg-orb orb-2"></div>
      <div className="modern-bg-orb orb-3"></div>

      <div className="container position-relative z-1" style={{ maxWidth: '900px' }}>
        {/* Header */}
        <div className="text-center mb-5">
          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill mb-3">
            STEP 1 of 3
          </span>
          <h1 className="fw-bold mb-2">RIASEC Assessment</h1>
          <p className="subtitle">Discover your career personality type</p>
        </div>

        {/* Progress Bar */}
        <div className="glass-card mb-4 p-4 d-flex align-items-center justify-content-between gap-4">
          <div className="w-100">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-secondary small fw-bold">PROGRESS</span>
              <span className="text-primary small fw-bold">{progress}%</span>
            </div>
            <div className="progress-container">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <div className="text-end" style={{ minWidth: '80px' }}>
            <span className="h4 fw-bold d-block mb-0">{questions.filter(q => answers[q.id] > 0).length}</span>
            <span className="text-secondary small">of {questions.length}</span>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="text-center py-5">
            <Loader2 className="spin text-primary mb-3" size={48} />
            <p className="text-secondary">Loading Assessment...</p>
          </div>
        ) : error ? (
          <div className="glass-card border-danger border-opacity-25 p-4 text-center">
            <AlertCircle className="text-danger mb-3" size={48} />
            <p className="text-danger mb-0">{error}</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="glass-card p-4 text-center">
            <p className="text-secondary">No questions available</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Scale Guide */}
            <div className="glass-card mb-4 p-3">
              <div className="row text-center g-2">
                {[
                  { num: 1, text: "Strongly Disagree", color: "text-danger" },
                  { num: 2, text: "Disagree", color: "text-warning" },
                  { num: 3, text: "Neutral", color: "text-secondary" },
                  { num: 4, text: "Agree", color: "text-info" },
                  { num: 5, text: "Strongly Agree", color: "text-success" }
                ].map(scale => (
                  <div key={scale.num} className="col">
                    <div className={`h4 fw-bold mb-0 ${scale.color}`}>{scale.num}</div>
                    <div className="small text-muted" style={{ fontSize: '0.7rem' }}>{scale.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Questions List */}
            <div className="d-flex flex-column gap-3 mb-5">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] > 0;
                const isCurrent = idx === currentQuestionIndex;

                return (
                  <div
                    key={q.id}
                    ref={el => { questionRefs.current[idx] = el; }}
                    className={`glass-card p-4 transition-all ${isCurrent ? 'border-primary' : ''}`}
                    style={{
                      opacity: isCurrent ? 1 : 0.7,
                      transform: isCurrent ? 'scale(1.02)' : 'scale(1)',
                      borderColor: isCurrent ? 'var(--primary)' : 'var(--glass-border)'
                    }}
                    onClick={() => setCurrentQuestionIndex(idx)}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <span className="badge bg-white bg-opacity-5 text-secondary border border-white border-opacity-10 rounded-pill">
                        Question {idx + 1}
                      </span>
                      {isAnswered && <CheckCircle size={18} className="text-success" />}
                    </div>

                    <h5 className="mb-4 fw-medium">{q.question}</h5>

                    <div className="d-flex gap-2 justify-content-between">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          className={`btn flex-grow-1 ${answers[q.id] === val ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnswer(q.id, val);
                          }}
                          disabled={submitting}
                          style={{ height: '48px', fontSize: '1.2rem', fontWeight: 600 }}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Footer */}
            <div className="glass-card p-4 sticky-bottom mt-4" style={{ bottom: '2rem', zIndex: 100 }}>
              <div className="d-flex justify-content-between align-items-center">
                <button
                  type="button"
                  className="btn-ghost d-flex align-items-center gap-2"
                  onClick={() => setStep('intro')}
                  disabled={submitting}
                >
                  <ArrowLeft size={18} /> Back
                </button>

                {error && <span className="text-danger small fw-bold">{error}</span>}

                <button
                  type="submit"
                  className="btn-primary d-flex align-items-center gap-2"
                  disabled={submitting || !allAnswered()}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="spin" size={18} /> Submitting...
                    </>
                  ) : (
                    <>
                      Next Section <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
              {!allAnswered() && (
                <div className="text-center mt-2">
                  <small className="text-warning">Please answer all {questions.length} questions to continue</small>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
