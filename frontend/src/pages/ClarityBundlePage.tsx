import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const ClarityBundlePage = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');
    const [userPlan, setUserPlan] = useState('free');

    useEffect(() => {
        const plan = localStorage.getItem('userPlan') || 'free';
        setUserPlan(plan);
    }, []);

    const hasAccess = userPlan === 'clarity' || userPlan === 'compass';

    // Combined assessments: Free + Clarity
    const allTests = [
        // FREE ASSESSMENTS (included with Clarity)
        {
            id: 'riasec',
            name: 'Interest Test (RIASEC)',
            description: 'Discover your career interests across 6 dimensions: Realistic, Investigative, Artistic, Social, Enterprising, and Conventional',
            duration: '15-20 minutes',
            route: '/psychometric/ria-sec',
            category: 'Free Bundle (Included)'
        },
        {
            id: 'aptitude',
            name: 'Aptitude Assessment',
            description: 'Measure your cognitive abilities, problem-solving skills, and mental strengths',
            duration: '20-25 minutes',
            route: '/psychometric/aptitude',
            category: 'Free Bundle (Included)'
        },
        {
            id: 'personality',
            name: 'Personality Test',
            description: 'Understand your personality traits, tendencies, and behavioral patterns',
            duration: '15-20 minutes',
            route: '/psychometric/personality',
            category: 'Free Bundle (Included)'
        },
        // CLARITY ASSESSMENTS
        {
            id: 'workstyle',
            name: 'Work Style Assessment',
            description: 'Understand your preferred working environment, collaboration style, and workplace preferences',
            duration: '15-20 minutes',
            route: '/psychometric/work-style',
            category: 'Clarity Bundle'
        },
        {
            id: 'learning',
            name: 'Learning Style Assessment',
            description: 'Optimize your study and learning strategies based on how you best absorb and retain information',
            duration: '15-20 minutes',
            route: '/psychometric/learning-style',
            category: 'Clarity Bundle'
        }
    ];

    // Group tests by category
    const freeTests = allTests.filter(t => t.category === 'Free Bundle (Included)');
    const clarityTests = allTests.filter(t => t.category === 'Clarity Bundle');

    return (
        <div className="min-vh-100 bg-surface">
            {/* Header */}
            <nav className="py-4 px-5 bg-white border-bottom sticky-top">
                <div className="container">
                    <div className="d-flex justify-content-between align-items-center">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn btn-ghost d-flex align-items-center gap-2"
                        >
                            <ArrowLeft size={20} /> Back to Dashboard
                        </button>
                        <span className="fw-bolder h5 mb-0" style={{ fontFamily: 'Montserrat' }}>Clarity Complete Bundle</span>
                        <div style={{ width: '150px' }}></div>
                    </div>
                </div>
            </nav>

            <div className="container py-5">
                {/* Bundle Header */}
                <div className="text-center mb-5">
                    <div className={`badge ${hasAccess ? 'bg-primary' : 'bg-secondary'} text-white px-4 py-2 rounded-pill mb-3`}>
                        CLARITY COMPLETE BUNDLE
                    </div>
                    <h1 className="display-5 fw-bold mb-3" style={{ fontFamily: 'Montserrat' }}>
                        5 Comprehensive Assessments
                    </h1>
                    <p className="lead text-secondary" style={{ maxWidth: '700px', margin: '0 auto' }}>
                        Complete all assessments to get AI-powered career recommendations based on your full profile (Free + Clarity assessments combined).
                    </p>
                    {!hasAccess && (
                        <div className="mt-4">
                            <button
                                onClick={() => navigate('/payment', { state: { plan: 'clarity' } })}
                                className="btn btn-primary btn-lg rounded-3 px-5 py-3 fw-bold"
                            >
                                Unlock Clarity Bundle - ₹450
                            </button>
                        </div>
                    )}
                </div>

                {/* Free Assessments Section */}
                <div className="mb-5">
                    <h3 className="h5 fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontFamily: 'Montserrat' }}>
                        <CheckCircle size={20} className="text-success" /> Foundation Assessments (Included)
                    </h3>
                    <div className="row g-4">
                        {freeTests.map((test, index) => (
                            <div key={test.id} className="col-md-4">
                                <div className="glass-card p-4 h-100 d-flex flex-column">
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <div className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center fw-bold" style={{ width: 40, height: 40 }}>
                                            {index + 1}
                                        </div>
                                        <span className="badge bg-light text-dark">{test.duration}</span>
                                    </div>
                                    <h4 className="h6 fw-bold mb-3">{test.name}</h4>
                                    <p className="text-secondary small mb-4 flex-grow-1">{test.description}</p>
                                    <button
                                        onClick={() => navigate(test.route, { state: { userId } })}
                                        className="btn btn-outline-success w-100 rounded-3 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                                    >
                                        Start <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Clarity Assessments Section */}
                <div className="mb-5">
                    <h3 className="h5 fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontFamily: 'Montserrat' }}>
                        <CheckCircle size={20} className={hasAccess ? 'text-primary' : 'text-secondary'} /> Clarity Advanced Assessments
                    </h3>
                    <div className="row g-4">
                        {clarityTests.map((test, index) => (
                            <div key={test.id} className="col-md-6">
                                <div className={`glass-card p-4 h-100 d-flex flex-column ${!hasAccess ? 'opacity-75' : ''}`}>
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <div className={`rounded-circle ${hasAccess ? 'bg-primary bg-opacity-10 text-primary' : 'bg-secondary bg-opacity-10 text-secondary'} d-flex align-items-center justify-content-center fw-bold`} style={{ width: 40, height: 40 }}>
                                            {freeTests.length + index + 1}
                                        </div>
                                        <span className="badge bg-light text-dark">{test.duration}</span>
                                    </div>
                                    <h4 className="h6 fw-bold mb-3">{test.name}</h4>
                                    <p className="text-secondary small mb-4 flex-grow-1">{test.description}</p>
                                    <button
                                        onClick={() => hasAccess ? navigate(test.route, { state: { userId } }) : navigate('/payment', { state: { plan: 'clarity' } })}
                                        className={`btn ${hasAccess ? 'btn-primary' : 'btn-outline-secondary'} w-100 rounded-3 py-2 fw-bold d-flex align-items-center justify-content-center gap-2`}
                                    >
                                        {hasAccess ? (
                                            <>Start <ArrowRight size={18} /></>
                                        ) : (
                                            <>Unlock Clarity</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Recommendations Notice */}
                {hasAccess && (
                    <div className="glass-card p-4 bg-primary bg-opacity-10 border border-primary border-opacity-25">
                        <div className="d-flex gap-3 align-items-start">
                            <CheckCircle size={24} className="text-primary flex-shrink-0 mt-1" />
                            <div>
                                <h5 className="fw-bold mb-2">AI Career Recommendations</h5>
                                <p className="text-secondary mb-0">
                                    Once you complete all 5 assessments, our AI will analyze your complete profile (combining all Free and Clarity assessments) to provide personalized career recommendations tailored to your unique strengths and preferences.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClarityBundlePage;
