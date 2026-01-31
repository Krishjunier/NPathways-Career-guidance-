import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
    ArrowRight
} from 'lucide-react';
import { apiService } from '../services/api';
import StarChart from '../components/StarChart';
import FreeDashboard from './FreeDashboard';

interface DashboardData {
    user: {
        id: string;
        name: string;
        email: string;
        phone: string;
        status: string; // Student, Professional, etc.
    };
    testStatus: {
        isFreeTestComplete: boolean;
        personalityScore: number;
        aptitudeScore: number;
        interestScore: number;
        emotionalScore?: number;
        behavioralScore?: number;
        workstyleScore?: number;
        learningScore?: number;
        leadershipScore?: number;
        stressScore?: number;
        creativityScore?: number;
    };
    plan: 'free' | 'clarity' | 'compass';
}

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const [counsellingRequested, setCounsellingRequested] = useState(false);
    const [counsellingLoading, setCounsellingLoading] = useState(false);

    // Refresh trigger from payment success
    const paymentSuccess = (location.state as any)?.paymentSuccess;

    const handleCounsellingRequest = async () => {
        setCounsellingLoading(true);
        try {
            const response = await apiService.requestCounselling();
            if (response) {
                setCounsellingRequested(true);
                alert("✅ Request submitted! We'll contact you within 24 hours.");
            }
        } catch (error) {
            alert("❌ Failed to submit request. Please try again or contact us directly.");
            console.error('Counselling request error:', error);
        } finally {
            setCounsellingLoading(false);
        }
    };

    const handleUpgrade = (plan: 'clarity' | 'compass') => {
        if (!data?.user.id) return;

        const price = plan === 'clarity' ? 450 : 699;
        const item = plan === 'clarity' ? 'clarity_bundle' : 'compass_bundle';

        navigate('/payment', { state: { amount: price, item, userId: data.user.id } });
    };

    useEffect(() => {
        // Fetch actual user data from backend
        const loadDashboard = async () => {
            const userStr = localStorage.getItem('cc_user');
            if (!userStr) {
                navigate('/');
                return;
            }
            let user = JSON.parse(userStr);
            const userId = user.userId || user.id || user._id;

            if (!userId) {
                navigate('/');
                return;
            }

            try {
                let currentPlan: 'free' | 'clarity' | 'compass' = 'free';
                const bundles = user.purchasedBundles || [];
                const localPlanItem = localStorage.getItem(`premium_plan_${userId}`);
                const hasGenericPremium = localStorage.getItem(`premium_${userId}`);

                if (localPlanItem === 'compass_bundle') {
                    currentPlan = 'compass';
                } else if (localPlanItem === 'clarity_bundle') {
                    currentPlan = 'clarity';
                } else if (hasGenericPremium) {
                    currentPlan = 'clarity';
                }

                if (bundles.includes('compass_bundle')) currentPlan = 'compass';
                else if (bundles.includes('clarity_bundle')) currentPlan = 'clarity';

                const portfolioRes = await apiService.getPortfolioData(userId).catch(() => null);
                const hasResults = portfolioRes?.portfolio?.testResults && portfolioRes.portfolio.testResults.length > 0;
                const careerSuggestion = portfolioRes?.portfolio?.careerSuggestion;
                const isComplete = !!(careerSuggestion?.domain || hasResults);

                // Helper to calculate score (0-10) for a section
                const calculateScore = (type: 'interest' | 'aptitude' | 'emotional' | 'personality' | 'behavioral' | 'workstyle' | 'learning' | 'leadership' | 'stress' | 'creativity') => {
                    if (!hasResults) return 0;
                    const results: any[] = portfolioRes.portfolio.testResults;
                    let minId = 0, maxId = 0;
                    switch (type) {
                        case 'interest': minId = 101; maxId = 106; break;
                        case 'aptitude': minId = 201; maxId = 208; break;
                        case 'emotional': minId = 301; maxId = 305; break;
                        case 'personality': minId = 401; maxId = 405; break;
                        case 'behavioral': minId = 501; maxId = 505; break;
                        case 'workstyle': minId = 601; maxId = 605; break;
                        case 'learning': minId = 701; maxId = 705; break;
                        case 'leadership': minId = 801; maxId = 805; break;
                        case 'stress': minId = 901; maxId = 905; break;
                        case 'creativity': minId = 1001; maxId = 1005; break;
                    }

                    const sectionAnswers = results.filter(r => {
                        const qId = parseInt(r.questionId);
                        return !isNaN(qId) && qId >= minId && qId <= maxId;
                    });

                    if (sectionAnswers.length === 0) return 0;

                    let total = 0;
                    let count = 0;
                    sectionAnswers.forEach(a => {
                        let val = 3;
                        if (typeof a.answer === 'number') val = a.answer;
                        else if (typeof a.answer === 'string') {
                            if (a.answer === "Strongly Agree") val = 5;
                            else if (a.answer === "Agree") val = 4;
                            else if (a.answer === "Neutral") val = 3;
                            else if (a.answer === "Disagree") val = 2;
                            else if (a.answer === "Strongly Disagree") val = 1;
                            else if (!isNaN(parseInt(a.answer))) val = parseInt(a.answer);
                        }
                        total += val;
                        count++;
                    });

                    if (count === 0) return 0;
                    const avg = total / count;
                    return Math.round((avg / 5) * 10);
                };

                localStorage.setItem('tests_completed', String(isComplete));

                setData({
                    user: {
                        id: userId,
                        name: user.name || 'User',
                        email: user.email || '',
                        phone: user.phone || '',
                        status: user.class_status || 'Student'
                    },
                    testStatus: {
                        isFreeTestComplete: isComplete,
                        personalityScore: calculateScore('personality') || (isComplete ? 7 : 0),
                        aptitudeScore: calculateScore('aptitude') || (isComplete ? 7 : 0),
                        interestScore: calculateScore('interest') || (isComplete ? 8 : 0),
                        emotionalScore: calculateScore('emotional'),
                        behavioralScore: calculateScore('behavioral'),
                        workstyleScore: calculateScore('workstyle'),
                        learningScore: calculateScore('learning'),
                        leadershipScore: calculateScore('leadership'),
                        stressScore: calculateScore('stress'),
                        creativityScore: calculateScore('creativity'),
                    },
                    plan: currentPlan
                });
            } catch (e) {
                console.error("Dashboard load error", e);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [navigate, paymentSuccess]);

    if (loading) return <div className="min-vh-100 bg-surface flex-center">Loading...</div>;

    const starData = [
        { subject: 'Personality', A: data?.testStatus.personalityScore || 0, fullMark: 10 },
        { subject: 'Aptitude', A: data?.testStatus.aptitudeScore || 0, fullMark: 10 },
        { subject: 'Interest', A: data?.testStatus.interestScore || 0, fullMark: 10 },
        { subject: 'Emotional', A: data?.testStatus.emotionalScore || 0, fullMark: 10 },
        { subject: 'Behavioral', A: data?.testStatus.behavioralScore || 0, fullMark: 10 },
    ];


    const isClarity = data?.plan === 'clarity' || data?.plan === 'compass';
    const isCompass = data?.plan === 'compass';

    if (data?.plan === 'free') {
        return <FreeDashboard />;
    }

    // Identify the next step in the journey
    const getJourneyProgress = () => {
        const tests = [
            { id: 'riasec', name: 'Interest Test', completed: (data?.testStatus.interestScore || 0) > 0, route: '/psychometric/ria-sec' },
            { id: 'aptitude', name: 'Aptitude Test', completed: (data?.testStatus.aptitudeScore || 0) > 0, route: '/psychometric/aptitude' },
            { id: 'intelligence', name: 'Personality Test', completed: (data?.testStatus.personalityScore || 0) > 0, route: '/psychometric/intelligence' },
            { id: 'workstyle', name: 'Work Style', completed: (data?.testStatus.workstyleScore || 0) > 0, route: '/psychometric/work-style' },
            { id: 'learning', name: 'Learning Style', completed: (data?.testStatus.learningScore || 0) > 0, route: '/psychometric/learning-style' },
            { id: 'emotional', name: 'Emotional IQ', completed: (data?.testStatus.emotionalScore || 0) > 0, route: '/psychometric/emotional' },
            { id: 'behavioral', name: 'Behavioral Check', completed: (data?.testStatus.behavioralScore || 0) > 0, route: '/psychometric/behavioral' },
            { id: 'leadership', name: 'Leadership', completed: (data?.testStatus.leadershipScore || 0) > 0, route: '/psychometric/leadership' },
            { id: 'stress', name: 'Stress Management', completed: (data?.testStatus.stressScore || 0) > 0, route: '/psychometric/stress' },
            { id: 'creativity', name: 'Creativity', completed: (data?.testStatus.creativityScore || 0) > 0, route: '/psychometric/creativity' },
        ];

        // Filter tests based on plan
        const planTests = tests.filter(t => {
            if (isCompass) return true;
            if (isClarity) return ['riasec', 'aptitude', 'intelligence', 'workstyle', 'learning'].includes(t.id);
            return ['riasec', 'aptitude', 'intelligence'].includes(t.id);
        });

        const completedCount = planTests.filter(t => t.completed).length;
        const total = planTests.length;
        const progress = Math.round((completedCount / total) * 100);

        const lastCompleted = [...planTests].reverse().find(t => t.completed);
        const nextTest = planTests.find(t => !t.completed);

        return { progress, lastCompleted, nextTest, total, completedCount };
    };

    const journey = getJourneyProgress();

    return (
        <div className="min-vh-100 bg-surface d-flex flex-column font-sans text-primary">
            {/* Navbar - Premium Dashboard */}
            <nav className="py-4 px-5 bg-white border-bottom sticky-top z-10 d-flex justify-content-between align-items-center">
                <Link to="/" className="text-decoration-none text-dark">
                    <span className="fw-bolder h5 mb-0" style={{ fontFamily: 'Montserrat' }}>NPathways <span className="fw-light text-secondary">Dashboard</span></span>
                </Link>
                <div className="d-flex align-items-center gap-3">
                    <span className={`badge ${isCompass ? 'bg-warning text-dark' : 'bg-primary text-white'} px-3 py-1 text-uppercase fw-bold`}>
                        {data?.plan} PLAN
                    </span>
                    <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: 36, height: 36 }}>
                        {data?.user.name.charAt(0)}
                    </div>
                </div>
            </nav>

            <div className="container py-5 flex-grow-1">
                <div className="mb-5">
                    <h1 className="h3 fw-bold mb-1" style={{ fontFamily: 'Montserrat' }}>Hello, {data?.user.name}</h1>
                    <p className="text-secondary">
                        {journey.nextTest
                            ? `Continue your ${data?.plan} assessment journey. You are ${journey.progress}% there!`
                            : "You have completed all your assessments. Great job!"}
                    </p>
                </div>

                <div className="row g-4">
                    {/* Unified Assessment or Result Card */}
                    <div className="col-lg-8">
                        <div className="glass-card h-100 p-5 d-flex flex-column justify-content-between position-relative overflow-hidden bg-white border">
                            <div className="position-relative z-1">
                                <div className="badge bg-dark text-white px-3 py-2 rounded-pill mb-3">
                                    {journey.completedCount}/{journey.total} Completed
                                </div>
                                <h2 className="display-6 fw-bold mb-3" style={{ fontFamily: 'Montserrat' }}>
                                    {journey.nextTest ? "Your Assessment Journey" : "Assessment Complete"}
                                </h2>
                                <p className="lead text-secondary mb-4" style={{ maxWidth: '440px' }}>
                                    {journey.nextTest
                                        ? `Next up: ${journey.nextTest.name}. Complete all assessments to get your comprehensive career report.`
                                        : "You have unlocked your full career report. View the detailed insights now."}
                                </p>

                                {journey.nextTest ? (
                                    <button
                                        onClick={() => {
                                            if (data?.user?.id) {
                                                if (journey.lastCompleted) {
                                                    navigate('/assessment-transition', { state: { userId: data.user.id, completedTestId: journey.lastCompleted.id } });
                                                } else if (journey.nextTest) {
                                                    navigate(journey.nextTest.route, { state: { userId: data.user.id } });
                                                }
                                            }
                                        }}
                                        className="btn btn-dark rounded-3 px-5 py-3 fw-bold d-flex align-items-center gap-2 shadow-lg"
                                    >
                                        Resume Assessment <ArrowRight size={18} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate(`/profile/${data?.user.id}`)}
                                        className="btn btn-success rounded-3 px-5 py-3 fw-bold d-flex align-items-center gap-2 shadow-lg text-white"
                                    >
                                        View Full Report <ArrowRight size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="position-absolute bottom-0 end-0 m-0 w-100" style={{ height: '8px', background: '#f0f0f0' }}>
                                <div className="h-100 bg-success" style={{ width: `${journey.progress}%`, transition: 'width 1s' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Star Chart Preview */}
                    <div className="col-lg-4">
                        <div className="glass-card h-100 p-4 bg-white border d-flex flex-column">
                            <h3 className="h6 fw-bold text-uppercase text-secondary mb-4 tracking-wide">Clarity Profile</h3>
                            <div className="flex-grow-1 d-flex align-items-center justify-content-center">
                                <StarChart data={starData} color="#000000" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Counselling CTA */}
                {(journey.completedCount === journey.total) && (
                    <div className="mt-5">
                        <div className="glass-card p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-primary border-opacity-25">
                            <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-4">
                                <div className="flex-grow-1">
                                    <h3 className="h5 fw-bold mb-2">Book Your Counselling Session</h3>
                                    <p className="text-secondary mb-0">Discuss your results with our experts.</p>
                                </div>
                                <button
                                    onClick={handleCounsellingRequest}
                                    disabled={counsellingRequested || counsellingLoading}
                                    className="btn btn-primary"
                                >
                                    {counsellingRequested ? 'Request Sent' : 'Book Session'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upgrade Banners if Clarity */}
                {(isClarity && !isCompass) && (
                    <div className="mt-5">
                        <div className="glass-card p-4 bg-warning bg-opacity-10 border border-warning border-opacity-25">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 className="fw-bold mb-1">Upgrade to Compass</h4>
                                    <p className="text-secondary mb-0">Get 5 more assessments including Leadership & EQ.</p>
                                </div>
                                <button onClick={() => handleUpgrade('compass')} className="btn btn-warning text-dark fw-bold">Upgrade - ₹699</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default DashboardPage;
