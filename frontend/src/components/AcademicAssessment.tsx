import React, { useState, useMemo } from 'react';
import SoloInput from './SoloInput';
import { motion, AnimatePresence } from 'framer-motion';
import COUNTRIES from '../data/countries';

interface TestScoresProps {
  onComplete: (data: {
    educationLevel: string;
    marks: string;
    aptitudeScore: string;
    englishScore: string;
  }) => void;
}

// Education options as before
const educationOptions = [
  '10+diploma',
  '10+diploma+under graduate'
];

// Define score ranges for different tests
const aptitudeRanges = [
  { min: 0, max: 25, level: 'Basic', recommendation: 'Focus on fundamental logical and analytical skills' },
  { min: 26, max: 50, level: 'Intermediate', recommendation: 'Good foundation, work on advanced problem solving' },
  { min: 51, max: 75, level: 'Advanced', recommendation: 'Strong analytical skills, ready for complex challenges' },
  { min: 76, max: 100, level: 'Expert', recommendation: 'Excellent aptitude, suited for technical/analytical roles' }
];

const englishRanges = [
  { min: 0, max: 25, level: 'Basic', recommendation: 'Focus on grammar and vocabulary basics' },
  { min: 26, max: 50, level: 'Intermediate', recommendation: 'Work on advanced grammar and comprehension' },
  { min: 51, max: 75, level: 'Proficient', recommendation: 'Strong communication skills, focus on fluency' },
  { min: 76, max: 100, level: 'Expert', recommendation: 'Excellence in English, ready for advanced communication roles' }
];

const AcademicAssessment: React.FC<TestScoresProps> = ({ onComplete }) => {
  // Steps: 1 Role, 2 Education+Country, 3 Marks, 4 Aptitude+English, 5 Summary
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    educationLevel: '',
    marks: '',
    aptitudeScore: '',
    englishScore: ''
  });
  const [errors, setErrors] = useState({
    education: '',
    marks: '',
    aptitude: '',
    english: ''
  });

  const validateEducation = (value: string) => {
    if (!educationOptions.includes(value)) {
      setErrors(prev => ({ ...prev, education: 'Please select a valid education level' }));
      return false;
    }
    setErrors(prev => ({ ...prev, education: '' }));
    return true;
  };

  const validateMarks = (value: string) => {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 35 || numValue > 100) {
      setErrors(prev => ({ ...prev, marks: 'Please enter marks between 35 and 100' }));
      return false;
    }
    setErrors(prev => ({ ...prev, marks: '' }));
    return true;
  };

  const validateTestScore = (value: string, type: 'aptitude' | 'english') => {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      setErrors(prev => ({ ...prev, [type]: 'Please enter a score between 0 and 100' }));
      return false;
    }
    setErrors(prev => ({ ...prev, [type]: '' }));
    return true;
  };

  const getScoreLevel = (score: number, ranges: typeof aptitudeRanges) => {
    const range = ranges.find(r => score >= r.min && score <= r.max);
    return range || ranges[0];
  };

  // Country autocomplete helpers
  const [countryQuery, setCountryQuery] = useState('');
  const countrySuggestions = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return [] as string[];
    return COUNTRIES.filter(c => c.toLowerCase().startsWith(q)).slice(0, 10);
  }, [countryQuery]);

  const handleNext = () => {
    let isValid = true;

    switch (currentStep) {
      case 1:
        isValid = validateEducation(formData.educationLevel) && validateMarks(formData.marks);
        break;
      case 2:
        isValid = validateTestScore(formData.aptitudeScore, 'aptitude');
        break;
      case 3:
        // English step - validate and move to final summary (end) step
        isValid = validateTestScore(formData.englishScore, 'english');
        break;
      case 4:
        // move to summary step
        break;
      case 5:
        // Final step: user confirms and proceeds to psychometric (complete)
        onComplete(formData);
        break;
    }

    if (isValid && currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // Role selection step (first step)
        return (
          <>
            <h3 className="sl-section-title">Who am I speaking with?</h3>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                className="sl-button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, educationLevel: '' }));
                  setCurrentStep(2);
                }}
                style={{ width: '50%' }}
              >
                I'm Student
              </button>
              <button
                className="sl-button"
                onClick={() => {
                  // Parent branch: still continue but we'll store role in educationLevel as 'parent'
                  setFormData(prev => ({ ...prev, educationLevel: 'parent' }));
                  setCurrentStep(2);
                }}
                style={{ width: '50%' }}
              >
                I'm Parent / Guardian
              </button>
            </div>
          </>
        );

      case 2:
        // Education + country step
        return (
          <>
            <h3 className="sl-section-title">Education & Country</h3>
            <div style={{ marginBottom: '1rem' }}>
              <SoloInput
                type="text"
                list="education-options"
                value={formData.educationLevel === 'parent' ? '' : formData.educationLevel}
                onChange={(value: string) => {
                  setFormData(prev => ({ ...prev, educationLevel: value }));
                  validateEducation(value);
                }}
                label={formData.educationLevel === 'parent' ? "Parent (child's education)" : 'Education Level'}
                error={errors.education}
                placeholder="Type or select your education level"
              />
              <datalist id="education-options">
                {educationOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--sl-text-secondary)' }}>Country</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="sl-input"
                  type="text"
                  value={countryQuery}
                  onChange={(e) => setCountryQuery(e.target.value)}
                  placeholder="Start typing a country..."
                  style={{ width: '100%' }}
                />
                {countrySuggestions.length > 0 && (
                  <div style={{ position: 'absolute', zIndex: 30, background: 'var(--sl-surface)', border: '1px solid var(--sl-border)', width: '100%', marginTop: '0.25rem', borderRadius: 6, maxHeight: 200, overflow: 'auto' }}>
                    {countrySuggestions.map(c => (
                      <div
                        key={c}
                        onClick={() => {
                          setCountryQuery(c);
                          setFormData(prev => ({ ...prev, /* store country if you need */ marks: prev.marks }));
                        }}
                        style={{ padding: '0.5rem', cursor: 'pointer', color: 'var(--sl-text)' }}
                      >{c}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        );

      case 3:
        // Marks step
        return (
          <>
            <h3 className="sl-section-title">Academic Marks</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <SoloInput
                type="text"
                value={formData.marks}
                onChange={(value: string) => {
                  setFormData(prev => ({ ...prev, marks: value }));
                  validateMarks(value);
                }}
                label="Academic Marks Percentage"
                error={errors.marks}
                placeholder="Enter your marks (35-100)"
              />
            </div>
          </>
        );

      case 4:
        // Aptitude & English selection step with selection-based scoring
        return (
          <>
            <h3 className="sl-section-title">Aptitude & English</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--sl-text-secondary)' }}>Aptitude - choose the descriptor that best matches you</label>
              {[
                { label: 'I struggle with basic problem-solving', score: 20 },
                { label: 'I solve moderate problems with some help', score: 45 },
                { label: 'I solve advanced problems independently', score: 70 },
                { label: 'I excel at complex analytical tasks', score: 90 }
              ].map(opt => (
                <div key={opt.score} style={{ marginBottom: 8 }}>
                  <input
                    type="radio"
                    id={`apt-${opt.score}`}
                    name="aptitude"
                    onChange={() => setFormData(prev => ({ ...prev, aptitudeScore: String(opt.score) }))}
                    checked={Number(formData.aptitudeScore) === opt.score}
                  />
                  <label htmlFor={`apt-${opt.score}`} style={{ marginLeft: 8 }}>{opt.label}</label>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--sl-text-secondary)' }}>English - choose the descriptor that best matches you</label>
              {[
                { label: 'I need help with grammar and vocab', score: 20 },
                { label: 'I communicate but make frequent mistakes', score: 45 },
                { label: 'I am comfortable and mostly accurate', score: 70 },
                { label: 'I am fluent and can handle advanced texts', score: 90 }
              ].map(opt => (
                <div key={opt.score} style={{ marginBottom: 8 }}>
                  <input
                    type="radio"
                    id={`eng-${opt.score}`}
                    name="english"
                    onChange={() => setFormData(prev => ({ ...prev, englishScore: String(opt.score) }))}
                    checked={Number(formData.englishScore) === opt.score}
                  />
                  <label htmlFor={`eng-${opt.score}`} style={{ marginLeft: 8 }}>{opt.label}</label>
                </div>
              ))}

              {/* allow manual override if needed */}
              <div style={{ marginTop: 12 }}>
                <SoloInput
                  type="text"
                  value={formData.aptitudeScore}
                  onChange={(value: string) => {
                    setFormData(prev => ({ ...prev, aptitudeScore: value }));
                    validateTestScore(value, 'aptitude');
                  }}
                  label="Or enter Aptitude score (0-100)"
                  error={errors.aptitude}
                />
                <SoloInput
                  type="text"
                  value={formData.englishScore}
                  onChange={(value: string) => {
                    setFormData(prev => ({ ...prev, englishScore: value }));
                    validateTestScore(value, 'english');
                  }}
                  label="Or enter English score (0-100)"
                  error={errors.english}
                />
              </div>
            </div>
          </>
        );
      case 4:
        // Summary / End step shown before psychometric questions
        return (
          <>
            <h3 className="sl-section-title">Summary</h3>
            <div style={{ marginBottom: '1rem' }}>
              <p><strong>Education Level:</strong> {formData.educationLevel || '—'}</p>
              <p><strong>Academic Marks:</strong> {formData.marks || '—'}</p>
              <p><strong>Aptitude:</strong> {formData.aptitudeScore || '—'} — {getScoreLevel(Number(formData.aptitudeScore || 0), aptitudeRanges).level}</p>
              <p><strong>English:</strong> {formData.englishScore || '—'} — {getScoreLevel(Number(formData.englishScore || 0), englishRanges).level}</p>
            </div>
            <div className="sl-alert">
              This is the final summary. Press "Proceed to Psychometric" to continue to the psychometric questions.
            </div>
          </>
        );
    }
  };

  return (
    <div className="sl-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="sl-progress-bar" style={{ marginBottom: '2rem' }}>
        <div 
          className="sl-progress-fill"
          style={{ width: `${(currentStep / 5) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.32 }}
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        {currentStep > 1 && (
          <button
            className="sl-button"
            onClick={() => setCurrentStep(prev => prev - 1)}
            style={{ width: '48%' }}
          >
            Previous
          </button>
        )}
        <button
          className="sl-button"
          onClick={handleNext}
          style={{ width: currentStep === 1 ? '100%' : '48%' }}
        >
          {currentStep === 5 ? 'Proceed to Psychometric' : (currentStep === 4 ? 'Next (Summary)' : 'Next')}
        </button>
      </div>
    </div>
  );
};

export default AcademicAssessment;