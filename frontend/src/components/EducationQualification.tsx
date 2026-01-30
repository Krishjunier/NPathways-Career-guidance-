import React, { useState } from 'react';
import SoloInput from './SoloInput';

interface EducationQualificationProps {
  onSubmit: (data: {
    educationLevel: string;
    marks: string;
  }) => void;
}

const educationOptions = [
  '12th',
  '10+diploma',
  'UG',
  'UG+diploma',
  'Master',
  'PhD'
];

const EducationQualification: React.FC<EducationQualificationProps> = ({ onSubmit }) => {
  const [educationLevel, setEducationLevel] = useState('');
  const [marks, setMarks] = useState('');
  const [error, setError] = useState({ education: '', marks: '' });

  const validateMarks = (value: string) => {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 35 || numValue > 100) {
      setError(prev => ({ ...prev, marks: 'Please enter marks between 35 and 100' }));
      return false;
    }
    setError(prev => ({ ...prev, marks: '' }));
    return true;
  };

  const validateEducation = (value: string) => {
    if (!educationOptions.includes(value)) {
      setError(prev => ({ ...prev, education: 'Please select a valid education level' }));
      return false;
    }
    setError(prev => ({ ...prev, education: '' }));
    return true;
  };

  const handleSubmit = () => {
    const isEducationValid = validateEducation(educationLevel);
    const isMarksValid = validateMarks(marks);

    if (isEducationValid && isMarksValid) {
      onSubmit({
        educationLevel,
        marks
      });
    }
  };

  const getMarkRange = (mark: number) => {
    if (mark >= 35 && mark <= 50) return '35-50';
    if (mark <= 60) return '51-60';
    if (mark <= 70) return '61-70';
    if (mark <= 80) return '71-80';
    if (mark <= 90) return '81-90';
    if (mark <= 100) return '91-100';
    return 'Invalid';
  };

  return (
    <div className="sl-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h3 className="sl-section-title">Education Details</h3>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <SoloInput
          type="text"
          list="education-options"
          value={educationLevel}
          onChange={(value: string) => {
            setEducationLevel(value);
            validateEducation(value);
          }}
          label="Education Level"
          error={error.education}
          placeholder="Type or select your education level"
        />
        <datalist id="education-options">
          {educationOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <SoloInput
          type="text"
          value={marks}
          onChange={(value: string) => {
            setMarks(value);
            validateMarks(value);
          }}
          label="Marks Percentage"
          error={error.marks}
          placeholder="Enter your marks (35-100)"
        />
        {marks && !error.marks && (
          <div className="sl-alert" style={{ marginTop: '0.5rem' }}>
            Mark Range: {getMarkRange(Number(marks))}%
          </div>
        )}
      </div>

      <button
        className="sl-button"
        onClick={handleSubmit}
        style={{ width: '100%' }}
      >
        Submit
      </button>
    </div>
  );
};

export default EducationQualification;