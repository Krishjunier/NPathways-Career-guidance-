import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

const HowItWorksPage: React.FC = () => {
    const navigate = useNavigate();

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const steps = [
        {
            id: '01',
            title: 'Clarity Compass™ Assessment',
            desc: 'We start with a deep dive into your strengths and EQ. This isn’t just a test; it’s your career foundation.'
        },
        {
            id: '02',
            title: 'Global Goal Mapping',
            desc: 'Identifying the right countries and industry trends that align with your long-term residency and career goals.'
        },
        {
            id: '03',
            title: 'University Matchmaking',
            desc: 'Comparing curricula, research opportunities, and lifestyle to find your perfect academic home.'
        },
        {
            id: '04',
            title: 'Skill Gap Analysis',
            desc: 'If your profile lacks certain technical or soft skills, we fill them through our specialized bootcamps.'
        },
        {
            id: '05',
            title: 'Story-Driven Applications',
            desc: 'We help you craft SOPs that aren’t just templates, but powerful narratives of your individual growth.'
        },
        {
            id: '06',
            title: 'Financial Architecture',
            desc: 'Navigating education loans, scholarships, and budgeting for a stress-free transition.'
        },
        {
            id: '07',
            title: 'The Visa Siege',
            desc: 'Meticulous documentation and mock interviews to ensure your entry is seamless and successful.'
        },
        {
            id: '08',
            title: 'Pre-Departure Orientation',
            desc: 'Cultural hacks, banking setup, and survival skills for your first 30 days in a new country.'
        },
        {
            id: '09',
            title: 'Settling In',
            desc: 'Assistance with accommodation coordination and your first week of administrative hurdles.'
        },
        {
            id: '10',
            title: 'On-Going Mentorship',
            desc: 'We remain your partner throughout your degree and during your first job search abroad.'
        }
    ];

    return (
        <div className="min-vh-100 font-sans bg-white d-flex flex-column">

            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-light bg-white py-4 px-4 sticky-top">
                <div className="container bg-white rounded-pill shadow-sm py-2 px-4 border" style={{ maxWidth: '1200px' }}>
                    <a className="navbar-brand d-flex align-items-center gap-2" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
                        <span className="fw-bolder text-dark" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.5rem', letterSpacing: '-1px' }}>
                            NPathways <span className="fw-light text-secondary">Global</span>
                        </span>
                    </a>

                    <div className="d-none d-lg-flex gap-4 mx-auto fw-medium small text-dark text-uppercase tracking-wide">
                        <button onClick={() => navigate('/')} className="btn-ghost text-decoration-none text-dark hover-opacity p-0 border-0 bg-transparent">Home</button>
                        <button className="btn-ghost text-decoration-none text-dark hover-opacity p-0 border-0 bg-transparent">About</button>
                        <button className="btn-ghost text-decoration-none text-dark hover-opacity p-0 border-0 bg-transparent">Services</button>
                        <button className="btn-ghost text-decoration-none text-dark hover-opacity p-0 border-0 bg-transparent">Products</button>
                        <button className="btn-ghost text-decoration-none text-dark hover-opacity p-0 border-0 bg-transparent">Contact</button>
                    </div>
                    {/* Login placeholder or Back button */}
                    <div>
                        <button className="btn btn-outline-dark rounded-pill px-4 fw-bold" style={{ fontSize: '0.9rem' }} onClick={() => navigate('/')}>
                            Back Home
                        </button>
                    </div>
                </div>
            </nav>

            {/* Header Section */}
            <section className="py-5 bg-white text-center">
                <div className="container py-5">
                    <h1 className="display-4 fw-bold mb-3" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: '-1px' }}>
                        Your 10-Step Journey <br />
                        <span className="text-dark">To Global Success</span>
                    </h1>
                </div>
            </section>

            {/* Roadmap Title */}
            <section className="pb-5 text-center">
                <div className="d-inline-block bg-black text-white px-3 py-1 rounded-pill small fw-bold text-uppercase mb-3 tracking-widest">
                    The Roadmap
                </div>
                <h2 className="h2 fw-bold mb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>How We Build Your Future</h2>
                <p className="text-muted small mx-auto" style={{ maxWidth: '600px' }}>
                    From the first spark of an idea to your first job in a new country, we are with you every single step of the way.
                </p>
            </section>

            {/* Timeline Section */}
            <section className="container pb-5 mb-5">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-10 col-lg-8">
                        <div className="position-relative">
                            {/* Vertical Line */}
                            <div className="position-absolute top-0 start-0 h-100 border-start border-2 ms-4 d-none d-md-block" style={{ borderColor: '#f3f4f6', left: '20px' }}></div>

                            <div className="d-flex flex-column gap-5">
                                {steps.map((step) => (
                                    <div key={step.id} className="d-flex gap-4 align-items-start position-relative">
                                        {/* Number Circle */}
                                        <div className="bg-black text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold shadow-sm" style={{ width: 60, height: 60, zIndex: 1 }}>
                                            {step.id}
                                        </div>

                                        {/* Content Card */}
                                        <div className="bg-white border rounded-4 p-4 shadow-sm w-100 hover-shadow transition-all">
                                            <h4 className="fw-bold mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>{step.title}</h4>
                                            <p className="text-muted small mb-0 lh-lg">
                                                {step.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Philosophy Section (Dark) */}
            <section className="bg-black text-white py-5 my-5">
                <div className="container py-5">
                    <div className="row align-items-center g-5">
                        <div className="col-12 col-lg-6">
                            <small className="text-white-50 fw-bold text-uppercase tracking-widest mb-3 d-block">Our Philosophy</small>
                            <h2 className="display-4 fw-bold mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>Beyond Admissions</h2>
                            <p className="lead text-white-50 lh-lg mb-4">
                                Most consultants stop after the visa sticker is on your passport. At NPathways, that’s only step 7. We believe our true value is proven when you successfully integrate into your new life and career.
                            </p>
                        </div>
                        <div className="col-12 col-lg-5 offset-lg-1">
                            <div className="p-4 border border-secondary rounded-4 bg-white bg-opacity-10">
                                <ul className="list-unstyled d-flex flex-column gap-4 mb-0">
                                    <li className="d-flex gap-3">
                                        <CheckCircle className="text-white flex-shrink-0" size={24} />
                                        <div>
                                            <h5 className="fw-bold mb-1">Transparent Pricing</h5>
                                            <p className="text-white-50 small mb-0">No hidden charges or university kickbacks that bias our advice.</p>
                                        </div>
                                    </li>
                                    <li className="d-flex gap-3">
                                        <CheckCircle className="text-white flex-shrink-0" size={24} />
                                        <div>
                                            <h5 className="fw-bold mb-1">Ethics Over Profit</h5>
                                            <p className="text-white-50 small mb-0">We only recommend universities that truly fit your profile and budget.</p>
                                        </div>
                                    </li>
                                    <li className="d-flex gap-3">
                                        <CheckCircle className="text-white flex-shrink-0" size={24} />
                                        <div>
                                            <h5 className="fw-bold mb-1">Mentorship for Life</h5>
                                            <p className="text-white-50 small mb-0">Join an exclusive alumni network of students already thriving abroad.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-5 text-center mb-5">
                <div className="container">
                    <h2 className="display-5 fw-bold mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>Ready to take Step 01?</h2>

                    <button
                        onClick={() => navigate('/')}
                        className="btn btn-black bg-black text-white px-5 py-3 rounded-3 fw-bold shadow-lg hover-scale d-inline-flex align-items-center gap-2"
                    >
                        Start Your Assessment <ArrowRight size={18} />
                    </button>

                    <p className="text-muted small mt-4">
                        Join 10,000+ students who started their journey with us.
                    </p>
                </div>
            </section>

            {/* Simple Footer */}
            <footer className="bg-white border-top py-5">
                <div className="container">
                    <div className="row g-4">
                        <div className="col-12 col-md-4">
                            <h5 className="fw-bold text-dark mb-3">NPathways <span className="fw-light text-secondary">Global</span></h5>
                            <p className="small text-muted mb-4" style={{ maxWidth: '300px' }}>
                                Empowering Global Ambitions. We guide students at every stage of their study abroad journey.
                            </p>
                            <div className="d-flex gap-3 text-secondary">
                                {/* Social placeholders */}
                                <div className="bg-light p-2 rounded">in</div>
                                <div className="bg-light p-2 rounded">tw</div>
                                <div className="bg-light p-2 rounded">ig</div>
                            </div>
                        </div>
                        <div className="col-6 col-md-2">
                            <h6 className="fw-bold mb-3 small text-uppercase">Quick Links</h6>
                            <ul className="list-unstyled small text-muted d-flex flex-column gap-2">
                                <li><a href="/" className="text-decoration-none text-muted">Home</a></li>
                                <li><span className="text-decoration-none text-muted" style={{ cursor: 'pointer' }}>About Us</span></li>
                                <li><span className="text-decoration-none text-muted" style={{ cursor: 'pointer' }}>Services</span></li>
                                <li><span className="text-decoration-none text-muted" style={{ cursor: 'pointer' }}>Contact</span></li>
                            </ul>
                        </div>
                        <div className="col-6 col-md-3">
                            <h6 className="fw-bold mb-3 small text-uppercase">Our Services</h6>
                            <ul className="list-unstyled small text-muted d-flex flex-column gap-2">
                                <li>Education Consulting</li>
                                <li>Career Guidance</li>
                                <li>Visa Assistance</li>
                                <li>Profile Building</li>
                            </ul>
                        </div>
                        <div className="col-12 col-md-3">
                            <h6 className="fw-bold mb-3 small text-uppercase">Get in Touch</h6>
                            <ul className="list-unstyled small text-muted d-flex flex-column gap-2">
                                <li>info@npathways.global</li>
                                <li>+91 987 654 3210</li>
                                <li>Chennai, India</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-top mt-5 pt-4 d-flex flex-column flex-md-row justify-content-between small text-muted text-center text-md-start">
                        <p className="mb-2 mb-md-0">&copy; {new Date().getFullYear()} NPathways Global. All rights reserved.</p>
                        <div className="d-flex gap-3 justify-content-center">
                            <span className="text-decoration-none text-muted" style={{ cursor: 'pointer' }}>Terms</span>
                            <span className="text-decoration-none text-muted" style={{ cursor: 'pointer' }}>Privacy</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HowItWorksPage;
