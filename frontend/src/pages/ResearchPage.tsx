// src/pages/ResearchPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';

interface ResearchPaper {
  id?: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  url: string;
  abstract?: string;
}

const ResearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get userId from query params or localStorage
  const userId = React.useMemo(() => {
    const fromQuery = searchParams.get('userId');
    if (fromQuery) return fromQuery;
    
    const saved = localStorage.getItem('cc_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.userId || '';
      } catch {
        return '';
      }
    }
    return '';
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [papers, setPapers] = useState<ResearchPaper[]>([
    { title: '', authors: '', journal: '', year: '', url: '', abstract: '' },
  ]);
  const [message, setMessage] = useState('');

  // Load user profile and existing research data
  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }

    async function loadData() {
      setLoading(true);
      try {
        // Load user profile to display name/email
        const profile = await apiService.getUserProfile(userId);
        setUserProfile(profile);

        // Try to load existing research submissions
        try {
          const researchData = await apiService.getExtras(userId);
          if (researchData?.researchPapers && Array.isArray(researchData.researchPapers)) {
            setPapers(researchData.researchPapers.length > 0 
              ? researchData.researchPapers 
              : [{ title: '', authors: '', journal: '', year: '', url: '', abstract: '' }]
            );
          }
        } catch (err) {
          console.log('No existing research data found, starting fresh');
        }
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        setMessage('❌ Failed to load your profile data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userId, navigate]);

  const addPaper = () => {
    if (papers.length >= 5) {
      setMessage('⚠️ Maximum 5 papers allowed');
      return;
    }
    setPapers([...papers, { title: '', authors: '', journal: '', year: '', url: '', abstract: '' }]);
  };

  const removePaper = (index: number) => {
    if (papers.length === 1) {
      setMessage('⚠️ At least one paper entry is required');
      return;
    }
    setPapers(papers.filter((_, i) => i !== index));
  };

  const updatePaper = (index: number, field: keyof ResearchPaper, value: string) => {
    const updated = [...papers];
    updated[index] = { ...updated[index], [field]: value };
    setPapers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setMessage('❌ Missing user ID');
      return;
    }

    // Validate at least one paper has required fields
    const validPapers = papers.filter(p => p.title && p.authors);
    if (validPapers.length === 0) {
      setMessage('❌ Please fill in at least one paper with title and authors');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      await apiService.submitResearch(userId, {
        researchPapers: validPapers,
        submittedAt: new Date().toISOString(),
      });
      
      setMessage('✅ Research papers submitted successfully!');
      
      // Auto-clear success message and navigate after delay
      setTimeout(() => {
        navigate(`/profile/${userId}`);
      }, 2000);
    } catch (err: any) {
      console.error('Submission error:', err);
      setMessage(`❌ ${err?.message || 'Failed to submit research papers'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Safety check
  if (!userId) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>⚠️ No User ID Found</h4>
          <p>Please complete your profile first.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-5">
        <div className="d-flex align-items-center justify-content-center">
          <div className="spinner-border me-3" role="status" />
          <div>Loading research submission form...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Header */}
          <div className="bg-dark text-white rounded-3 p-3 mb-3 shadow-sm">
            <h2 className="h5 mb-1">Research Paper Submission</h2>
            <p className="small mb-0 text-white-50">
              Submit 2-3 research papers or publications to enhance your profile
            </p>
          </div>

          {/* User Info Card */}
          {userProfile && (
            <div className="card mb-3">
              <div className="card-body">
                <h6 className="card-subtitle mb-2 text-muted">Submitting as:</h6>
                <p className="mb-1"><strong>{userProfile.name || 'Unknown User'}</strong></p>
                <p className="mb-0 text-muted small">{userProfile.email || 'No email'}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="card shadow-sm">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {papers.map((paper, index) => (
                  <div key={index} className="border rounded p-3 mb-3 position-relative">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0">Paper {index + 1}</h6>
                      {papers.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removePaper(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={paper.title}
                        onChange={(e) => updatePaper(index, 'title', e.target.value)}
                        placeholder="Enter paper title"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Authors *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={paper.authors}
                        onChange={(e) => updatePaper(index, 'authors', e.target.value)}
                        placeholder="e.g., John Doe, Jane Smith"
                        required
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Journal/Conference</label>
                        <input
                          type="text"
                          className="form-control"
                          value={paper.journal}
                          onChange={(e) => updatePaper(index, 'journal', e.target.value)}
                          placeholder="e.g., IEEE, ACM"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Year</label>
                        <input
                          type="text"
                          className="form-control"
                          value={paper.year}
                          onChange={(e) => updatePaper(index, 'year', e.target.value)}
                          placeholder="e.g., 2023"
                          maxLength={4}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">URL/DOI</label>
                      <input
                        type="url"
                        className="form-control"
                        value={paper.url}
                        onChange={(e) => updatePaper(index, 'url', e.target.value)}
                        placeholder="https://doi.org/..."
                      />
                    </div>

                    <div className="mb-0">
                      <label className="form-label">Abstract (optional)</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={paper.abstract}
                        onChange={(e) => updatePaper(index, 'abstract', e.target.value)}
                        placeholder="Brief summary of the research paper"
                      />
                    </div>
                  </div>
                ))}

                {papers.length < 5 && (
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm mb-3"
                    onClick={addPaper}
                  >
                    + Add Another Paper
                  </button>
                )}

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(`/profile/${userId}`)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Research Papers'
                    )}
                  </button>
                </div>

                {message && (
                  <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} mt-3 mb-0`}>
                    {message}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-3 text-muted small">
            <p className="mb-1">
              <strong>Tips:</strong>
            </p>
            <ul className="mb-0">
              <li>Provide accurate publication details for better profile evaluation</li>
              <li>Include DOI or URL links for verification</li>
              <li>You can add up to 5 research papers</li>
              <li>At least title and authors are required for each paper</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchPage;
