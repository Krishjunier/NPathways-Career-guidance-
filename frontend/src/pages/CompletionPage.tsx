// src/pages/CompletionPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Download, User, Book, MessageSquare, Home, Award, Sparkles, FileText, BarChart2 } from 'lucide-react';

export default function CompletionPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const userIdFromState = (location.state as any)?.userId;
  const urlParams = new URLSearchParams(location.search);
  const userIdFromQuery = urlParams.get('userId');
  const saved = typeof window !== "undefined" ? localStorage.getItem("cc_user") : null;
  const savedData = saved ? JSON.parse(saved) : null;

  const userId = userIdFromQuery ?? userIdFromState ?? savedData?.userId;
  const userName = savedData?.name || 'User';
  const userEmail = savedData?.email || '';

  const [requestingCounseling, setRequestingCounseling] = useState(false);
  const [counselingRequested, setCounselingRequested] = useState(false);
  const [counselingError, setCounselingError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  useEffect(() => {
    if (!userId) {
      navigate('/information', { replace: true });
    }
  }, [userId, navigate]);

  const handleRequestCounseling = async () => {
    setRequestingCounseling(true);
    setCounselingError(null);

    try {
      const response = await fetch('http://localhost:5000/api/counseling/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName,
          userEmail,
          requestedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to request counseling');
      setCounselingRequested(true);
    } catch (error: any) {
      setCounselingError(error.message || 'Failed to send counseling request');
    } finally {
      setRequestingCounseling(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!userId) return;
    setDownloadingPdf(true);
    window.open(`http://localhost:5000/api/portfolio/generate/${userId}`, '_blank');
    setTimeout(() => setDownloadingPdf(false), 2000);
  };

  const handleDownloadExcel = () => {
    if (!userId) return;
    setDownloadingExcel(true);
    window.open(`http://localhost:5000/api/export/excel/${userId}`, '_blank');
    setTimeout(() => setDownloadingExcel(false), 2000);
  };

  const handleViewProfile = () => {
    if (!userId) return;
    navigate(`/profile/${userId}`, { state: { userId } });
  };

  const handleViewPortfolio = () => {
    if (!userId) return;
    navigate(`/portfolio/${userId}`, { state: { userId } });
  };

  if (!userId) return null;

  return (
    <div className="modern-container">
      {/* Background Orbs */}
      <div className="modern-bg-orb orb-1"></div>
      <div className="modern-bg-orb orb-2"></div>
      <div className="modern-bg-orb orb-3"></div>

      <div className="container position-relative z-1" style={{ maxWidth: '900px' }}>

        {/* Modern Header */}
        <div className="text-center mb-5">
          <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-circle glass-card mb-4">
            <Sparkles size={48} className="text-warning" />
          </div>
          <h1 className="display-4 fw-bold mb-3 gradient-text">Assessment Complete</h1>
          <p className="subtitle lead">
            Congratulations, {userName}! Your comprehensive career profile is ready.
          </p>
        </div>

        {/* Success Card */}
        <div className="glass-card mb-4 p-5 text-center">
          <h2 className="h3 fw-bold mb-4">You've Unlocked Your Potential</h2>
          <p className="text-secondary mb-4">
            You have successfully completed the RIASEC, Intelligence, and Emotional assessments.
            Your personalized insights have been generated.
          </p>

          <div className="row g-3 justify-content-center mb-4">
            <div className="col-auto">
              <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill border border-success border-opacity-25 bg-success bg-opacity-10 text-success">
                <CheckCircle size={16} /> RIASEC
              </div>
            </div>
            <div className="col-auto">
              <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill border border-success border-opacity-25 bg-success bg-opacity-10 text-success">
                <CheckCircle size={16} /> Intelligence
              </div>
            </div>
            <div className="col-auto">
              <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill border border-success border-opacity-25 bg-success bg-opacity-10 text-success">
                <CheckCircle size={16} /> Emotional
              </div>
            </div>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="row g-4 mb-5">
          {/* Downloads */}
          <div className="col-md-6">
            <div className="glass-card p-4 h-100">
              <h3 className="h5 fw-bold mb-3 d-flex align-items-center gap-2">
                <Download size={20} className="text-primary" /> Download Reports
              </h3>
              <div className="d-flex flex-column gap-3">
                <button
                  className="btn-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                >
                  <FileText size={18} /> {downloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}
                </button>
                <button
                  className="btn-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={handleDownloadExcel}
                  disabled={downloadingExcel}
                >
                  <BarChart2 size={18} /> {downloadingExcel ? 'Generating Excel...' : 'Download Excel Data'}
                </button>
              </div>
            </div>
          </div>

          {/* View Results */}
          <div className="col-md-6">
            <div className="glass-card p-4 h-100">
              <h3 className="h5 fw-bold mb-3 d-flex align-items-center gap-2">
                <Award size={20} className="text-primary" /> View Results
              </h3>
              <div className="d-flex flex-column gap-3">
                <button
                  className="btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={handleViewProfile}
                >
                  <User size={18} /> View Career Profile
                </button>
                <button
                  className="btn-ghost w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={handleViewPortfolio}
                >
                  <Book size={18} /> View Full Portfolio
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Counseling Section */}
        <div className="glass-card p-4 mb-4">
          <h3 className="h5 fw-bold mb-3 d-flex align-items-center gap-2">
            <MessageSquare size={20} className="text-accent" /> Expert Guidance
          </h3>

          {!counselingRequested ? (
            <div className="row align-items-center g-4">
              <div className="col-md-8">
                <p className="text-secondary mb-0">
                  Need help interpreting your results? Request a personalized session with our career counselors.
                </p>
                {counselingError && <p className="text-danger small mt-2 mb-0">{counselingError}</p>}
              </div>
              <div className="col-md-4 text-end">
                <button
                  className="btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={handleRequestCounseling}
                  disabled={requestingCounseling}
                >
                  {requestingCounseling ? 'Sending...' : 'Request Counseling'}
                </button>
              </div>
            </div>
          ) : (
            <div className="alert alert-success d-flex align-items-center gap-3 mb-0 border-0 bg-success bg-opacity-10 text-success">
              <CheckCircle size={24} />
              <div>
                <h4 className="h6 fw-bold mb-1">Request Received</h4>
                <p className="mb-0 small">
                  Our team will contact you at <strong>{userEmail}</strong> within 24-48 hours.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-5 mb-4">
          <button
            className="btn-ghost d-inline-flex align-items-center gap-2"
            onClick={() => navigate('/information', { replace: true })}
          >
            <Home size={18} /> Return to Home
          </button>
        </div>

      </div>
    </div>
  );
}