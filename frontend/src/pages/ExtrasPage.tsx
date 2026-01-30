import React, { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { ArrowLeft, Save, Briefcase, GraduationCap, Globe, Layers, AlertCircle, CheckCircle } from 'lucide-react';

const ExtrasPage: React.FC = () => {
  const [sp] = useSearchParams();
  const userId = useMemo(() => sp.get('userId') || '', [sp]);

  const [status, setStatus] = useState<'Student' | 'Working' | 'Abroad' | ''>('');
  const [studentStage, setStudentStage] = useState<'12th' | 'UG' | 'PG' | ''>('');

  // 12th
  const [stream, setStream] = useState('');
  const [academicPercentile, setAcademicPercentile] = useState('');
  const [ieltsSat, setIeltsSat] = useState('');

  // UG
  const [bachelorStream, setBachelorStream] = useState('');
  const [careerGoalUG, setCareerGoalUG] = useState('');
  const [greGmatUG, setGreGmatUG] = useState('');
  const [ugProjectsOrPapers, setUgProjectsOrPapers] = useState<string>('');

  // PG / Masters / PhD
  const [currentDegreeStream, setCurrentDegreeStream] = useState('');
  const [careerGoalPG, setCareerGoalPG] = useState('');
  const [examsPG, setExamsPG] = useState('');

  // Working Professional
  const [experienceRange, setExperienceRange] = useState('');
  const [currentCompanyDomain, setCurrentCompanyDomain] = useState('');
  const [careerGoalWork, setCareerGoalWork] = useState('');
  const [switchingDomain, setSwitchingDomain] = useState('');
  const [targetRoleIndustry, setTargetRoleIndustry] = useState('');
  const [breakoutOpportunities, setBreakoutOpportunities] = useState('');

  // Abroad
  const [targetCountryRegion, setTargetCountryRegion] = useState('');
  const [preferredJobType, setPreferredJobType] = useState('');
  const [requiredExamsCerts, setRequiredExamsCerts] = useState('');
  const [timelineAbroad, setTimelineAbroad] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    if (!userId) { setMsg('Missing userId'); return; }
    setSaving(true);
    setMsg('');
    try {
      const profile: any = { status, studentStage };

      if (status === 'Student') {
        if (studentStage === '12th') {
          profile.stream = stream;
          profile.academicPercentile = academicPercentile;
          profile.ieltsSat = ieltsSat;
        }
        if (studentStage === 'UG') {
          profile.bachelorStream = bachelorStream;
          profile.careerGoalUG = careerGoalUG;
          profile.greGmatUG = greGmatUG;
          profile.ugProjectsOrPapers = ugProjectsOrPapers;
        }
        if (studentStage === 'PG') {
          profile.currentDegreeStream = currentDegreeStream;
          profile.careerGoalPG = careerGoalPG;
          profile.examsPG = examsPG; // GRE/GMAT/GATE/NET
          // Research papers managed in /research page
        }
      }

      if (status === 'Working') {
        profile.experienceRange = experienceRange; // 1–3 / 3–5 / 5+
        profile.currentCompanyDomain = currentCompanyDomain;
        profile.careerGoalWork = careerGoalWork; // Upskill / Career Switch / Growth
        profile.switchingDomain = switchingDomain;
        profile.targetRoleIndustry = targetRoleIndustry;
        profile.breakoutOpportunities = breakoutOpportunities; // leadership, research, entrepreneurship
      }

      if (status === 'Abroad') {
        profile.targetCountryRegion = targetCountryRegion;
        profile.preferredJobType = preferredJobType; // Research / Corporate / Teaching / Freelance
        profile.requiredExamsCerts = requiredExamsCerts; // IELTS / TOEFL / GRE / GMAT / Others
        profile.timelineAbroad = timelineAbroad; // Within 6 months / 1 year / 2+ years
      }
      await apiService.updateProfile(userId, profile);
      setMsg('Details saved successfully!');
    } catch (e: any) {
      setMsg(e?.message || 'Failed to save details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modern-container py-4">
      {/* Background Orbs */}
      <div className="modern-bg-orb orb-1"></div>
      <div className="modern-bg-orb orb-2"></div>

      <div className="container position-relative z-1" style={{ maxWidth: '800px' }}>
        {/* Header */}
        <div className="glass-card p-4 mb-4 d-flex align-items-center gap-3">
          <Link to={`/profile/${userId}`} className="btn-ghost p-2 rounded-circle">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="h4 fw-bold mb-0">Additional Details</h1>
            <p className="subtitle small mb-0">Enrich your profile for better recommendations</p>
          </div>
        </div>

        <div className="glass-card p-4 p-md-5">
          <div className="mb-4">
            <label className="form-label text-secondary small text-uppercase fw-bold">Current Status</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0"><Layers size={18} className="text-secondary" /></span>
              <select className="form-select border-start-0 ps-0" value={status} onChange={e => { setStatus(e.target.value as any); setStudentStage(''); }}>
                <option value="">Select your status...</option>
                <option value="Student">Student</option>
                <option value="Working">Working Professional</option>
                <option value="Abroad">Interested in Working Abroad</option>
              </select>
            </div>
          </div>

          {status === 'Student' && (
            <div className="mb-4 fade-in-up">
              <label className="form-label text-secondary small text-uppercase fw-bold">Student Stage</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0"><GraduationCap size={18} className="text-secondary" /></span>
                <select className="form-select border-start-0 ps-0" value={studentStage} onChange={e => setStudentStage(e.target.value as any)}>
                  <option value="">Select stage...</option>
                  <option value="12th">12th Standard</option>
                  <option value="10th+diploma">10th + Diploma</option>
                  <option value="UG">Undergraduate (UG)</option>
                  <option value="UG+diploma">UG + Diploma</option>
                  <option value="Master">Master's / PG</option>
                </select>
              </div>
            </div>
          )}

          <div className="fade-in-up">
            {status === 'Student' && studentStage === '12th' && (
              <>
                <div className="mb-3">
                  <label className="form-label">Stream</label>
                  <select className="form-select" value={stream} onChange={e => setStream(e.target.value)}>
                    <option value="">Select</option>
                    <option>Science</option>
                    <option>Commerce</option>
                    <option>Arts</option>
                    <option>Vocational</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Academic Percentage</label>
                  <select className="form-select" value={academicPercentile} onChange={e => setAcademicPercentile(e.target.value)}>
                    <option value="">Select</option>
                    <option>≥ 85%</option>
                    <option>70% – 84%</option>
                    <option>&lt; 70%</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Planning for IELTS/SAT?</label>
                  <select className="form-select" value={ieltsSat} onChange={e => setIeltsSat(e.target.value)}>
                    <option value="">Select</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
              </>
            )}

            {status === 'Student' && studentStage === 'UG' && (
              <>
                <div className="mb-3">
                  <label className="form-label">Bachelor’s Stream</label>
                  <select className="form-select" value={bachelorStream} onChange={e => setBachelorStream(e.target.value)}>
                    <option value="">Select</option>
                    <option>Engineering / Tech</option>
                    <option>Business / Management</option>
                    <option>Arts / Humanities</option>
                    <option>Science</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Career Goal</label>
                  <select className="form-select" value={careerGoalUG} onChange={e => setCareerGoalUG(e.target.value)}>
                    <option value="">Select</option>
                    <option>Research & Academia</option>
                    <option>Corporate Jobs</option>
                    <option>Entrepreneurship</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Planning for GRE / GMAT?</label>
                  <select className="form-select" value={greGmatUG} onChange={e => setGreGmatUG(e.target.value)}>
                    <option value="">Select</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Projects or Papers (Links)</label>
                  <textarea className="form-control" rows={3} value={ugProjectsOrPapers} onChange={e => setUgProjectsOrPapers(e.target.value)} placeholder="e.g., GitHub repo links, published paper URLs..." />
                </div>
              </>
            )}

            {status === 'Student' && studentStage === 'PG' && (
              <>
                <div className="mb-3">
                  <label className="form-label">Current Degree / Stream</label>
                  <input className="form-control" value={currentDegreeStream} onChange={e => setCurrentDegreeStream(e.target.value)} placeholder="e.g., M.Tech CSE, MBA, M.Sc Physics" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Career Goal</label>
                  <select className="form-select" value={careerGoalPG} onChange={e => setCareerGoalPG(e.target.value)}>
                    <option value="">Select</option>
                    <option>Research</option>
                    <option>Jobs</option>
                    <option>Academia</option>
                    <option>Industry</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Exams Cleared / Planning</label>
                  <select className="form-select" value={examsPG} onChange={e => setExamsPG(e.target.value)}>
                    <option value="">Select</option>
                    <option>GRE</option>
                    <option>GMAT</option>
                    <option>GATE</option>
                    <option>NET</option>
                    <option>None</option>
                  </select>
                </div>
                <div className="alert alert-info d-flex gap-2 align-items-center bg-info bg-opacity-10 border-info border-opacity-25 text-info">
                  <AlertCircle size={18} />
                  <span>Upload your research papers in the <Link to={`/research?userId=${userId}`} className="fw-bold text-info">Research Section</Link>.</span>
                </div>
              </>
            )}

            {status === 'Working' && (
              <>
                <div className="mb-3">
                  <label className="form-label">Years of Experience</label>
                  <select className="form-select" value={experienceRange} onChange={e => setExperienceRange(e.target.value)}>
                    <option value="">Select</option>
                    <option>1 – 3 Years</option>
                    <option>3 – 5 Years</option>
                    <option>5+ Years</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Current Company / Domain</label>
                  <div className="input-group">
                    <span className="input-group-text bg-transparent border-end-0"><Briefcase size={18} className="text-secondary" /></span>
                    <input className="form-control border-start-0 ps-0" value={currentCompanyDomain} onChange={e => setCurrentCompanyDomain(e.target.value)} placeholder="e.g., TCS / FinTech" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Career Goal</label>
                  <select className="form-select" value={careerGoalWork} onChange={e => setCareerGoalWork(e.target.value)}>
                    <option value="">Select</option>
                    <option>Upskill</option>
                    <option>Career Switch</option>
                    <option>Growth in Current Domain</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Interested in Switching Domain?</label>
                  <select className="form-select" value={switchingDomain} onChange={e => setSwitchingDomain(e.target.value)}>
                    <option value="">Select</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Target Role / Industry</label>
                  <input className="form-control" value={targetRoleIndustry} onChange={e => setTargetRoleIndustry(e.target.value)} placeholder="e.g., Product Manager / Healthcare" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Breakout Opportunities Desired?</label>
                  <select className="form-select" value={breakoutOpportunities} onChange={e => setBreakoutOpportunities(e.target.value)}>
                    <option value="">Select</option>
                    <option>Leadership</option>
                    <option>Research</option>
                    <option>Entrepreneurship</option>
                    <option>None</option>
                  </select>
                </div>
              </>
            )}

            {status === 'Abroad' && (
              <>
                <div className="mb-3">
                  <label className="form-label">Target Country / Region</label>
                  <div className="input-group">
                    <span className="input-group-text bg-transparent border-end-0"><Globe size={18} className="text-secondary" /></span>
                    <input className="form-control border-start-0 ps-0" value={targetCountryRegion} onChange={e => setTargetCountryRegion(e.target.value)} placeholder="e.g., Canada, Germany, USA" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Preferred Job Type</label>
                  <select className="form-select" value={preferredJobType} onChange={e => setPreferredJobType(e.target.value)}>
                    <option value="">Select</option>
                    <option>Research</option>
                    <option>Corporate</option>
                    <option>Teaching</option>
                    <option>Freelance</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Required Exams / Certifications</label>
                  <input className="form-control" value={requiredExamsCerts} onChange={e => setRequiredExamsCerts(e.target.value)} placeholder="IELTS / TOEFL / GRE / GMAT / Others" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Timeline to Move Abroad</label>
                  <select className="form-select" value={timelineAbroad} onChange={e => setTimelineAbroad(e.target.value)}>
                    <option value="">Select</option>
                    <option>Within 6 months</option>
                    <option>1 year</option>
                    <option>2+ years</option>
                  </select>
                </div>
              </>
            )}

            <hr className="border-secondary border-opacity-10 my-4" />

            <button
              disabled={!status || (status === 'Student' && !studentStage) || saving}
              className="btn-primary w-100 d-flex align-items-center justify-content-center gap-2 py-3"
              onClick={save}
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <><Save size={20} /> Save Details</>
              )}
            </button>

            {msg && (
              <div className={`mt-3 p-3 rounded d-flex align-items-center gap-2 ${msg.includes('Failed') ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`}>
                {msg.includes('Failed') ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                <span>{msg}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtrasPage;
