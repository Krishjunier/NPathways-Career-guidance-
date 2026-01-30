import React from 'react';
import { TrendingUp, Award, BookOpen, Users } from 'lucide-react';
import StarChart from './StarChart';

interface ReportData {
  personalInfo: {
    name: string;
    email: string;
    status: string;
  };
  careerGuidance: {
    recommendedDomain: string;
    suggestedRoles: string[];
    recommendedCourses: (string | { name: string; duration: string; details: string })[];
    description: string;
  };
  nextSteps: string[];
  aggregates?: Record<string, number>;
}

interface ReportCardProps {
  report: ReportData;
}

const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const getIconForDomain = (domain: string) => {
    switch (domain.toLowerCase()) {
      case 'technology':
        return <TrendingUp width={28} height={28} />;
      case 'creative arts':
        return <Award width={28} height={28} />;
      case 'business & management':
        return <Users width={28} height={28} />;
      default:
        return <BookOpen width={28} height={28} />;
    }
  };

  return (
    <div className="chat-shell">
      {/* Personal Info */}
      <div className="glass-card mb-4">
        <h2 className="h5 mb-3 fw-bold d-flex align-items-center gap-2">
          <Users size={20} className="text-primary" /> Personal Information
        </h2>
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="text-secondary small text-uppercase fw-bold mb-1">Name</div>
            <div className="fw-medium fs-5">{report.personalInfo.name}</div>
          </div>
          <div className="col-12 col-md-4">
            <div className="text-secondary small text-uppercase fw-bold mb-1">Email</div>
            <div className="fw-medium">{report.personalInfo.email}</div>
          </div>
          <div className="col-12 col-md-4">
            <div className="text-secondary small text-uppercase fw-bold mb-1">Status</div>
            <div className="fw-medium">{report.personalInfo.status}</div>
          </div>
        </div>
      </div>

      {/* Career Recommendation */}
      <div className="glass-card mb-4">
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="rounded-circle d-flex align-items-center justify-content-center bg-primary bg-opacity-20 text-primary border border-primary border-opacity-20" style={{ width: 56, height: 56 }}>
            {getIconForDomain(report.careerGuidance.recommendedDomain)}
          </div>
          <div>
            <h2 className="h5 mb-1 fw-bold">Recommended Domain</h2>
            <div className="text-primary fw-bold fs-4">{report.careerGuidance.recommendedDomain}</div>
          </div>
        </div>
        <div className="p-3 rounded border mb-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <p className="text-secondary mb-0">{report.careerGuidance.description}</p>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <h3 className="h6 mb-3 fw-bold text-uppercase text-secondary small">Suggested Roles</h3>
            <div className="row g-2">
              {report.careerGuidance.suggestedRoles.map((role, i) => (
                <div key={i} className="col-md-6">
                  <div className="d-flex align-items-center gap-3 p-3 rounded border transition-transform hover-scale h-100" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <div className="rounded-circle bg-primary bg-opacity-20 text-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 28, height: 28 }}>
                      <span className="small fw-bold">{i + 1}</span>
                    </div>
                    <span className="fw-medium">{role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <h3 className="h6 mb-3 fw-bold text-uppercase text-secondary small">Recommended Courses</h3>
            <div className="row g-2">
              {report.careerGuidance.recommendedCourses.map((course: any, i) => {
                const isObj = typeof course === 'object' && course !== null;
                const name = isObj ? course.name : course;
                const duration = isObj && course.duration ? <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 ms-2" style={{ fontSize: '0.65rem' }}>{course.duration}</span> : null;

                return (
                  <div key={i} className="col-md-6">
                    <div className="d-flex align-items-center gap-3 p-3 rounded border transition-transform hover-scale h-100" style={{ backgroundColor: 'rgba(25, 135, 84, 0.1)', borderColor: 'rgba(25, 135, 84, 0.2)' }}>
                      <div className="rounded-circle bg-success bg-opacity-20 text-success d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 28, height: 28 }}>
                        <BookOpen size={14} />
                      </div>
                      <div className="d-flex flex-wrap align-items-center">
                        <span className="fw-medium">{name}</span>
                        {duration}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Key Scores (Aggregates) & Star Chart */}
      {report.aggregates && (
        <div className="glass-card mb-4">
          <h2 className="h5 mb-4 fw-bold d-flex align-items-center gap-2">
            <Award size={20} className="text-warning" /> Key Personality & Intelligence Scores
          </h2>

          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-7">
              <div className="row g-3">
                {Object.entries(report.aggregates)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .slice(0, 6)
                  .map(([k, v]) => (
                    <div key={k} className="col-6 col-md-4">
                      <div className="p-3 rounded-3 border d-flex flex-column justify-content-between h-100" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <span className="text-secondary small text-uppercase fw-bold mb-2">{k.replaceAll('_', ' ')}</span>
                        <span className="fs-4 fw-bold text-white">{v as number}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="col-12 col-lg-5">
              <div className="h-100 p-3 rounded-3 border d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <h4 className="h6 text-secondary text-uppercase mb-3">Holistic View</h4>
                {/* Map aggregates to StarChart format */}
                <StarChart data={[
                  { subject: 'Emotional', A: report.aggregates.emotional || 5, fullMark: 10 },
                  { subject: 'Behavioral', A: report.aggregates.behavioral || 5, fullMark: 10 },
                  { subject: 'Personality', A: report.aggregates.personality || 5, fullMark: 10 },
                  { subject: 'Aptitude', A: report.aggregates.aptitude || 5, fullMark: 10 },
                  { subject: 'Interest', A: report.aggregates.interest || 5, fullMark: 10 },
                ]} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="glass-card p-0 overflow-hidden border-0">
        <div className="p-4" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2))' }}>
          <h2 className="h5 mb-4 fw-bold d-flex align-items-center gap-2">
            <TrendingUp size={20} className="text-white" /> Next Steps
          </h2>
          <div className="d-flex flex-column gap-3">
            {report.nextSteps.map((step, i) => (
              <div key={i} className="d-flex align-items-start gap-3">
                <div className="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm" style={{ width: 28, height: 28 }}>
                  <span className="small fw-bold">{i + 1}</span>
                </div>
                <span className="fw-medium">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
