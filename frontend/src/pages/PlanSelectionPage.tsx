import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Zap, Compass, ArrowRight } from 'lucide-react';

const PlanSelectionPage = () => {
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState<'free' | 'clarity' | 'compass'>('free');

    const handlePlanSelection = async (plan: 'free' | 'clarity' | 'compass') => {
        setSelectedPlan(plan);
    };

    const handleContinue = () => {
        // Store the selected plan in localStorage
        localStorage.setItem('userPlan', selectedPlan);

        const userStr = localStorage.getItem('cc_user');
        const isLoggedIn = !!userStr;

        // If paid plan, navigate to payment
        if (selectedPlan !== 'free') {
            const amount = selectedPlan === 'clarity' ? 450 : 699;
            const item = selectedPlan === 'clarity' ? 'clarity_bundle' : 'compass_bundle';
            let userId = null;
            try {
                if (userStr) {
                    const u = JSON.parse(userStr);
                    userId = u.userId || u.id || u._id;
                }
            } catch { }

            // If not logged in, we might want to capture payment intent or force login. 
            // For now, let's assume valid flow is Login -> Plan or Plan -> Register -> Payment.
            // If we send them to payment without UserID, payment page might break or handle it.
            // Let's send to PaymentPage, assuming it handles guest/login flow if needed, 
            // OR if strictly restricted:
            if (!isLoggedIn) {
                navigate('/information', { state: { targetPlan: selectedPlan } });
                return;
            }

            navigate('/payment', { state: { amount, item, userId } });
        } else {
            // Free plan
            if (isLoggedIn) {
                navigate('/dashboard');
            } else {
                navigate('/information');
            }
        }
    };

    return (
        <div className="min-vh-100 bg-surface d-flex flex-column font-sans text-primary">
            {/* Header */}
            <nav className="py-4 px-5 bg-white border-bottom sticky-top">
                <div className="container d-flex justify-content-between align-items-center">
                    <Link to="/" className="text-decoration-none">
                        <span className="fw-bolder h5 mb-0 text-dark" style={{ fontFamily: 'Montserrat' }}>
                            NPathways
                        </span>
                    </Link>
                    {/* Optional: Login Link if not logged in */}
                    <Link to="/login" className="btn btn-sm btn-outline-dark rounded-pill px-4">
                        Login
                    </Link>
                </div>
            </nav>

            <div className="container py-5 flex-grow-1 d-flex flex-column justify-content-center">
                {/* Title */}
                <div className="text-center mb-5">
                    <h1 className="display-4 fw-bold text-dark mb-3" style={{ fontFamily: 'Montserrat' }}>
                        Choose Your Career Path
                    </h1>
                    <p className="lead text-secondary" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        Select the plan that best fits your career exploration needs
                    </p>
                </div>

                {/* Plan Cards */}
                <div className="row g-4 mb-5">
                    {/* Free Plan */}
                    <div className="col-lg-4">
                        <div
                            onClick={() => handlePlanSelection('free')}
                            className={`glass-card p-5 h-100 position-relative ${selectedPlan === 'free'
                                ? 'border-3 border-success shadow-lg'
                                : 'border border-secondary border-opacity-25'
                                }`}
                            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                        >
                            {selectedPlan === 'free' && (
                                <div className="position-absolute top-0 end-0 m-3">
                                    <CheckCircle size={28} className="text-success" fill="currentColor" />
                                </div>
                            )}
                            <div className="mb-4">
                                <h3 className="h4 fw-bold text-dark mb-3">Free</h3>
                                <div className="d-flex align-items-baseline gap-2 mb-3">
                                    <span className="display-5 fw-bold text-dark">₹0</span>
                                    <span className="text-secondary">/ forever</span>
                                </div>
                                <p className="text-secondary mb-0">Start your journey with basic insights</p>
                            </div>
                            <ul className="list-unstyled d-flex flex-column gap-3 text-secondary">
                                <li className="d-flex gap-2">
                                    <CheckCircle size={18} className="text-success flex-shrink-0 mt-1" />
                                    Core Interest Test (RIASEC)
                                </li>
                                <li className="d-flex gap-2">
                                    <CheckCircle size={18} className="text-success flex-shrink-0 mt-1" />
                                    Basic Aptitude Assessment
                                </li>
                                <li className="d-flex gap-2">
                                    <CheckCircle size={18} className="text-success flex-shrink-0 mt-1" />
                                    Personality Profile
                                </li>
                                <li className="d-flex gap-2">
                                    <CheckCircle size={18} className="text-success flex-shrink-0 mt-1" />
                                    Free Counselling Session
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Clarity Plan */}
                    <div className="col-lg-4">
                        <div
                            onClick={() => handlePlanSelection('clarity')}
                            className={`glass-card p-5 h-100 position-relative ${selectedPlan === 'clarity'
                                ? 'border-3 border-primary shadow-lg'
                                : 'border border-secondary border-opacity-25'
                                }`}
                            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                        >
                            {selectedPlan === 'clarity' && (
                                <div className="position-absolute top-0 end-0 m-3">
                                    <CheckCircle size={28} className="text-primary" fill="currentColor" />
                                </div>
                            )}
                            <div className="badge bg-primary text-white px-3 py-1 rounded-pill mb-3">
                                <Zap size={14} className="me-1" /> POPULAR
                            </div>
                            <div className="mb-4">
                                <h3 className="h4 fw-bold text-dark mb-3">Clarity</h3>
                                <div className="d-flex align-items-baseline gap-2 mb-3">
                                    <span className="display-5 fw-bold text-dark">₹450</span>
                                    <span className="text-secondary">/ one-time</span>
                                </div>
                                <p className="text-secondary mb-0">Unlock the full experience</p>
                            </div>
                            <ul className="list-unstyled d-flex flex-column gap-3 text-secondary">
                                <li className="d-flex gap-2">
                                    <Zap size={18} className="text-primary flex-shrink-0 mt-1" fill="currentColor" />
                                    <strong className="text-dark">Everything in Free</strong>
                                </li>
                                <li className="d-flex gap-2">
                                    <CheckCircle size={18} className="text-primary flex-shrink-0 mt-1" />
                                    Work Style Assessment
                                </li>
                                <li className="d-flex gap-2">
                                    <CheckCircle size={18} className="text-primary flex-shrink-0 mt-1" />
                                    Learning Style Assessment
                                </li>
                                <li className="d-flex gap-2">
                                    <CheckCircle size={18} className="text-primary flex-shrink-0 mt-1" />
                                    Detailed Career Reports
                                </li>
                                <li className="d-flex gap-2">
                                    <CheckCircle size={18} className="text-primary flex-shrink-0 mt-1" />
                                    Star Chart Visualization
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Compass Plan */}
                    <div className="col-lg-4">
                        <div
                            onClick={() => handlePlanSelection('compass')}
                            className={`glass-card p-5 h-100 position-relative ${selectedPlan === 'compass'
                                ? 'border-3 border-warning shadow-lg'
                                : 'border border-secondary border-opacity-25'
                                }`}
                            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                        >
                            {selectedPlan === 'compass' && (
                                <div className="position-absolute top-0 end-0 m-3">
                                    <CheckCircle size={28} className="text-warning" fill="currentColor" />
                                </div>
                            )}
                            <div className="badge bg-warning text-dark px-3 py-1 rounded-pill mb-3">
                                <Compass size={14} className="me-1" /> PREMIUM
                            </div>
                            <div className="mb-4">
                                <h3 className="h4 fw-bold text-dark mb-3">Compass</h3>
                                <div className="d-flex align-items-baseline gap-2 mb-3">
                                    <span className="display-5 fw-bold text-dark">₹699</span>
                                    <span className="text-secondary">/ one-time</span>
                                </div>
                                <p className="text-secondary mb-0">Maximize your productivity</p>
                            </div>
                            <ul className="list-unstyled d-flex flex-column gap-3 text-secondary">
                                <li className="d-flex gap-2">
                                    <Compass size={18} className="text-warning flex-shrink-0 mt-1" fill="currentColor" />
                                    <strong className="text-dark">Everything in Clarity</strong>
                                </li>
                                <li className="d-flex gap-2">
                                    <CheckCircle size={18} className="text-warning flex-shrink-0 mt-1" />
                                    Emotional Intelligence (EQ)
                                </li>
                                <li className="d-flex gap-2">
                                    <CheckCircle size={18} className="text-warning flex-shrink-0 mt-1" />
                                    Behavioral Analysis
                                </li>
                                <li className="d-flex gap-2">
                                    <CheckCircle size={18} className="text-warning flex-shrink-0 mt-1" />
                                    Leadership Potential
                                </li>
                                <li className="d-flex gap-2">
                                    <CheckCircle size={18} className="text-warning flex-shrink-0 mt-1" />
                                    Stress & Creativity Tests
                                </li>
                                <li className="d-flex gap-2">
                                    <CheckCircle size={18} className="text-warning flex-shrink-0 mt-1" />
                                    360° Career Insights
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Continue Button */}
                <div className="text-center">
                    <button
                        onClick={handleContinue}
                        className="btn btn-lg btn-dark text-white rounded-3 px-5 py-3 fw-bold d-inline-flex align-items-center gap-2 shadow"
                        style={{ transition: 'all 0.3s ease' }}
                    >
                        Continue with {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlanSelectionPage;
