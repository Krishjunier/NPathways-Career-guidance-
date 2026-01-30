import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react';

const FreeBundlePage = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    const freeTests = [
        {
            id: 'riasec',
            name: 'Interest Test (RIASEC)',
            description: 'Discover your career interests across 6 dimensions: Realistic, Investigative, Artistic, Social, Enterprising, and Conventional',
            duration: '15-20 minutes',
            route: '/psychometric/ria-sec'
        },
        {
            id: 'aptitude',
            name: 'Aptitude Assessment',
            description: 'Measure your cognitive abilities, problem-solving skills, and mental strengths',
            duration: '20-25 minutes',
            route: '/psychometric/aptitude'
        },
        {
            id: 'personality',
            name: 'Personality Test',
            description: 'Understand your personality traits, tendencies, and behavioral patterns',
            duration: '15-20 minutes',
            route: '/psychometric/personality'
        }
    ];

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
                        <span className="fw-bolder h5 mb-0" style={{ fontFamily: 'Montserrat' }}>Free Assessment Bundle</span>
                        <div style={{ width: '150px' }}></div>
                    </div>
                </div>
            </nav>

            <div className="container py-5">
                {/* Bundle Header */}
                <div className="text-center mb-5">
                    <div className="badge bg-success text-white px-4 py-2 rounded-pill mb-3">FREE BUNDLE</div>
                    <h1 className="display-5 fw-bold mb-3" style={{ fontFamily: 'Montserrat' }}>
                        Core Assessment Bundle
                    </h1>
                    <p className="lead text-secondary" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        Begin your career journey with our foundational assessments. Complete all three tests to unlock your basic career profile.
                    </p>
                </div>

                {/* Assessment Cards */}
                <div className="row g-4 mb-5">
                    {freeTests.map((test, index) => (
                        <div key={test.id} className="col-md-4">
                            <div className="glass-card p-4 h-100 d-flex flex-column">
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <div className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center fw-bold" style={{ width: 40, height: 40 }}>
                                        {index + 1}
                                    </div>
                                    <span className="badge bg-light text-dark">{test.duration}</span>
                                </div>
                                <h3 className="h5 fw-bold mb-3">{test.name}</h3>
                                <p className="text-secondary small mb-4 flex-grow-1">{test.description}</p>
                                <button
                                    onClick={() => navigate(test.route, { state: { userId } })}
                                    className="btn btn-primary w-100 rounded-3 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                                >
                                    Start Assessment <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bundle Benefits */}
                <div className="glass-card p-5 bg-gradient-to-r from-green-50 to-blue-50">
                    <h3 className="h4 fw-bold mb-4" style={{ fontFamily: 'Montserrat' }}>What You'll Get</h3>
                    <div className="row">
                        <div className="col-md-4 mb-3">
                            <div className="d-flex gap-3">
                                <CheckCircle size={24} className="text-success flex-shrink-0" />
                                <div>
                                    <h5 className="fw-bold mb-1">Basic Career Profile</h5>
                                    <p className="small text-secondary mb-0">Understand your core strengths and interests</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4 mb-3">
                            <div className="d-flex gap-3">
                                <CheckCircle size={24} className="text-success flex-shrink-0" />
                                <div>
                                    <h5 className="fw-bold mb-1">Career Recommendations</h5>
                                    <p className="small text-secondary mb-0">Get AI-powered career suggestions</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4 mb-3">
                            <div className="d-flex gap-3">
                                <CheckCircle size={24} className="text-success flex-shrink-0" />
                                <div>
                                    <h5 className="fw-bold mb-1">Free Counselling</h5>
                                    <p className="small text-secondary mb-0">Book a complimentary session with experts</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FreeBundlePage;
