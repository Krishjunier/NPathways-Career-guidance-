// src/pages/Psychometric/IntelligencePage.tsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Loader2, Brain } from 'lucide-react';

type Question = {
  id: string | number;
  question: string;
  options?: string[];
  category?: string;
};

type AnswerMap = Record<string | number, number>;

export default function IntelligencePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userIdFromState = (location.state as any)?.userId;
  const saved = typeof window !== "undefined" ? localStorage.getItem("cc_user") : null;
  const savedUserId = saved ? (JSON.parse(saved)?.userId as string | undefined) : undefined;
  const userId = userIdFromState ?? savedUserId;

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
        const res = await fetch("https://npathways-career-guidance.onrender.com/api/test/questions?type=intelligence");
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
        console.error("IntelligencePage load error:", err);
        setError(err?.message || "Unable to load questions. Try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        section: "intelligence",
        answers: questions.map((q) => ({
          questionId: typeof q.id === 'string' ? parseInt(q.id) : q.id,
          answer: mapAnswerToLikert(answers[q.id]),
        })),
        completed: true,
      };

      const res = await fetch("https://npathways-career-guidance.onrender.com/api/test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || `Submission failed (${res.status})`);
      }

      navigate("/psychometric/emotional", { state: { userId } });
    } catch (err: any) {
      console.error("IntelligencePage submit error:", err);
      setError(err?.message || "Failed to submit answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const progress = getProgress();

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
            STEP 2 of 3
          </span>
          <div className="d-flex align-items-center justify-content-center gap-3 mb-2">
            <Brain size={32} className="text-primary" />
            <h1 className="fw-bold mb-0">Intelligence Assessment</h1>
          </div>
          <p className="subtitle">Evaluate your multiple intelligences</p>
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

        {/* Content */}
        {loading ? (
          <div className="text-center py-5">
            <Loader2 className="spin text-primary mb-3" size={48} />
            <p className="text-secondary">Loading Intelligence Test...</p>
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
                    {q.category && <p className="text-secondary small mb-3">{q.category}</p>}

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

            {/* Footer */}
            <div className="glass-card p-4 sticky-bottom mt-4" style={{ bottom: '2rem', zIndex: 100 }}>
              <div className="d-flex justify-content-between align-items-center">
                <button
                  type="button"
                  className="btn-ghost d-flex align-items-center gap-2"
                  onClick={() => navigate("/psychometric/ria-sec", { state: { userId } })}
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
