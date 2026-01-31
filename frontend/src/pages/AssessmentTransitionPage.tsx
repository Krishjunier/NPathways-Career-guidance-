import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Trophy, Star } from 'lucide-react';
import { getNextAssessment } from '../utils/assessmentFlow';

const AssessmentTransitionPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { userId, completedTestId } = location.state || {};

    // Fallback: Try to read plan from localStorage if not available in state (though logic suggests checking backend is better, frontend state is faster)
    // We assume the user has a plan.
    const [nextTest, setNextTest] = useState<any>(null);

    useEffect(() => {
        // 1. Determine Plan
        // Priority: State -> LocalStorage bundle check -> LocalStorage generic user -> default 'free'
        let currentPlan = 'free';
        const localUser = localStorage.getItem('cc_user');
        if (localUser) {
            const user = JSON.parse(localUser);
            if (user.purchasedBundles?.includes('compass_bundle')) currentPlan = 'compass';
            else if (user.purchasedBundles?.includes('clarity_bundle')) currentPlan = 'clarity';
        }

        // Also check if we just bought something and it's in local storage but not user object yet
        if (localStorage.getItem(`premium_plan_${userId}`) === 'compass_bundle') currentPlan = 'compass';
        if (localStorage.getItem(`premium_plan_${userId}`) === 'clarity_bundle') currentPlan = 'clarity';

        // 2. Determine Next Test
        if (completedTestId) {
            const next = getNextAssessment(currentPlan, completedTestId);
            setNextTest(next);
        } else {
            // If accessed directly without completedTestId, maybe redirect to dashboard?
            // Or try to find first incomplete?
            // For now, let's just redirect to dashboard if no context
            navigate('/dashboard');
        }

    }, [userId, completedTestId, navigate]);

    if (!nextTest) {
        // If no next test (flow complete), show "All Done" screen
        return (
            <div className="min-vh-100 bg-surface flex-center p-4">
                <div className="glass-card p-5 text-center max-w-md w-100">
                    <div className="badge bg-success bg-opacity-10 text-success p-3 rounded-circle mb-4">
                        <Trophy size={48} />
                    </div>
                    <h1 className="h3 fw-bold mb-3">Assessment Complete!</h1>
                    <p className="text-secondary mb-4">You have completed all assessments for your current plan.</p>
                    <button onClick={() => navigate(`/profile/${userId}`)} className="btn btn-primary w-100 py-3 rounded-3 fw-bold">
                        View Your Report
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-surface flex-center p-4 position-relative overflow-hidden">
            {/* Background decoration */}
            <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0 }}>
                <div className="position-absolute top-0 end-0 bg-primary opacity-5 rounded-circle" style={{ width: '400px', height: '400px', margin: '-100px' }}></div>
                <div className="position-absolute bottom-0 start-0 bg-secondary opacity-5 rounded-circle" style={{ width: '300px', height: '300px', margin: '-50px' }}></div>
            </div>

            <div className="glass-card p-5 text-center max-w-lg w-100 position-relative" style={{ zIndex: 1, maxWidth: '600px' }}>
                <div className="mb-4">
                    <div className="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-circle mb-3 shadow-lg" style={{ width: 80, height: 80 }}>
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="h4 fw-bold text-success">Section Complete</h2>
                </div>

                <div className="py-4 my-4 border-top border-bottom border-light">
                    <p className="text-secondary text-uppercase tracking-wide small fw-bold mb-2">Up Next</p>
                    <h1 className="h2 fw-bold mb-2">{nextTest.name}</h1>
                    <p className="text-secondary">{nextTest.description}</p>
                    <div className="d-inline-flex align-items-center gap-2 badge bg-secondary bg-opacity-10 text-secondary px-3 py-2 rounded-pill mt-2">
                        <Star size={14} /> {nextTest.duration}
                    </div>
                </div>

                <button
                    onClick={() => navigate(nextTest.route, { state: { userId } })}
                    className="btn btn-primary w-100 py-3 rounded-3 fw-bold fs-5 d-flex align-items-center justify-content-center gap-2 shadow-sm hover-scale"
                >
                    Start Assessment <ArrowRight size={20} />
                </button>

                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-link text-secondary text-decoration-none mt-3"
                >
                    Pause and return to dashboard
                </button>
            </div>
        </div>
    );
};

export default AssessmentTransitionPage;
