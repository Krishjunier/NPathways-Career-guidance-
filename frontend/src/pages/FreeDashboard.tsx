import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Target, Zap, Compass, TrendingUp } from 'lucide-react';
import { apiService } from '../services/api';

const FreeDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const userId = localStorage.getItem('userId');
                if (!userId) {
                    navigate('/information');
                    return;
                }
                const response = await apiService.getDashboard(userId);
                setData(response);
            } catch (error) {
                console.error('Dashboard fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const isFreeTestDone = data?.testStatus?.isFreeTestComplete;

    const handleUpgrade = (plan: 'clarity' | 'compass') => {
        const amount = plan === 'clarity' ? 450 : 699;
        const item = plan === 'clarity' ? 'clarity_bundle' : 'compass_bundle';
        const userId = data?.user?.id;
        navigate('/payment', { state: { amount, item, userId } });
    };

    return (
        <div className="min-vh-100 bg-surface d-flex flex-column font-sans text-primary">
            {/* Navbar */}
            <nav className="py-4 px-5 bg-white border-bottom sticky-top z-10 d-flex justify-content-between align-items-center">
                <Link to="/" className="text-decoration-none text-dark">
                    <span className="fw-bolder h5 mb-0" style={{ fontFamily: 'Montserrat' }}>
                        NPathways <span className="fw-light text-secondary">Dashboard</span>
                    </span>
                </Link>
                <div className="d-flex align-items-center gap-3">
                    <span className="badge bg-success text-white px-3 py-1">FREE PLAN</span>
                    <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: 36, height: 36 }}>
                        {data?.user.name.charAt(0)}
                    </div>
                </div>
            </nav>

            <div className="container py-5 flex-grow-1">
                {/* Welcome Section */}
                <div className="mb-5">
                    <h1 className="h3 fw-bold mb-1" style={{ fontFamily: 'Montserrat' }}>
                        Hello, {data?.user.name}
                    </h1>
                    <p className="text-secondary">Start your career exploration with our free assessment bundle.</p>
                </div>

                {/* Main Assessment Card */}
                <div className="row g-4 mb-5">
                    <div className="col-lg-8">
                        <div className="glass-card h-100 p-5 d-flex flex-column justify-content-between position-relative overflow-hidden bg-white border">
                            <div className="position-absolute top-0 end-0 opacity-10">
                                <Target size={200} className="text-success" />
                            </div>
                            <div className="position-relative z-1">
                                <div className="badge bg-success text-white px-3 py-2 rounded-pill mb-3">
                                    FREE ASSESSMENT
                                </div>
                                <h2 className="display-6 fw-bold mb-3" style={{ fontFamily: 'Montserrat' }}>
                                    Free Career Assessment
                                </h2>
                                <p className="lead text-secondary mb-4">
                                    Discover your interests, aptitudes, and personality traits with our comprehensive free assessment suite.
                                </p>
                                <div className="d-flex gap-4 mb-4">
                                    <div className="d-flex align-items-center gap-2">
                                        <CheckCircle size={20} className="text-success" />
                                        <span className="text-secondary">3 Tests</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <CheckCircle size={20} className="text-success" />
                                        <span className="text-secondary">45-60 minutes</span>
                                    </div>
                                </div>
                                {isFreeTestDone ? (
                                    <div className="d-flex gap-3 align-items-center">
                                        <button
                                            onClick={() => navigate(`/profile/${data?.user.id}`)}
                                            className="btn btn-success rounded-3 px-4 py-3 fw-bold d-flex align-items-center gap-2"
                                        >
                                            View Your Results <ArrowRight size={18} />
                                        </button>
                                        <span className="badge bg-success bg-opacity-10 text-success px-3 py-2">
                                            ✓ Completed
                                        </span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => navigate('/bundle/free')}
                                        className="btn btn-success rounded-3 px-5 py-3 fw-bold d-flex align-items-center gap-2 shadow"
                                    >
                                        Start Free Assessment <ArrowRight size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats & Clarity Promo */}
                    <div className="col-lg-4">
                        <div className="glass-card h-100 p-4 bg-white border d-flex flex-column gap-4">
                            {/* Progress Section */}
                            <div>
                                <h3 className="h6 fw-bold mb-3">Your Progress</h3>
                                <div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="small text-secondary">Assessment Progress</span>
                                        <span className="small fw-bold">{isFreeTestDone ? '100%' : '0%'}</span>
                                    </div>
                                    <div className="progress" style={{ height: '8px' }}>
                                        <div
                                            className="progress-bar bg-success"
                                            style={{ width: isFreeTestDone ? '100%' : '0%' }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Clarity Promo Section */}
                            <div className="p-3 rounded border border-primary border-opacity-25 bg-primary bg-opacity-5 mt-auto">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div className="badge bg-primary text-white px-2 py-1 rounded-pill small">
                                        <Zap size={12} className="me-1" /> Best Value
                                    </div>
                                    <span className="small text-primary fw-bold">Clarity Bundle</span>
                                </div>
                                <h4 className="fw-bold h6 text-dark mb-2">Unlock Deeper Insights</h4>
                                <p className="small text-secondary mb-3" style={{ fontSize: '0.85rem' }}>
                                    Get <strong>Work Style</strong> and <strong>Learning Style</strong> assessments + detailed AI report.
                                </p>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <span className="fw-bold h5 mb-0 text-primary">₹450</span>
                                        <small className="text-secondary ms-2 text-decoration-line-through">₹999</small>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleUpgrade('clarity')}
                                    className="btn btn-primary w-100 rounded-3 btn-sm fw-bold py-2"
                                >
                                    Get Clarity Bundle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upgrade Recommendation */}
                {isFreeTestDone && (
                    <div className="mb-5">
                        <div className="glass-card p-5 bg-gradient-to-r from-blue-50 to-purple-50 border border-primary border-opacity-25">
                            <div className="row align-items-center">
                                <div className="col-lg-8">
                                    <div className="badge bg-primary text-white px-3 py-2 rounded-pill mb-3">
                                        🎯 RECOMMENDED UPGRADE
                                    </div>
                                    <h3 className="h4 fw-bold mb-3" style={{ fontFamily: 'Montserrat' }}>
                                        Ready for Deeper Insights?
                                    </h3>
                                    <p className="text-secondary mb-4">
                                        You've completed the free assessments! Unlock advanced career guidance with Clarity or Compass plans. Get deeper insights into your work style, learning preferences, emotional intelligence, and leadership potential.
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
                                    <TrendingUp size={120} className="text-primary opacity-25" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Premium Plans Preview */}
                <div className="mt-5">
                    <h3 className="h5 fw-bold mb-4" style={{ fontFamily: 'Montserrat' }}>
                        Explore Premium Plans
                    </h3>
                    <div className="row g-4">
                        {/* Clarity Card */}
                        <div className="col-md-6">
                            <div className="glass-card p-4 border border-primary border-opacity-25">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <div className="badge bg-primary text-white px-3 py-1 rounded-pill mb-2">
                                            <Zap size={14} className="me-1" /> CLARITY
                                        </div>
                                        <h4 className="h5 fw-bold mb-1">Clarity Plan</h4>
                                        <p className="text-secondary small mb-0">5 comprehensive assessments</p>
                                    </div>
                                    <div className="text-end">
                                        <div className="h4 fw-bold text-primary mb-0">₹450</div>
                                        <small className="text-secondary">one-time</small>
                                    </div>
                                </div>
                                <ul className="list-unstyled small text-secondary mb-3">
                                    <li className="mb-2">✓ All free assessments</li>
                                    <li className="mb-2">✓ Work Style + Learning Style</li>
                                    <li className="mb-2">✓ Detailed career reports</li>
                                    <li className="mb-2">✓ Star Chart visualization</li>
                                </ul>
                                <button
                                    onClick={() => handleUpgrade('clarity')}
                                    className="btn btn-primary w-100 rounded-3 py-2 fw-bold"
                                >
                                    Upgrade Now
                                </button>
                            </div>
                        </div>

                        {/* Compass Card */}
                        <div className="col-md-6">
                            <div className="glass-card p-4 border border-warning border-opacity-25">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <div className="badge bg-warning text-dark px-3 py-1 rounded-pill mb-2">
                                            <Compass size={14} className="me-1" /> COMPASS
                                        </div>
                                        <h4 className="h5 fw-bold mb-1">Compass Plan</h4>
                                        <p className="text-secondary small mb-0">10 comprehensive assessments</p>
                                    </div>
                                    <div className="text-end">
                                        <div className="h4 fw-bold text-warning mb-0">₹699</div>
                                        <small className="text-secondary">one-time</small>
                                    </div>
                                </div>
                                <ul className="list-unstyled small text-secondary mb-3">
                                    <li className="mb-2">✓ Everything in Clarity</li>
                                    <li className="mb-2">✓ EQ + Behavioral + Leadership</li>
                                    <li className="mb-2">✓ Stress + Creativity tests</li>
                                    <li className="mb-2">✓ 360° career insights</li>
                                </ul>
                                <button
                                    onClick={() => handleUpgrade('compass')}
                                    className="btn btn-warning text-dark w-100 rounded-3 py-2 fw-bold"
                                >
                                    Upgrade Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FreeDashboard;
