import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Loader2, Cpu, Calculator, Lightbulb } from 'lucide-react';

type Question = {
    id: string | number;
    question: string;
    options?: string[];
    category?: string;
};

type AnswerMap = Record<string | number, number>;

export default function AptitudePage() {
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
                // Fetching 'intelligence' questions as they map to aptitude (logical, math, spatial)
                const questionsUrl = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/test/questions?type=intelligence`;
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
                console.error("AptitudePage load error:", err);
                setError(err?.message || "Unable to load questions. Try again later.");
            } finally {
                setLoading(false);
            }
        }

        loadQuestions();
    }, [userId, navigate]);

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
                section: "intelligence", // Mapping aptitude to intelligence section in backend
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

            navigate("/assessment-transition", { state: { userId, completedTestId: 'aptitude' } });
        } catch (err: any) {
            console.error("AptitudePage submit error:", err);
            setError(err?.message || "Failed to submit answers. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    const progress = getProgress();

    return (
        <div className="min-vh-100 bg-surface d-flex flex-column font-sans" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>

            {/* Abstract Background Shapes */}
            <div className="position-absolute top-0 end-0 p-5 mt-5">
                <Calculator className="text-secondary opacity-10" size={300} />
            </div>

            <div className="container position-relative z-1 py-5" style={{ maxWidth: '900px' }}>

                {/* Header */}
                <div className="text-center mb-5">
                    <span className="badge bg-white shadow-sm text-primary border px-3 py-2 rounded-pill mb-3 fw-bold">
                        SECTION 2
                    </span>
                    <div className="d-flex align-items-center justify-content-center gap-3 mb-2">
                        <Cpu size={40} className="text-primary" />
                        <h1 className="display-5 fw-bold mb-0 text-dark">Aptitude Assessment</h1>
                    </div>
                    <p className="lead text-secondary">Discover your logical, numerical, and spatial reasoning strengths.</p>
                </div>

                {/* Progress Bar */}
                <div className="glass-card mb-4 p-4 d-flex align-items-center justify-content-between gap-4 bg-white shadow-sm border-0 rounded-4">
                    <div className="w-100">
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-secondary small fw-bold tracking-wide">PROGRESS</span>
                            <span className="text-primary small fw-bold">{progress}%</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                            <div
                                className="progress-bar bg-primary rounded-pill transition-all"
                                role="progressbar"
                                style={{ width: `${progress}%`, transition: 'width 0.5s ease' }}
                            ></div>
                        </div>
                    </div>
                    <div className="text-end ps-3 border-start">
                        <span className="h4 fw-bold d-block mb-0 text-dark">{questions.filter(q => answers[q.id] > 0).length}</span>
                        <span className="text-muted small">of {questions.length}</span>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-5">
                        <Loader2 className="spin text-primary mb-3" size={48} />
                        <p className="text-secondary">Loading Aptitude Questions...</p>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger shadow-sm border-0 rounded-4 p-4 text-center">
                        <AlertCircle className="mb-3" size={32} />
                        <p className="mb-0 fw-bold">{error}</p>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="card border-0 shadow-sm p-5 text-center rounded-4">
                        <p className="text-secondary">No questions available</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>

                        {/* Guide */}
                        <div className="alert alert-light border-0 shadow-sm rounded-4 mb-4 d-flex align-items-center gap-3">
                            <Lightbulb className="text-warning flex-shrink-0" size={24} />
                            <p className="mb-0 small text-secondary">
                                Answer honestly based on your comfort level with each task. There are no right or wrong answers—this measures your natural inclination.
                            </p>
                        </div>

                        {/* Questions List */}
                        <div className="d-flex flex-column gap-4 mb-5">
                            {questions.map((q, idx) => {
                                const isAnswered = answers[q.id] > 0;
                                const isCurrent = idx === currentQuestionIndex;

                                return (
                                    <div
                                        key={q.id}
                                        ref={el => { questionRefs.current[idx] = el; }}
                                        className={`card border-0 transition-all rounded-4 ${isCurrent ? 'shadow-lg ring-2 ring-primary' : 'shadow-sm'}`}
                                        style={{
                                            transform: isCurrent ? 'scale(1.01)' : 'scale(1)',
                                            zIndex: isCurrent ? 10 : 1,
                                            borderLeft: isCurrent ? '4px solid var(--bs-primary)' : 'none'
                                        }}
                                        onClick={() => setCurrentQuestionIndex(idx)}
                                    >
                                        <div className="card-body p-4">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <span className="badge bg-light text-secondary rounded-pill">
                                                    Question {idx + 1}
                                                </span>
                                                {isAnswered && <CheckCircle size={20} className="text-success" />}
                                            </div>

                                            <h5 className="mb-4 fw-bold text-dark">{q.question}</h5>

                                            <div className="d-flex gap-2 justify-content-between flex-wrap">
                                                {[1, 2, 3, 4, 5].map((val) => (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        className={`btn flex-grow-1 rounded-3 py-3 fw-bold transition-all ${answers[q.id] === val
                                                            ? 'btn-primary shadow'
                                                            : 'btn-light text-secondary hover-bg-gray-100'
                                                            }`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAnswer(q.id, val);
                                                        }}
                                                        disabled={submitting}
                                                    >
                                                        {val}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="d-flex justify-content-between mt-2 px-1">
                                                <small className="text-muted">Disagree</small>
                                                <small className="text-muted">Agree</small>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="card border-0 shadow-lg p-3 sticky-bottom rounded-4 bg-white" style={{ bottom: '2rem', zIndex: 100 }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <button
                                    type="button"
                                    className="btn btn-link text-decoration-none text-secondary fw-bold d-flex align-items-center gap-2"
                                    onClick={() => navigate("/psychometric/ria-sec", { state: { userId } })}
                                    disabled={submitting}
                                >
                                    <ArrowLeft size={18} /> Previous
                                </button>

                                {error && <span className="text-danger small fw-bold">{error}</span>}

                                <button
                                    type="submit"
                                    className="btn btn-dark rounded-pill px-5 py-3 fw-bold d-flex align-items-center gap-2 shadow-sm hover-scale"
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
                        </div>

                    </form>
                )}
            </div>
        </div>
    );
}
