import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import ReportCard from '../components/ReportCard';
import { ArrowLeft, Download, FileText, Gift, RefreshCw, Copy, ExternalLink, Briefcase, Award, GraduationCap, BookOpen } from 'lucide-react';



interface ExamScore {
  exam: string;
  score: string;
}

interface Project {
  title?: string;
  link?: string;
}

/**
 * Flexible report shape â€” keep an index signature so we can store any backend fields
 * without causing TypeScript errors when the backend shape differs from our expectations.
 */
interface ReportShape {
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
  };
  colleges?: { name?: string; college?: string; course?: string; country?: string }[];
  careerSuggestion?: {
    courses?: (string | { name: string; duration: string; details: string })[];
    [key: string]: any;
  };
  examScores?: ExamScore[];
  skills?: string[];
  projects?: Project[];
  generatedAt?: string;
  [key: string]: any;
}

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  // navigate removed (unused)

  const storageKey = userId ? `careerReport:${userId}` : '';

  const [report, setReport] = useState<ReportShape | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async (useCache = true) => {
      if (!userId) return;
      // aggressively clear cache to remove stale data
      if (userId) {
        try {
          localStorage.removeItem(`careerReport:${userId}`);
        } catch { }
      }

      setError('');
      setLoading(true);

      // try cache first - DISABLED to fix persistent default data
      // if (useCache && storageKey) {
      //   const cached = localStorage.getItem(storageKey);
      //   if (cached) {
      //     try {
      //       const parsed = JSON.parse(cached) as ReportShape;
      //       setReport(parsed);
      //     } catch {
      //       // ignore parse error and continue to fetch
      //     } finally {
      //       setLoading(false);
      //     }
      //   }
      // }

      try {
        const [reportResponse] = await Promise.all([
          apiService.getCareerReport(userId),
        ]);

        // treat the backend report as `any` when reading optional fields so TS doesn't complain
        const rawReport = (reportResponse.report || {}) as any;

        const normalizedReport: ReportShape = {
          // spread whatever core report contains (may include career guidance, scores, etc.)
          ...(rawReport || {}),
          // prefer explicit arrays from response.top-level if present, else fall back to rawReport fields
          colleges: reportResponse.colleges || rawReport.colleges || [],
          examScores: rawReport.examScores || [],
          skills: rawReport.skills || [],
          projects: rawReport.projects || [],
          generatedAt: rawReport.generatedAt || new Date().toISOString(),
        };

        setReport(normalizedReport);

        try {
          if (storageKey) localStorage.setItem(storageKey, JSON.stringify(normalizedReport));
        } catch { }
      } catch (err) {
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  const fetchData = async (isInitialLoad = false) => {
    if (!userId) return;

    // Aggressively clear cache to remove stale data on initial load
    if (isInitialLoad && userId) {
      try {
        localStorage.removeItem(`careerReport:${userId}`);
      } catch { /* ignore */ }
    }

    if (isInitialLoad) setLoading(true);
    setError('');

    try {
      // 1. Fetch current report
      let [reportResponse] = await Promise.all([
        apiService.getCareerReport(userId),
      ]);

      let rawReport = (reportResponse.report || {}) as any;

      // 2. CHECK IF DATA MISSING (Skills/Projects) -> FORCE REFRESH
      const isMissingData = !rawReport.skills?.length || !rawReport.projects?.length;
      if (isMissingData) {
        console.log("Missing Profile Data detected. Auto-refreshing...");
        const refreshRes = await apiService.refreshPortfolioData(userId);
        if (refreshRes && (refreshRes.portfolio?.careerSuggestion || refreshRes.portfolio?.skills || refreshRes.portfolio?.projects)) {
          // Use the fresher data if available, or re-fetch report
          const [newReportResponse] = await Promise.all([
            apiService.getCareerReport(userId),
          ]);
          reportResponse = newReportResponse;
          rawReport = (newReportResponse.report || {}) as any;
        }
      }

      const normalizedReport: ReportShape = {
        ...(rawReport || {}),
        colleges: reportResponse.colleges || rawReport.colleges || [],
        examScores: rawReport.examScores || [],
        skills: rawReport.skills || [],
        projects: rawReport.projects || [],
        generatedAt: rawReport.generatedAt || new Date().toISOString(),
      };

      setReport(normalizedReport);

      try {
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(normalizedReport));
      } catch { /* ignore */ }
    } catch (err) {
      console.error(err);
      setError('Failed to load profile data');
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleRefresh = async () => {
    if (!userId) return;
    setRefreshing(true);
    setError('');
    try {
      // Regenerate AI data first to get latest projects/colleges
      await apiService.refreshPortfolioData(userId);
      // Then fetch the updated report
      await fetchData(false); // Pass false as it's not an initial load
    } catch (err) {
      setError('Failed to refresh profile data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!userId) return;
    window.open(`https://npathways-career-guidance.onrender.com/api/portfolio/generate/${userId}`, '_blank');
  };

  const handleDownloadExcel = () => {
    if (!userId) return;
    window.open(`https://npathways-career-guidance.onrender.com/api/export/excel/${userId}`, '_blank');
  };

  const handleCopyShareLink = async () => {
    if (!userId) return;
    const url = `${window.location.origin}/profile/${userId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Share link copied to clipboard');
    } catch {
      alert('Could not copy link. URL: ' + url);
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



  const handleDownloadCollegesCSV = () => {
    if (!report || !report.colleges || report.colleges.length === 0) {
      alert('No colleges to download.');
      return;
    }
    const rows = [['College', 'Course', 'Country']];
    report.colleges.forEach((c: any) => rows.push([c.college || '', c.course || '', c.country || '']));
    downloadCSV(rows, `colleges-${userId || 'profile'}.csv`);
  };

  const handleDownloadExamScoresCSV = () => {
    if (!report || !report.examScores || report.examScores.length === 0) {
      alert('No exam scores to download.');
      return;
    }
    const rows = [['Exam', 'Score']];
    report.examScores.forEach((e: ExamScore) => rows.push([e.exam, e.score]));
    downloadCSV(rows, `exam-scores-${userId || 'profile'}.csv`);
  };



  if (loading) {
    return (
      <div className="modern-container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="text-secondary">Loading your career profile...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="modern-container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="glass-card p-5 text-center">
          <p className="text-danger mb-3">{error || 'Report not found'}</p>
          <Link to="/" className="btn-primary no-underline">Start Over</Link>
        </div>
      </div>
    );
  }

  const generatedAtText = report.generatedAt ? new Date(report.generatedAt).toLocaleString() : new Date().toLocaleString();
  const guidance = report.careerGuidance || { recommendedDomain: '', suggestedRoles: [], recommendedCourses: [], description: '' };

  return (
    <div className="modern-container py-4">
      <div className="modern-bg-orb orb-1"></div>
      <div className="modern-bg-orb orb-2"></div>
      <div className="modern-bg-orb orb-3"></div>

      <div className="container position-relative z-1">
        <div className="row g-4">

          {/* --- LEFT SIDEBAR (33%) --- */}
          <div className="col-lg-4">

            {/* 1. Profile Card */}
            <div className="glass-card p-4 mb-4 text-center">
              <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle glass-card border-primary" style={{ width: 96, height: 96, background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.2), rgba(var(--accent-rgb), 0.2))' }}>
                <span className="gradient-text fw-bold fs-1">{report.personalInfo?.name ? report.personalInfo.name.charAt(0) : '?'}</span>
              </div>
              <h2 className="h3 fw-bold mb-1">{report.personalInfo?.name || '—'}</h2>
              <div className="text-primary fw-medium mb-4">{report.personalInfo?.status || 'Student'}</div>

              <div className="d-flex flex-column gap-3 text-start">
                <div className="p-3 rounded border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <div className="text-secondary small text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Email</div>
                  <div className="fw-medium text-truncate" title={report.personalInfo?.email}>{report.personalInfo?.email || '—'}</div>
                </div>
                <div className="p-3 rounded border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <div className="text-secondary small text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Phone</div>
                  <div className="fw-medium">{report.personalInfo?.phone || '—'}</div>
                </div>
              </div>
            </div>

            {/* 2. Skills & Projects (Sidebar) */}
            <div className="glass-card p-4 mb-4">
              <h3 className="h5 fw-bold mb-4 d-flex align-items-center gap-2">
                <Gift size={20} className="text-info" /> Skills & Projects
              </h3>

              {/* Skills */}
              <div className="mb-4">
                <div className="text-secondary small text-uppercase fw-bold mb-2">Top Skills</div>
                {report.skills && report.skills.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {report.skills.map((skill, i) => (
                      <span key={i} className="badge bg-info bg-opacity-10 text-info px-2 py-1 rounded border border-info border-opacity-25">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 border rounded border-dashed" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div className="text-secondary small mb-2">No skills generated</div>
                    <button onClick={handleRefresh} className="btn-primary btn-sm d-inline-flex align-items-center gap-1">
                      <RefreshCw size={12} className={refreshing ? 'spin' : ''} />
                      {refreshing ? 'Generating...' : 'Generate Skills'}
                    </button>
                  </div>
                )}
              </div>

              {/* Projects */}
              <div>
                <div className="text-secondary small text-uppercase fw-bold mb-2">Real-World Projects</div>
                {report.projects && report.projects.length > 0 ? (
                  <div className="d-flex flex-column gap-2">
                    {report.projects.map((p, i) => (
                      <div key={i} className="d-flex align-items-center justify-content-between p-2 rounded border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <span className="small fw-medium text-truncate" style={{ maxWidth: '80%' }}>{p.title || `Project ${i + 1}`}</span>
                        {p.link && (
                          <a href={p.link} target="_blank" rel="noreferrer" className="text-primary">
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 border rounded border-dashed" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div className="text-secondary small mb-2">No projects generated</div>
                    <button onClick={handleRefresh} className="btn-primary btn-sm d-inline-flex align-items-center gap-1">
                      <RefreshCw size={12} className={refreshing ? 'spin' : ''} />
                      {refreshing ? 'Generating...' : 'Generate Projects'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Quick Actions */}
            <div className="glass-card p-4">
              <h3 className="h5 fw-bold mb-3">Quick Actions</h3>
              <div className="d-flex flex-column gap-2">
                <Link to={`/research?userId=${userId}`} className="d-flex align-items-center justify-content-between p-3 rounded border text-decoration-none text-light transition-all hover-translate-x" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <span className="fw-medium">Research Paper</span>
                  <ExternalLink size={16} className="text-secondary" />
                </Link>
                <Link to={`/profile/edit?userId=${userId}`} className="d-flex align-items-center justify-content-between p-3 rounded border text-decoration-none text-light transition-all hover-translate-x" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <span className="fw-medium">Edit Profile</span>
                  <ArrowLeft size={16} className="text-secondary rotate-180" />
                </Link>
                <Link to="/" className="d-flex align-items-center justify-content-between p-3 rounded border text-decoration-none text-light transition-all hover-translate-x" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <span className="fw-medium">New Assessment</span>
                  <ArrowLeft size={16} className="text-secondary rotate-180" />
                </Link>
              </div>
            </div>

          </div>

          {/* --- RIGHT MAIN CONTENT (66%) --- */}
          <div className="col-lg-8">

            {/* Header */}
            <div className="glass-card p-4 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <h1 className="h4 fw-bold mb-0">Career Guidance Report</h1>
                <div className="text-secondary small">Generated on {generatedAtText}</div>
              </div>
              <div className="d-flex gap-2">
                <button onClick={handleRefresh} className="btn-ghost text-secondary" title="Refresh Data">
                  <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
                </button>
                <button onClick={handleCopyShareLink} className="btn-ghost text-secondary" title="Copy Link">
                  <Copy size={18} />
                </button>
                {userId && <Link to={`/portfolio/${userId}`} className="btn-ghost text-primary fw-medium">Portfolio</Link>}
                <button onClick={handleDownloadExcel} className="btn-secondary d-flex align-items-center gap-2">
                  <Download size={16} /> Excel
                </button>
                <button onClick={handleDownloadPDF} className="btn-primary d-flex align-items-center gap-2">
                  <FileText size={16} /> PDF
                </button>
              </div>
            </div>

            {/* Assessment (Domain, Roles, Courses) */}
            <div className="glass-card p-4 mb-4">
              <h3 className="h5 fw-bold mb-4 d-flex align-items-center gap-2">
                <Briefcase size={20} className="text-accent" /> Assessment Results
              </h3>

              {/* Banner */}
              <div className="p-4 rounded mb-4" style={{ background: 'linear-gradient(to right, rgba(var(--primary-rgb), 0.1), transparent)', borderLeft: '4px solid var(--primary)' }}>
                <h4 className="h6 fw-bold mb-2 text-primary">Recommended Domain</h4>
                <div className="fs-4 fw-bold mb-2">{guidance.recommendedDomain || 'Pending Analysis'}</div>
                <p className="text-secondary mb-0">{guidance.description || ''}</p>
              </div>

              {/* Split View: Roles & Courses */}
              <div className="row g-4">
                <div className="col-md-6">
                  <h4 className="h6 fw-bold mb-3">Suggested Roles</h4>
                  <div className="d-flex flex-column gap-2 mb-3">
                    {guidance.suggestedRoles && guidance.suggestedRoles.length > 0 ? (
                      guidance.suggestedRoles.map((role: string, i: number) => (
                        <div key={i} className="d-flex align-items-center gap-3 p-3 rounded border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                          <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 28, height: 28 }}>
                            <span className="small fw-bold">{i + 1}</span>
                          </div>
                          <span className="fw-medium">{role}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-secondary small">No roles available</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <h4 className="h6 fw-bold mb-3">Learning Path</h4>
                  <div className="d-flex flex-column gap-2">
                    {guidance.recommendedCourses && guidance.recommendedCourses.length > 0 ? (
                      guidance.recommendedCourses.map((course: any, i: number) => {
                        const name = typeof course === 'object' ? course.name : course;
                        return (
                          <div key={i} className="d-flex align-items-center gap-3 p-3 rounded border" style={{ backgroundColor: 'rgba(25, 135, 84, 0.1)', borderColor: 'rgba(25, 135, 84, 0.2)' }}>
                            <BookOpen size={16} className="text-success flex-shrink-0" />
                            <span className="fw-medium text-truncate" title={name}>{name}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-secondary small">No courses available</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Colleges Grid */}
            <div className="glass-card p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="h5 fw-bold mb-0 d-flex align-items-center gap-2">
                  <GraduationCap size={20} className="text-info" /> Recommended Colleges
                </h2>
                <button onClick={handleDownloadCollegesCSV} className="btn-ghost text-secondary small">CSV</button>
              </div>

              {report.colleges && report.colleges.length > 0 ? (
                <div className="row g-3">
                  {report.colleges.filter((c: any) => c && (c.college || c.name)).slice(0, 9).map((c: any, i: number) => (
                    <div key={i} className="col-md-6 col-xl-4">
                      <div className="p-3 rounded border h-100 d-flex flex-column justify-content-between transition-transform hover-scale" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <div className="mb-2">
                          <div className="fw-bold text-light mb-1" style={{ fontSize: '0.85rem' }}>{c.name || c.college}</div>
                          <div className="small text-secondary">{c.course}</div>
                        </div>
                        {c.country && <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25" style={{ width: 'fit-content', fontSize: '0.6rem' }}>{c.country}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 border rounded border-dashed" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <p className="text-secondary mb-3">College recommendations pending.</p>
                  <button onClick={handleRefresh} className="btn-primary d-inline-flex align-items-center gap-2">
                    <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
                    Generate Colleges
                  </button>
                </div>
              )}
            </div>

            {/* Exam Scores Grid */}
            <div className="glass-card p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="h5 fw-bold mb-0 d-flex align-items-center gap-2"><Award size={20} className="text-warning" /> Exam Scores</h2>
                <button onClick={handleDownloadExamScoresCSV} className="btn-ghost text-secondary small">CSV</button>
              </div>

              {report.examScores && report.examScores.length > 0 ? (
                <div className="row g-3">
                  {report.examScores.map((e, i) => (
                    <div key={i} className="col-sm-6">
                      <div className="d-flex justify-content-between align-items-center p-3 rounded bg-white bg-opacity-5 h-100">
                        <div className="fw-medium">{e.exam}</div>
                        <div className="badge bg-warning bg-opacity-10 text-warning">{e.score}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-secondary text-center py-4">No exam scores recorded.</div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
