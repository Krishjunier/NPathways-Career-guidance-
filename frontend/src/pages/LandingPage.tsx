import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

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


                </div>
            </nav>

            {/* Hero Section */}
            <div className="container mt-5 mb-5 flex-grow-1 d-flex align-items-center">
                <div className="row align-items-center w-100 mx-0">

                    {/* Left Typography */}
                    <div className="col-12 col-lg-6 pe-lg-5 mb-5 mb-lg-0">
                        <small className="d-block text-secondary fw-bold text-uppercase mb-3" style={{ letterSpacing: '2px', fontSize: '0.75rem' }}>
                            Global Education Reimagined
                        </small>
                        <h1 className="display-2 fw-bold text-black mb-4 lh-1" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: '-2px', fontWeight: 800 }}>
                            Find Your <br />
                            Global <br />
                            Pathway
                        </h1>
                        <p className="lead text-muted mb-5" style={{ maxWidth: '480px', fontSize: '1.1rem', lineHeight: '1.7' }}>
                            Premium study abroad guidance. Access <strong>200+ top universities</strong> across 20+ countries. We don't just find you a university; we find you a future.
                        </p>

                        <div className="d-flex flex-wrap gap-3">
                            <button
                                onClick={() => navigate('/information')}
                                className="btn btn-dark rounded-3 px-4 py-3 fw-bold d-flex align-items-center gap-2 shadow-lg hover-scale"
                            >
                                Start Assessment <ChevronRight size={18} />
                            </button>
                            <button
                                onClick={() => navigate('/how-it-works')}
                                className="btn btn-outline-dark rounded-3 px-4 py-3 fw-bold d-flex align-items-center gap-2"
                            >
                                How It Works
                            </button>
                        </div>
                    </div>

                    {/* Right Image */}
                    <div className="col-12 col-lg-6 position-relative">
                        <div className="position-relative rounded-4 overflow-hidden shadow-none" style={{ maxHeight: '600px' }}>
                            {/* Grayscale filter applied via CSS style */}
                            <img
                                src="/assets/student-hero.png"
                                alt="Students Studying"
                                className="img-fluid w-100 h-100 object-fit-cover"
                                style={{ filter: 'grayscale(100%) contrast(110%)' }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80';
                                }}
                            />

                            {/* Floating Card */}
                            <div className="position-absolute bottom-0 start-0 m-4 p-4 bg-black text-white rounded-3 shadow-lg" style={{ maxWidth: '200px' }}>
                                <h2 className="display-6 fw-bold mb-0">98%</h2>
                                <p className="small text-white-50 text-uppercase mb-0 tracking-widest">Visa Success</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Popular Pathways Section */}
            <div className="container py-5">
                <div className="text-center mb-5">
                    <small className="text-secondary fw-bold text-uppercase tracking-widest" style={{ letterSpacing: '3px', fontSize: '11px' }}>Destinations</small>
                    <h2 className="display-5 fw-bold mt-2 text-black" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: '-1.5px' }}>Popular Pathways</h2>
                </div>

                <div className="row g-3" style={{ height: '600px' }}>
                    {/* Left Column: USA (Tall) & Germany (Short) */}
                    <div className="col-lg-4 d-flex flex-column gap-3 h-100">
                        <div className="position-relative hover-shadow rounded-4 overflow-hidden flex-grow-1" style={{ minHeight: '60%' }}>
                            <img src="https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=600&q=80" className="w-100 h-100 object-fit-cover grayscale-img" alt="USA" />
                            <div className="position-absolute bottom-0 start-0 p-4 text-white p-3 w-100 bg-gradient-to-t">
                                <h4 className="fw-bold mb-0">United States</h4>
                                <button onClick={() => navigate('/information')} className="btn p-0 text-white text-decoration-underline opacity-75 small border-0 bg-transparent">Explore Programs &rarr;</button>
                            </div>
                        </div>
                        <div className="position-relative hover-shadow rounded-4 overflow-hidden flex-grow-1">
                            <img src="https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=600&q=80" className="w-100 h-100 object-fit-cover grayscale-img" alt="Germany" />
                            <div className="position-absolute bottom-0 start-0 p-4 text-white p-3 w-100 bg-gradient-to-t">
                                <h4 className="fw-bold mb-0">Germany</h4>
                                <button onClick={() => navigate('/information')} className="btn p-0 text-white text-decoration-underline opacity-75 small border-0 bg-transparent">Explore Programs &rarr;</button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="col-lg-8 d-flex flex-column gap-3 h-100">
                        {/* Top: UK & Canada */}
                        <div className="row g-3 h-50">
                            <div className="col-6 h-100">
                                <div className="position-relative hover-shadow rounded-4 overflow-hidden h-100">
                                    <img src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80" className="w-100 h-100 object-fit-cover grayscale-img" alt="UK" />
                                    <div className="position-absolute bottom-0 start-0 p-4 text-white p-3 w-100 bg-gradient-to-t">
                                        <h4 className="fw-bold mb-0">United Kingdom</h4>
                                        <button onClick={() => navigate('/information')} className="btn p-0 text-white text-decoration-underline opacity-75 small border-0 bg-transparent">Explore Programs &rarr;</button>
                                    </div>
                                </div>
                            </div>
                            <div className="col-6 h-100">
                                <div className="position-relative hover-shadow rounded-4 overflow-hidden h-100">
                                    <img src="https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=600&q=80" className="w-100 h-100 object-fit-cover grayscale-img" alt="Canada" />
                                    <div className="position-absolute bottom-0 start-0 p-4 text-white p-3 w-100 bg-gradient-to-t">
                                        <h4 className="fw-bold mb-0">Canada</h4>
                                        <button onClick={() => navigate('/information')} className="btn p-0 text-white text-decoration-underline opacity-75 small border-0 bg-transparent">Explore Programs &rarr;</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom: Australia */}
                        <div className="position-relative hover-shadow rounded-4 overflow-hidden h-50">
                            <img src="https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80" className="w-100 h-100 object-fit-cover grayscale-img" alt="Australia" />
                            <div className="position-absolute bottom-0 start-0 p-4 text-white p-3 w-100 bg-gradient-to-t">
                                <h4 className="fw-bold mb-0">Australia</h4>
                                <button onClick={() => navigate('/information')} className="btn p-0 text-white text-decoration-underline opacity-75 small border-0 bg-transparent">Explore Programs &rarr;</button>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    .grayscale-img { filter: grayscale(100%); transition: transform 0.6s, filter 0.6s; }
                    .hover-shadow:hover .grayscale-img { transform: scale(1.03); filter: grayscale(0%); }
                    .bg-gradient-to-t { background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%); }
                    .hover-shadow h4 { font-family: 'Montserrat', sans-serif; letter-spacing: -0.5px; }
                `}</style>
            </div>

            {/* Features / Ecosystem Section */}
            <div className="container py-5 my-5">
                <div className="text-center mb-5">
                    <small className="text-secondary fw-bold text-uppercase tracking-widest">Our Ecosystem</small>
                    <h2 className="h1 fw-bold mt-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>Complete Student Support</h2>
                </div>

                <div className="row g-4">
                    {[
                        { num: '01', title: 'Career Discovery', desc: 'Psychometric & Ikigai mapping' },
                        { num: '02', title: 'Admissions', desc: 'Expert university shortlisting' },
                        { num: '03', title: 'Visa Success', desc: '98% success rate in filing' },
                        { num: '04', title: 'Support', desc: 'Arrival & accommodation help' },
                    ].map((item, idx) => (
                        <div key={idx} className="col-12 col-md-6 col-lg-3">
                            <div className="p-4 border rounded-4 h-100 bg-white hover-shadow transition-all text-center text-lg-start">
                                <span className="display-4 fw-light mb-3 d-block" style={{ fontFamily: "'Montserrat', sans-serif" }}>{item.num}</span>
                                <h4 className="fw-bold mb-2">{item.title}</h4>
                                <p className="text-muted small">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default LandingPage;
