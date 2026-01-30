import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { ArrowLeft, Download, RefreshCw, FileText, Copy, Briefcase, Award, BookOpen, ExternalLink, Zap, Mail, Phone, Calendar } from 'lucide-react';

interface ExamScore {
  exam: string;
  score: string;
}

interface PortfolioData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    status: string;
  };
  careerSuggestion: {
    domain: string;
    roles: string[];
    courses: string[];
    colleges?: { name: string; course: string; country: string }[];
    description: string;
  };
  testResults: { questionId: number; answer: string }[];
  examScores?: ExamScore[];
  skills?: string[];
  projects?: { title?: string; link?: string }[];
  generatedAt?: string;
}

const PortfolioPage: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const storageKey = userId ? `portfolio:${userId}` : '';

  useEffect(() => {
    // Auto-recover from bad URLs
    if (!userId || userId === 'undefined' || userId === 'null') {
      const stored = localStorage.getItem('cc_user');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          const realId = u.userId || u.id || u._id;
          if (realId && realId !== 'undefined') {
            navigate(`/portfolio/${realId}`, { replace: true });
            return;
          }
        } catch { }
      }
      navigate('/', { replace: true });
      return;
    }

    const load = async (useCache = true) => {
      setError('');
      setLoading(true);

      // Force clear cache to fix persistent default data issue
      if (userId) {
        try {
          localStorage.removeItem(storageKey);
        } catch { }
      }

      // if (useCache) {
      //   const cached = localStorage.getItem(storageKey);
      //   if (cached) {
      //     try {
      //       const parsed: PortfolioData = JSON.parse(cached);
      //       setPortfolio(parsed);
      //       setLoading(false);
      //       return;
      //     } catch {
      //       // fallthrough
      //     }
      //   }
      // }

      try {
        const response = await apiService.getPortfolioData(userId);
        const data: any = response.portfolio ?? {};

        const normalized: PortfolioData = {
          personalInfo: data.personalInfo ?? { name: 'Unknown', email: '', phone: '', status: '' },
          careerSuggestion: data.careerSuggestion ?? { domain: '', roles: [], courses: [], description: '' },
          testResults: data.testResults ?? [],
          examScores: data.examScores ?? [],
          skills: data.skills ?? [],
          projects: data.projects ?? [],
          generatedAt: data.generatedAt ?? new Date().toISOString(),
        };
        setPortfolio(normalized);
        try {
          localStorage.setItem(storageKey, JSON.stringify(normalized));
        } catch { }
      } catch (err: any) {
        console.error("Portfolio Page Load Error:", err);
        const serverMsg = err?.response?.data?.message || err?.message || 'Unknown error';
        setError(`Failed to load profile data: ${serverMsg}`);
      } finally {
        setLoading(false);
      }
    };

    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleDownloadPDF = () => {
    if (userId) window.open(`http://localhost:5000/api/portfolio/generate/${userId}`, '_blank');
  };

  const handleNewConversation = () => {
    if (storageKey) localStorage.removeItem(storageKey);
    navigate('/');
  };

  const handleRefresh = async () => {
    if (!userId) return;
    setRefreshing(true);
    setError('');
    try {
      const response = await apiService.refreshPortfolioData(userId);
      const data: any = response.portfolio ?? {};

      const normalized: PortfolioData = {
        personalInfo: data.personalInfo ?? { name: 'Unknown', email: '', phone: '', status: '' },
        careerSuggestion: data.careerSuggestion ?? { domain: '', roles: [], courses: [], description: '' },
        testResults: data.testResults ?? [],
        examScores: data.examScores ?? [],
        skills: data.skills ?? [],
        projects: data.projects ?? [],
        generatedAt: data.generatedAt ?? new Date().toISOString(),
      };
      setPortfolio(normalized);
      try {
        localStorage.setItem(storageKey, JSON.stringify(normalized));
      } catch { }
    } catch (err) {
      setError('Failed to refresh portfolio data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!userId) return;
    const url = `${window.location.origin}/profile/${userId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Share link copied to clipboard');
    } catch {
      alert('Could not copy link; please copy manually: ' + url);
    }
  };

  const downloadCSV = (rows: string[][], filename = 'export.csv') => {
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDownloadExamScoresCSV = () => {
    if (!portfolio || !portfolio.examScores || portfolio.examScores.length === 0) {
      alert('No exam scores available to download.');
      return;
    }
    const rows = [['Exam', 'Score']];
    portfolio.examScores.forEach(s => rows.push([s.exam, s.score]));
    downloadCSV(rows, `exam-scores-${userId || 'profile'}.csv`);
  };

  const handleDownloadTestResultsCSV = () => {
    if (!portfolio || !portfolio.testResults || portfolio.testResults.length === 0) {
      alert('No test results available to download.');
      return;
    }
    const rows = [['Question ID', 'Answer']];
    portfolio.testResults.forEach(r => rows.push([String(r.questionId), r.answer]));
    downloadCSV(rows, `test-results-${userId || 'profile'}.csv`);
  };

  if (loading) {
    return (
      <div className="modern-container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="text-secondary">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="modern-container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="glass-card bg-white p-5 text-center">
          <p className="text-danger mb-3">{error || 'Portfolio not found'}</p>
          <Link to="/" className="btn-primary no-underline">Start Over</Link>
        </div>
      </div>
    );
  }

  const generatedDateText = portfolio.generatedAt ? new Date(portfolio.generatedAt).toLocaleString() : new Date().toLocaleString();

  return (
    <div className="min-vh-100 bg-surface py-5 font-sans text-primary">

      <div className="container position-relative z-1">
        <div className="row g-4">
          {/* Left Sidebar */}
          <div className="col-lg-4">
            {/* Profile Card */}
            <div className="glass-card bg-white p-4 mb-4 text-center">
              <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle glass-card bg-white border-primary" style={{ width: 96, height: 96, background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.2), rgba(var(--accent-rgb), 0.2))' }}>
                <span className="gradient-text fw-bold fs-1">{portfolio.personalInfo.name ? portfolio.personalInfo.name.charAt(0) : '?'}</span>
              </div>
              <h2 className="h3 fw-bold mb-1">{portfolio.personalInfo.name || '—'}</h2>
              <div className="text-primary fw-medium mb-4">{portfolio.personalInfo.status || '—'}</div>

              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center gap-3 p-3 rounded border text-start" style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)', borderColor: 'rgba(0, 0, 0, 0.08)' }}>
                  <Mail className="text-primary flex-shrink-0" size={20} />
                  <div className="overflow-hidden">
                    <div className="text-secondary small text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Email</div>
                    <div className="fw-medium text-truncate" title={portfolio.personalInfo.email}>{portfolio.personalInfo.email || '—'}</div>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3 p-3 rounded border text-start" style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)', borderColor: 'rgba(0, 0, 0, 0.08)' }}>
                  <Phone className="text-success flex-shrink-0" size={20} />
                  <div>
                    <div className="text-secondary small text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Phone</div>
                    <div className="fw-medium">{portfolio.personalInfo.phone || '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills & Projects (Moved to Sidebar) */}
            <div className="glass-card bg-white p-4 mb-4">
              <h3 className="h5 fw-bold mb-4 d-flex align-items-center gap-2">
                <Zap size={20} className="text-info" /> Skills & Projects
              </h3>

              <div className="mb-4">
                <div className="text-secondary small text-uppercase fw-bold mb-2">Top Skills</div>
                {portfolio.skills && portfolio.skills.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {portfolio.skills.map((skill, i) => (
                      <span key={i} className="badge bg-info bg-opacity-10 text-info px-3 py-2 rounded-pill fw-normal border border-info border-opacity-25">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-secondary small">No skills listed</div>
                )}
              </div>

              {portfolio.projects && portfolio.projects.length > 0 && (
                <div>
                  <div className="text-secondary small text-uppercase fw-bold mb-2">Projects</div>
                  <div className="d-flex flex-column gap-2">
                    {portfolio.projects.map((p, i) => (
                      <div key={i} className="d-flex align-items-center justify-content-between p-2 rounded border" style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)', borderColor: 'rgba(0, 0, 0, 0.08)' }}>
                        <span className="small fw-medium text-truncate">{p.title || `Project ${i + 1}`}</span>
                        {p.link ? (
                          <a href={p.link} target="_blank" rel="noreferrer" className="text-primary">
                            <ExternalLink size={14} />
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions (Moved to Sidebar) */}
            <div className="glass-card bg-white p-4">
              <h3 className="h5 fw-bold mb-3">Quick Actions</h3>
              <div className="d-flex flex-column gap-2">
                {userId && (
                  <Link to={`/research?userId=${userId}`} className="d-flex align-items-center justify-content-between p-3 rounded border text-decoration-none text-dark transition-all hover-translate-x" style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)', borderColor: 'rgba(0, 0, 0, 0.08)' }}>
                    <span className="fw-medium">Research Paper</span>
                    <ExternalLink size={16} className="text-secondary" />
                  </Link>
                )}
                <Link to={`/profile/edit?userId=${userId}`} className="d-flex align-items-center justify-content-between p-3 rounded border text-decoration-none text-dark transition-all hover-translate-x" style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)', borderColor: 'rgba(0, 0, 0, 0.08)' }}>
                  <span className="fw-medium">Edit Profile</span>
                  <ArrowLeft size={16} className="text-secondary rotate-180" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Main Content */}
          <div className="col-lg-8">
            {/* Header */}
            <div className="glass-card bg-white p-4 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <Link to="/" className="btn-ghost p-2 rounded-circle"><ArrowLeft size={20} /></Link>
                <div>
                  <h1 className="h4 fw-bold mb-0">Portfolio Dashboard</h1>
                  <div className="text-secondary small">Comprehensive Career Analysis</div>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 align-items-center">
                <button onClick={handleRefresh} className="btn-ghost text-secondary" title="Refresh">
                  <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
                </button>

                {userId && (
                  <Link to={`/profile/${userId}`} className="btn-ghost text-primary">Profile</Link>
                )}

                <Link to="/downloads" className="btn-ghost text-primary">Downloads</Link>

                <button onClick={handleCopyShareLink} className="btn-ghost text-secondary" title="Copy Link">
                  <Copy size={16} />
                </button>

                <button onClick={handleDownloadPDF} className="btn-primary d-flex align-items-center gap-2">
                  <Download size={16} /> PDF
                </button>

                <button onClick={handleNewConversation} className="btn-ghost text-secondary small">
                  New Chat
                </button>
              </div>
            </div>

            {/* Assessment Results */}
            <div className="glass-card bg-white p-4 mb-4">
              <h3 className="h5 fw-bold mb-4 d-flex align-items-center gap-2">
                <Briefcase size={22} className="text-accent" /> Assessment Results
              </h3>

              <div className="p-4 rounded mb-4" style={{ background: 'linear-gradient(to right, rgba(var(--primary-rgb), 0.1), transparent)', borderLeft: '4px solid var(--primary)' }}>
                <h4 className="h6 fw-bold mb-2 text-primary">Recommended Domain</h4>
                <div className="fs-4 fw-bold mb-2">{portfolio.careerSuggestion.domain || '—'}</div>
                <p className="text-secondary mb-0">{portfolio.careerSuggestion.description || ''}</p>
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <div className="h-100 d-flex flex-column">
                    <h4 className="h6 fw-bold mb-3">Suggested Roles</h4>
                    <div className="d-flex flex-column gap-3 flex-grow-1">
                      {portfolio.careerSuggestion.roles?.length > 0 ? (
                        portfolio.careerSuggestion.roles.map((role, i) => (
                          <div key={i} className="d-flex align-items-center gap-3 p-3 rounded border transition-all hover-translate-x flex-grow-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)', borderColor: 'rgba(0, 0, 0, 0.08)' }}>
                            <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 32, height: 32, minWidth: 32 }}>
                              <span className="small fw-bold">{i + 1}</span>
                            </div>
                            <span className="fw-medium">{role}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-secondary">No roles suggested</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="h-100 d-flex flex-column">
                    <h4 className="h6 fw-bold mb-3">Learning Path</h4>
                    <div className="d-flex flex-column gap-3 flex-grow-1">
                      {portfolio.careerSuggestion.courses?.length > 0 ? (
                        portfolio.careerSuggestion.courses.map((course: any, i: number) => {
                          const isObj = typeof course === 'object' && course !== null;
                          const name = isObj ? course.name : course;
                          const duration = isObj ? course.duration : '';
                          const details = isObj ? course.details : '';

                          return (
                            <div key={i} className="p-3 rounded border transition-all hover-translate-x flex-grow-1" style={{ backgroundColor: 'rgba(25, 135, 84, 0.1)', borderColor: 'rgba(25, 135, 84, 0.2)' }}>
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <div className="d-flex align-items-center gap-3">
                                  <div className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 32, height: 32, minWidth: 32 }}>
                                    <BookOpen size={16} />
                                  </div>
                                  <span className="fw-bold">{name}</span>
                                </div>
                                {duration && (
                                  <span className="badge bg-white text-success border border-success border-opacity-25 flex-shrink-0">{duration}</span>
                                )}
                              </div>
                              {details && (
                                <div className="text-secondary small ps-5 ms-2 border-start border-success border-opacity-25">
                                  {details}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-secondary">No courses recommended</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Colleges Section */}
            <div className="glass-card bg-white p-4 mb-4">
              <h3 className="h5 fw-bold mb-4 d-flex align-items-center gap-2">
                <Briefcase size={20} className="text-primary" /> Recommended Colleges
              </h3>

              {portfolio.careerSuggestion.colleges && portfolio.careerSuggestion.colleges.length > 0 ? (
                <div className="row g-3">
                  {portfolio.careerSuggestion.colleges.map((college, i) => (
                    <div key={i} className="col-md-6 col-xl-4">
                      <div className="p-3 rounded border h-100 d-flex flex-column justify-content-between transition-all hover-translate-y" style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)', borderColor: 'rgba(0, 0, 0, 0.08)' }}>
                        <div>
                          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                            <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '0.9rem' }}>{college.name}</h4>
                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25" style={{ fontSize: '0.65rem' }}>{college.country}</span>
                          </div>
                          <div className="small text-secondary mb-2">{college.course}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 border rounded border-dashed" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <p className="text-secondary mb-3">College recommendations not available in current data.</p>
                  <button onClick={handleRefresh} className="btn-primary d-inline-flex align-items-center gap-2">
                    <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
                    Generate 15 Top Colleges
                  </button>
                </div>
              )}
            </div>

            {/* Exam Scores Row */}
            <div className="glass-card bg-white p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="h5 fw-bold mb-0 d-flex align-items-center gap-2">
                  <Award size={20} className="text-warning" /> Exam Scores
                </h3>
                <button onClick={handleDownloadExamScoresCSV} className="btn-ghost text-secondary small p-1">
                  <FileText size={16} />
                </button>
              </div>

              {portfolio.examScores && portfolio.examScores.length > 0 ? (
                <div className="row g-3">
                  {portfolio.examScores.map((s, i) => (
                    <div key={i} className="col-sm-6">
                      <div className="d-flex justify-content-between align-items-center p-3 rounded border" style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)', borderColor: 'rgba(0, 0, 0, 0.08)' }}>
                        <div className="fw-medium">{s.exam}</div>
                        <div className="badge bg-warning bg-opacity-10 text-warning">{s.score}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-secondary text-center py-3">No exam scores available.</div>
              )}
            </div>

            {/* Implementation Summary */}
            <div className="glass-card bg-white p-4">
              <h3 className="h5 fw-bold mb-4">Implementation Summary</h3>
              <div className="row g-3">
                <div className="col-sm-4">
                  <div className="p-3 rounded text-center border h-100" style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)', borderColor: 'rgba(13, 110, 253, 0.2)' }}>
                    <div className="text-primary small fw-bold mb-1">Answered</div>
                    <div className="fs-3 fw-bold gradient-text">{portfolio.testResults?.length || 0}</div>
                    <div className="small text-secondary">Questions</div>
                  </div>
                </div>
                {/* Placeholders for future stats */}
              </div>

              <div className="mt-4 d-flex gap-2 justify-content-end">
                <button onClick={handleDownloadTestResultsCSV} className="btn-ghost text-secondary small">
                  <FileText size={14} className="me-1" /> Export Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-secondary small py-4 mt-2">
          <div className="d-inline-flex align-items-center gap-2">
            <Calendar size={14} />
            <span>Generated on {generatedDateText}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;