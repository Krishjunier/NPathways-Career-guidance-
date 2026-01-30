import React from 'react';
import SoloInput from './SoloInput';

interface EducationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

const educationOptions = [
  '12th - High School',
  '10th + Diploma',
  'UG - Undergraduate',
  'UG + Diploma',
  'Master',
  'PG Diploma'
];

const EducationSelector: React.FC<EducationSelectorProps> = ({
  value,
  onChange,
  label = 'Education Level',
  error
}) => {
  return (
    <div className="education-selector">
      <SoloInput
        list="education-options"
        value={value}
        onChange={onChange}
        label={label}
        error={error}
        placeholder="Select or type your education level"
        className="font-display"
      />
      <datalist id="education-options">
        {educationOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  );
};

export default EducationSelector;
