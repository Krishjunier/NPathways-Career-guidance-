import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Compass,
    Zap,
    Lock,
    CheckCircle,
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
                // If returning from payment, refetch user data to get updated bundles (if your auth/me does that)
                // For now, we manually check bundles or rely on what's in localStorage/memory

                // Determine Plan based on 'purchasedBundles' which might be in user object IF we updated authController properly
                // Or if we just paid, we might have it in location.state 

                let currentPlan: 'free' | 'clarity' | 'compass' = 'free';
                const bundles = user.purchasedBundles || [];

                // Check local storage override from PaymentPage
                const localPlanItem = localStorage.getItem(`premium_plan_${userId}`);
                const hasGenericPremium = localStorage.getItem(`premium_${userId}`);

                if (localPlanItem === 'compass_bundle') {
                    currentPlan = 'compass';
                } else if (localPlanItem === 'clarity_bundle') {
                    currentPlan = 'clarity';
                } else if (hasGenericPremium) {
                    // Fallback if specific bundle name wasn't saved (legacy or basic)
                    currentPlan = 'clarity';
                }

                if (bundles.includes('compass_bundle')) currentPlan = 'compass';
                else if (bundles.includes('clarity_bundle')) currentPlan = 'clarity';

                // Verify completion status via API (Source of Truth)
                const portfolioRes = await apiService.getPortfolioData(userId).catch(() => null);

                // Determine completion: Must have career suggestion result or test answers
                const hasResults = portfolioRes?.portfolio?.testResults && portfolioRes.portfolio.testResults.length > 0;
                const careerSuggestion = portfolioRes?.portfolio?.careerSuggestion;

                const isComplete = !!(careerSuggestion?.domain || hasResults);

                // Helper to calculate score (0-10) for a section
                // Assumes Likert 1-5. 
                // Questions: RIASEC(101-106), Intelligence(201-208), Emotional(301-305), Personality(401-405), Behavioral(501-505)
                const calculateScore = (type: 'interest' | 'aptitude' | 'emotional' | 'personality' | 'behavioral' | 'workstyle' | 'learning' | 'leadership' | 'stress' | 'creativity') => {
                    if (!hasResults) return 0;
                    const results: any[] = portfolioRes.portfolio.testResults;

                    let minId = 0, maxId = 0;
                    switch (type) {
                        case 'interest': minId = 101; maxId = 106; break;
                        case 'aptitude': minId = 201; maxId = 208; break; // Intelligence
                        case 'emotional': minId = 301; maxId = 305; break;
                        case 'personality': minId = 401; maxId = 405; break;
                        case 'behavioral': minId = 501; maxId = 505; break;
                        case 'workstyle': minId = 601; maxId = 605; break;
                        case 'learning': minId = 701; maxId = 705; break;
                        case 'leadership': minId = 801; maxId = 805; break;
                        case 'stress': minId = 901; maxId = 905; break;
                        case 'creativity': minId = 1001; maxId = 1005; break;
                    }

                    // Filter answers for this section
                    const sectionAnswers = results.filter(r => {
                        const qId = parseInt(r.questionId);
                        return !isNaN(qId) && qId >= minId && qId <= maxId;
                    });

                    if (sectionAnswers.length === 0) return 0;

                    // Calculate average value (1-5)
                    let total = 0;
                    let count = 0;

                    sectionAnswers.forEach(a => {
                        let val = 3; // default neutral
                        if (typeof a.answer === 'number') val = a.answer;
                        else if (typeof a.answer === 'string') {
                            // Map string back to number
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

                    const avg = total / count; // 1 to 5
                    // Map 1-5 to 0-10
                    // (avg / 5) * 10
                    return Math.round((avg / 5) * 10);
                };

                // Sync local storage
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

    const isFreeTestDone = data?.testStatus.isFreeTestComplete;
    const isClarity = data?.plan === 'clarity' || data?.plan === 'compass';
    const isCompass = data?.plan === 'compass';

    // Route free users to dedicated free dashboard
    if (data?.plan === 'free') {
        return <FreeDashboard />;
    }

    // Premium Dashboard (Clarity & Compass users)

    return (
        <div className="min-vh-100 bg-surface d-flex flex-column font-sans text-primary">
            {/* Navbar - Premium Dashboard */}
            <nav className="py-4 px-5 bg-white border-bottom sticky-top z-10 d-flex justify-content-between align-items-center">
                <span className="fw-bolder h5 mb-0" style={{ fontFamily: 'Montserrat' }}>NPathways <span className="fw-light text-secondary">Dashboard</span></span>
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
                        {isCompass
                            ? 'Your complete 360° career journey awaits with all premium assessments.'
                            : 'Continue your career exploration with enhanced insights.'}
                    </p>
                </div>

                {/* Main Bento Grid */}
                <div className="row g-4">

                    {/* 1. Primary Action Card (Free Test) */}
                    <div className="col-lg-8">
                        <div className="glass-card h-100 p-5 d-flex flex-column justify-content-between position-relative overflow-hidden bg-white border">
                            <div className="position-relative z-1">
                                {isFreeTestDone ? (
                                    <div className="badge bg-success text-white px-3 py-2 rounded-pill mb-3">Completed</div>
                                ) : (
                                    <div className="badge bg-dark text-white px-3 py-2 rounded-pill mb-3">Step 1</div>
                                )}
                                <h2 className="display-6 fw-bold mb-3" style={{ fontFamily: 'Montserrat' }}>Free Career Assessment</h2>
                                <p className="lead text-secondary mb-4" style={{ maxWidth: '440px' }}>
                                    {isFreeTestDone
                                        ? "Your assessment is complete. View your basic report to understand your personality profile."
                                        : "Discover your suggested learning path over 3 dimensions: Personality, Aptitude, and Interest."}
                                </p>

                                {isFreeTestDone ? (
                                    <div className="d-flex gap-3 align-items-center">
                                        <button onClick={() => navigate(`/profile/${data?.user.id}`)} className="btn btn-dark rounded-3 px-4 py-3 fw-bold d-flex align-items-center gap-2">
                                            View Basic Report <ArrowRight size={18} />
                                        </button>
                                        <span className="d-flex align-items-center gap-2 text-success fw-bold">
                                            <CheckCircle size={20} /> Test Complete
                                        </span>
                                    </div>
                                ) : (
                                    <button onClick={() => navigate('/psychometric/ria-sec')} className="btn btn-dark rounded-3 px-5 py-3 fw-bold d-flex align-items-center gap-2 shadow-lg">
                                        Start Free Test <ArrowRight size={18} />
                                    </button>
                                )}
                            </div>

                            {/* Abstract Decor */}
                            <div className="position-absolute top-0 end-0 h-100 w-50 d-none d-md-block" style={{ background: 'linear-gradient(90deg, transparent, #f3f4f6)', clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)' }}></div>
                            <Compass className="position-absolute bottom-0 end-0 m-5 text-secondary" style={{ opacity: 0.1 }} size={200} />
                        </div>
                    </div>

                    {/* 2. Star Chart Preview */}
                    <div className="col-lg-4">
                        <div className="glass-card h-100 p-4 bg-white border d-flex flex-column">
                            <h3 className="h6 fw-bold text-uppercase text-secondary mb-4 tracking-wide">Clarity Profile</h3>
                            <div className="flex-grow-1 d-flex align-items-center justify-content-center">
                                {isFreeTestDone ? (
                                    <div className="w-100 position-relative">
                                        {/* Blur overlay if not Compass */}
                                        {(!isCompass && !isClarity) ? (
                                            <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center text-center p-3" style={{ backdropFilter: 'blur(4px)', zIndex: 5, background: 'rgba(255,255,255,0.5)' }}>
                                                <div>
                                                    <Lock size={32} className="text-secondary mb-2" />
                                                    <p className="small fw-bold text-secondary mb-0">Upgrade to Unlock</p>
                                                </div>
                                            </div>
                                        ) : null}
                                        <StarChart data={starData} color="#000000" />
                                    </div>
                                ) : (
                                    <div className="text-center text-muted">
                                        <Lock size={48} className="mb-3 mx-auto opacity-25" />
                                        <p className="small">Complete the free test to unlock your Star Chart</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Free Counselling Section - Shows after test completion */}
                {isFreeTestDone && (
                    <div className="mt-4">
                        <div className="glass-card p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-primary border-opacity-25">
                            <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-4">
                                <div className="flex-grow-1">
                                    <div className="badge bg-primary text-white px-3 py-2 rounded-pill mb-2">🎯 Free Offer</div>
                                    <h3 className="h5 fw-bold mb-2" style={{ fontFamily: 'Montserrat' }}>
                                        Book Your Free Counselling Session
                                    </h3>
                                    <p className="text-secondary mb-0">
                                        Congratulations on completing your assessment! Book a complimentary 1-on-1 session with our career experts to discuss your results and career path.
                                    </p>
                                </div>
                                <div className="flex-shrink-0">
                                    <button
                                        onClick={handleCounsellingRequest}
                                        disabled={counsellingRequested || counsellingLoading}
                                        className={`btn ${counsellingRequested ? 'btn-success' : 'btn-primary'} rounded-3 px-5 py-3 fw-bold d-flex align-items-center gap-2 shadow-sm`}
                                    >
                                        {counsellingLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                Submitting...
                                            </>
                                        ) : counsellingRequested ? (
                                            <>
                                                <CheckCircle size={18} /> Request Sent
                                            </>
                                        ) : (
                                            <>
                                                📅 Book Session <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                    {counsellingRequested && (
                                        <small className="d-block text-muted mt-2 text-center">
                                            We'll contact you within 24 hours
                                        </small>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Free Assessment Bundle - Show for Premium Users */}
                {(isClarity || isCompass) && (
                    <div className="mt-5">
                        <h3 className="h5 fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontFamily: 'Montserrat' }}>
                            <CheckCircle size={20} className="text-success" /> Free Assessment Bundle
                            <span className="badge bg-success text-white small" style={{ fontSize: '0.7rem' }}>INCLUDED</span>
                        </h3>
                        <div className="row g-4">
                            <div className="col-12">
                                <div className="glass-card p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h4 className="fw-bold fs-4 mb-2">Core Assessment Bundle</h4>
                                            <p className="text-secondary mb-0">Foundation assessments included with all plans</p>
                                        </div>
                                        <CheckCircle size={24} className="text-success" />
                                    </div>
                                    <div className="row mt-4">
                                        <div className="col-md-4 mb-3">
                                            <div className="d-flex align-items-start gap-3">
                                                <CheckCircle size={20} className="text-success" />
                                                <div>
                                                    <h6 className="fw-bold mb-1">Interest Test (RIASEC)</h6>
                                                    <p className="small text-secondary mb-0">Discover your career interests across 6 dimensions</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <div className="d-flex align-items-start gap-3">
                                                <CheckCircle size={20} className="text-success" />
                                                <div>
                                                    <h6 className="fw-bold mb-1">Aptitude Assessment</h6>
                                                    <p className="small text-secondary mb-0">Measure your cognitive abilities and strengths</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <div className="d-flex align-items-start gap-3">
                                                <CheckCircle size={20} className="text-success" />
                                                <div>
                                                    <h6 className="fw-bold mb-1">Personality Test</h6>
                                                    <p className="small text-secondary mb-0">Understand your personality traits and tendencies</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/bundle/free')}
                                        className="btn btn-outline-success w-100 rounded-3 py-2 fw-bold mt-3"
                                    >
                                        {isFreeTestDone ? 'Review Free Bundle' : 'View Free Bundle'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* Upgrade Recommendation Banner - Free Plan Users */}
                {(!isClarity && !isCompass && isFreeTestDone) && (
                    <div className="mt-5">
                        <div className="glass-card p-5 bg-gradient-to-r from-blue-50 to-purple-50 border border-primary border-opacity-50">
                            <div className="row align-items-center">
                                <div className="col-lg-8">
                                    <div className="badge bg-primary text-white px-3 py-2 rounded-pill mb-3">
                                        🎯 Recommended Upgrade
                                    </div>
                                    <h3 className="h4 fw-bold mb-3" style={{ fontFamily: 'Montserrat' }}>
                                        Unlock Deeper Career Insights with Clarity or Compass
                                    </h3>
                                    <p className="text-secondary mb-4">
                                        You've completed the free assessments! Take the next step in your career journey. Get advanced insights about your work style, learning preferences, emotional intelligence, and leadership potential.
                                    </p>
                                    <div className="d-flex gap-3 flex-wrap">
                                        <button
                                            onClick={() => handleUpgrade('clarity')}
                                            className="btn btn-primary rounded-3 px-4 py-2 fw-bold"
                                        >
                                            Upgrade to Clarity - ₹450
                                        </button>
                                        <button
                                            onClick={() => handleUpgrade('compass')}
                                            className="btn btn-warning text-dark rounded-3 px-4 py-2 fw-bold"
                                        >
                                            Upgrade to Compass - ₹699
                                        </button>
                                    </div>
                                </div>
                                <div className="col-lg-4 text-center d-none d-lg-block">
                                    <Compass size={120} className="text-primary opacity-25" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upgrade Recommendation Banner - Clarity Plan Users */}
                {(isClarity && !isCompass) && (
                    <div className="mt-5">
                        <div className="glass-card p-5 bg-gradient-to-r from-yellow-50 to-orange-50 border border-warning border-opacity-50">
                            <div className="row align-items-center">
                                <div className="col-lg-8">
                                    <div className="badge bg-warning text-dark px-3 py-2 rounded-pill mb-3">
                                        ⭐ Unlock Full Potential
                                    </div>
                                    <h3 className="h4 fw-bold mb-3" style={{ fontFamily: 'Montserrat' }}>
                                        Complete Your Journey with Compass
                                    </h3>
                                    <p className="text-secondary mb-4">
                                        Great progress! You're getting valuable insights. Upgrade to Compass to unlock 5 additional premium assessments including Emotional Intelligence, Behavioral Analysis, Leadership Potential, Stress Management, and Creativity - for complete 360° career clarity.
                                    </p>
                                    <ul className="list-unstyled mb-4">
                                        <li className="d-flex gap-2 mb-2">
                                            <CheckCircle size={20} className="text-warning flex-shrink-0 mt-1" />
                                            <span>All your Clarity assessments data will be preserved</span>
                                        </li>
                                        <li className="d-flex gap-2 mb-2">
                                            <CheckCircle size={20} className="text-warning flex-shrink-0 mt-1" />
                                            <span>AI recommendations will include all completed assessments</span>
                                        </li>
                                        <li className="d-flex gap-2 mb-2">
                                            <CheckCircle size={20} className="text-warning flex-shrink-0 mt-1" />
                                            <span>Get the most comprehensive career profile</span>
                                        </li>
                                    </ul>
                                    <button
                                        onClick={() => handleUpgrade('compass')}
                                        className="btn btn-warning text-dark rounded-3 px-5 py-3 fw-bold"
                                    >
                                        Upgrade to Compass - ₹699
                                    </button>
                                </div>
                                <div className="col-lg-4 text-center d-none d-lg-block">
                                    <Compass size={120} className="text-warning opacity-50" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* Clarity Assessments Section (Unlocked for Clarity & Compass) */}
                <div className="mt-5">
                    <h3 className="h5 fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontFamily: 'Montserrat' }}>
                        <Zap size={20} className="text-secondary" /> Clarity Bundle
                        {(!isClarity && !isCompass) && <span className="badge bg-secondary text-white small" style={{ fontSize: '0.7rem' }}>LOCKED</span>}
                    </h3>
                    <div className="row g-4">
                        <div className="col-12">
                            <div className={`glass-card p-4 ${(!isClarity && !isCompass) ? 'opacity-75 grayscale' : ''}`}>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h4 className="fw-bold fs-4 mb-2">Clarity Assessment Bundle</h4>
                                        <p className="text-secondary mb-0">Unlock deeper insights with 2 additional assessments</p>
                                    </div>
                                    {(!isClarity && !isCompass) && <Lock size={24} className="text-secondary" />}
                                </div>
                                <div className="row mt-4">
                                    <div className="col-md-6 mb-3">
                                        <div className="d-flex align-items-start gap-3">
                                            <CheckCircle size={20} className={(isClarity || isCompass) ? 'text-success' : 'text-secondary'} />
                                            <div>
                                                <h6 className="fw-bold mb-1">Work Style Assessment</h6>
                                                <p className="small text-secondary mb-0">Understand your preferred working environment</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <div className="d-flex align-items-start gap-3">
                                            <CheckCircle size={20} className={(isClarity || isCompass) ? 'text-success' : 'text-secondary'} />
                                            <div>
                                                <h6 className="fw-bold mb-1">Learning Style Assessment</h6>
                                                <p className="small text-secondary mb-0">Optimize your study and learning strategies</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => (isClarity || isCompass) ? navigate('/bundle/clarity') : handleUpgrade('clarity')}
                                    className={`btn w-100 rounded-3 py-2 fw-bold mt-3 ${(isClarity || isCompass) ? 'btn-primary' : 'btn-outline-secondary'}`}
                                >
                                    {(isClarity || isCompass) ? 'View Clarity Bundle' : 'Unlock Clarity Bundle'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Compass Assessments Section - Compass Exclusive */}
                <div className="mt-5">
                    <h3 className="h5 fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontFamily: 'Montserrat' }}>
                        <Compass size={20} className="text-dark" /> Compass Bundle
                        {!isCompass && <span className="badge bg-warning text-dark small" style={{ fontSize: '0.7rem' }}>LOCKED</span>}
                    </h3>

                    <div className="row g-4">
                        <div className="col-12">
                            <div className={`glass-card p-4 ${!isCompass ? 'opacity-75 grayscale' : ''}`}>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h4 className="fw-bold fs-4 mb-2">Compass Assessment Bundle</h4>
                                        <p className="text-secondary mb-0">Complete 360° career insight with 5 advanced assessments</p>
                                    </div>
                                    {!isCompass && <Lock size={24} className="text-secondary" />}
                                </div>
                                <div className="row mt-4">
                                    <div className="col-md-6 mb-3">
                                        <div className="d-flex align-items-start gap-3">
                                            <CheckCircle size={20} className={isCompass ? 'text-success' : 'text-secondary'} />
                                            <div>
                                                <h6 className="fw-bold mb-1">Emotional EQ</h6>
                                                <p className="small text-secondary mb-0">Evaluate your EQ and social skills</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <div className="d-flex align-items-start gap-3">
                                            <CheckCircle size={20} className={isCompass ? 'text-success' : 'text-secondary'} />
                                            <div>
                                                <h6 className="fw-bold mb-1">Behavioral Assessment</h6>
                                                <p className="small text-secondary mb-0">Analyze your workplace behavior</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <div className="d-flex align-items-start gap-3">
                                            <CheckCircle size={20} className={isCompass ? 'text-success' : 'text-secondary'} />
                                            <div>
                                                <h6 className="fw-bold mb-1">Leadership Potential</h6>
                                                <p className="small text-secondary mb-0">Leadership potential analysis</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <div className="d-flex align-items-start gap-3">
                                            <CheckCircle size={20} className={isCompass ? 'text-success' : 'text-secondary'} />
                                            <div>
                                                <h6 className="fw-bold mb-1">Stress Management</h6>
                                                <p className="small text-secondary mb-0">How you handle pressure</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <div className="d-flex align-items-start gap-3">
                                            <CheckCircle size={20} className={isCompass ? 'text-success' : 'text-secondary'} />
                                            <div>
                                                <h6 className="fw-bold mb-1">Creativity Assessment</h6>
                                                <p className="small text-secondary mb-0">Innovation and problem solving</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => isCompass ? navigate('/bundle/compass') : handleUpgrade('compass')}
                                    className={`btn w-100 rounded-3 py-2 fw-bold mt-3 ${isCompass ? 'btn-primary' : 'btn-outline-secondary'}`}
                                >
                                    {isCompass ? 'View Compass Bundle' : 'Unlock Compass Bundle'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Plans & Pricing Section - Always Visible */}
                <div className="mt-5 py-5">
                    <div className="text-center mb-5">
                        <h2 className="h2 fw-bolder text-dark mb-3" style={{ fontFamily: 'Montserrat', fontWeight: 800 }}>Upgrade your plan</h2>

                    </div>

                    <div className="row g-4">
                        {/* Free Plan */}
                        <div className="col-lg-4">
                            <div className="h-100 p-4 rounded-4 bg-dark text-white border border-secondary border-opacity-25 d-flex flex-column shadow">
                                <div className="mb-4">
                                    <h4 className="fw-bold mb-1 text-white">Free</h4>
                                    <div className="d-flex align-items-baseline gap-1">
                                        <span className="fs-2 fw-bold">₹0</span>
                                        <span className="small text-white-50">/ forever</span>
                                    </div>
                                    <p className="small text-white-50 mt-2">Start your journey with basic insights.</p>
                                </div>
                                <button
                                    disabled={true}
                                    className="btn btn-outline-light w-100 rounded-3 py-2 fw-bold mb-4"
                                >
                                    {(!isClarity && !isCompass) ? 'Your current plan' : 'Included'}
                                </button>
                                <ul className="list-unstyled d-flex flex-column gap-3 small text-white-50 flex-grow-1">
                                    <li className="d-flex gap-2"><CheckCircle size={16} className="text-white flex-shrink-0" /> Core Interest Test (RIASEC)</li>
                                    <li className="d-flex gap-2"><CheckCircle size={16} className="text-white flex-shrink-0" /> Basic Aptitude Assessment</li>
                                    <li className="d-flex gap-2"><CheckCircle size={16} className="text-white flex-shrink-0" /> Limited Career Report</li>
                                </ul>
                            </div>
                        </div>

                        {/* Clarity Plan */}
                        <div className="col-lg-4">
                            <div className="h-100 p-4 rounded-4 bg-dark text-white border border-secondary border-opacity-50 d-flex flex-column position-relative shadow">
                                {/* Highlight if Clarity */}
                                {isClarity && !isCompass && <div className="position-absolute top-0 end-0 m-3 badge bg-primary text-white">CURRENT</div>}
                                <div className="mb-4">
                                    <h4 className="fw-bold mb-1 text-white">Clarity</h4>
                                    <div className="d-flex align-items-baseline gap-1">
                                        <span className="fs-2 fw-bold">₹450</span>
                                        <span className="small text-white-50">/ one-time</span>
                                    </div>
                                    <p className="small text-white-50 mt-2">Unlock the full experience.</p>
                                </div>
                                <button
                                    onClick={() => !isClarity && !isCompass && handleUpgrade('clarity')}
                                    disabled={isClarity || isCompass}
                                    className={`btn w-100 rounded-3 py-2 fw-bold mb-4 ${isClarity && !isCompass ? 'btn-outline-primary' : 'bg-white text-dark border-0 hover-opacity-90'}`}
                                >
                                    {(isClarity && !isCompass) ? 'Your current plan' : (isCompass ? 'Included' : 'Upgrade to Clarity')}
                                </button>
                                <ul className="list-unstyled d-flex flex-column gap-3 small text-white-50 flex-grow-1">
                                    <li className="d-flex gap-2 text-white"><Zap size={16} className="text-primary flex-shrink-0" /> <strong>Everything in Free</strong></li>
                                    <li className="d-flex gap-2"><CheckCircle size={16} className="text-white flex-shrink-0" /> Work Style Assessment</li>
                                    <li className="d-flex gap-2"><CheckCircle size={16} className="text-white flex-shrink-0" /> Learning Style Assessment</li>
                                    <li className="d-flex gap-2"><CheckCircle size={16} className="text-white flex-shrink-0" /> Detailed Personality Report</li>
                                    <li className="d-flex gap-2"><CheckCircle size={16} className="text-white flex-shrink-0" /> Star Chart Visualization</li>
                                </ul>
                            </div>
                        </div>

                        {/* Compass Plan */}
                        <div className="col-lg-4">
                            <div className="h-100 p-4 rounded-4 bg-dark text-white border border-warning border-opacity-50 d-flex flex-column position-relative overflow-hidden shadow">
                                {isCompass && <div className="position-absolute top-0 end-0 m-3 badge bg-warning text-dark">CURRENT</div>}
                                <div className="mb-4">
                                    <h4 className="fw-bold mb-1 text-white">Compass</h4>
                                    <div className="d-flex align-items-baseline gap-1">
                                        <span className="fs-2 fw-bold">₹699</span>
                                        <span className="small text-white-50">/ one-time</span>
                                    </div>
                                    <p className="small text-white-50 mt-2">Maximize your productivity.</p>
                                </div>
                                <button
                                    onClick={() => !isCompass && handleUpgrade('compass')}
                                    disabled={isCompass}
                                    className={`btn w-100 rounded-3 py-2 fw-bold mb-4 ${isCompass ? 'btn-outline-warning' : 'btn-warning text-dark border-0 hover-opacity-90'}`}
                                >
                                    {isCompass ? 'Your current plan' : 'Upgrade to Compass'}
                                </button>
                                <ul className="list-unstyled d-flex flex-column gap-3 small text-white-50 flex-grow-1">
                                    <li className="d-flex gap-2 text-white"><Compass size={16} className="text-warning flex-shrink-0" /> <strong>Everything in Clarity</strong></li>
                                    <li className="d-flex gap-2"><CheckCircle size={16} className="text-white flex-shrink-0" /> Emotional Intelligence (EQ)</li>
                                    <li className="d-flex gap-2"><CheckCircle size={16} className="text-white flex-shrink-0" /> Behavioral Assessment</li>
                                    <li className="d-flex gap-2"><CheckCircle size={16} className="text-white flex-shrink-0" /> Leadership & Stress Tests</li>
                                    <li className="d-flex gap-2"><CheckCircle size={16} className="text-white flex-shrink-0" /> Creativity Assessment</li>
                                    <li className="d-flex gap-2"><CheckCircle size={16} className="text-white flex-shrink-0" /> 360° Comprehensive Report</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DashboardPage;
