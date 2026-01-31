// src/pages/Psychometric/WorkStylePage.tsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Loader2 } from 'lucide-react';
import { apiService } from '../../services/api';

type Question = {
    id: string | number;
    question: string;
    options?: string[];
    category?: string;
};

type AnswerMap = Record<string | number, number>;

export default function WorkStylePage() {
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
            navigate("/dashboard");
            return;
        }

        if (hasLoadedRef.current) return;

        async function loadQuestions() {
            setLoading(true);
            setError(null);
            try {
                const q = await apiService.getTestQuestions('workstyle');
                setQuestions(q);
                hasLoadedRef.current = true;

                const initial: AnswerMap = {};
                q.forEach((qq) => {
                    initial[qq.id] = 0;
                });
                setAnswers(initial);
            } catch (err: any) {
                console.error("WorkStylePage load error:", err);
                setError(err?.message || "Unable to load questions.");
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
        return questions.every((q) => answers[q.id] > 0);
    }

    function mapAnswerToLikert(value: number): string {
        const likertScale = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
        return likertScale[value - 1] || "Neutral";
    }

    async function handleSubmit(e?: React.FormEvent) {
        if (e) e.preventDefault();
        if (!allAnswered()) return;

        setSubmitting(true);
        try {
            const payload = {
                userId: userId!,
                section: "workstyle",
                answers: questions.map((q) => ({
                    questionId: typeof q.id === 'string' ? parseInt(q.id) : q.id,
                    answer: mapAnswerToLikert(answers[q.id]),
                })),
                completed: true,
            };

            await apiService.submitTestAnswers(userId!, payload.answers as any);

            const res = await fetch("https://npathways-career-guidance.onrender.com/api/test/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Submission failed");

            navigate("/assessment-transition", { state: { userId, completedTestId: 'workstyle' } });

        } catch (err: any) {
            setError(err?.message || "Failed to submit.");
        } finally {
            setSubmitting(false);
        }
    }

    const progress = questions.length ? Math.round((questions.filter(q => answers[q.id] > 0).length / questions.length) * 100) : 0;

    return (
        <div className="modern-container">
            <div className="modern-bg-orb orb-1"></div>
            <div className="container position-relative z-1" style={{ maxWidth: '900px' }}>
                <div className="text-center mb-5">
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill mb-3">
                        CLARITY EXCLUSIVE
                    </span>
                    <h1 className="fw-bold mb-2">Work Style Assessment</h1>
                    <p className="subtitle">Understand your professional preferences</p>
                </div>

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
                </div>

                {error && (
                    <div className="alert alert-danger mb-4">
                        {error}
                    </div>
                )}

                {loading ? <div className="text-center py-5"><Loader2 className="spin" /></div> : (
                    <form onSubmit={handleSubmit}>
                        <div className="d-flex flex-column gap-3 mb-5">
                            {questions.map((q, idx) => {
                                const isCurrent = idx === currentQuestionIndex;
                                return (
                                    <div key={q.id} ref={el => { questionRefs.current[idx] = el; }}
                                        className={`glass-card p-4 transition-all ${isCurrent ? 'border-primary' : ''}`}
                                        onClick={() => setCurrentQuestionIndex(idx)}
                                        style={{ opacity: isCurrent ? 1 : 0.7 }}
                                    >
                                        <h5 className="mb-4 fw-medium">{q.question}</h5>
                                        <div className="d-flex gap-2 justify-content-between">
                                            {[1, 2, 3, 4, 5].map((val) => (
                                                <button key={val} type="button" className={`btn flex-grow-1 ${answers[q.id] === val ? 'btn-primary' : 'btn-secondary'}`} onClick={(e) => { e.stopPropagation(); setAnswer(q.id, val); }}>{val}</button>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="glass-card p-4 sticky-bottom mt-4">
                            <div className="d-flex justify-content-between">
                                <button type="button" className="btn btn-ghost" onClick={() => navigate("/assessment-transition")}><ArrowLeft size={18} /> Back</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting || !allAnswered()}>{submitting ? 'Submitting...' : 'Complete Assessment'}</button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
