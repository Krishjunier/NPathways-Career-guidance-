import React, { useState } from 'react';
import SoloCard from '../components/SoloCard';
import SoloSelect from '../components/SoloSelect';
import SoloButton from '../components/SoloButton';
import SoloTextArea from '../components/SoloTextArea';

export interface EndGoalFormData {
  careerGoal: string;
  targetIndustry: string;
  timeframe: string;
  additionalGoals: string;
}

interface EndGoalFormProps {
  onSubmit: (data: EndGoalFormData) => void;
}

const EndGoalForm: React.FC<EndGoalFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<EndGoalFormData>({
    careerGoal: '',
    targetIndustry: '',
    timeframe: '',
    additionalGoals: ''
  });

  const careerGoalOptions = [
    { label: 'Higher Education', value: 'higher_education' },
    { label: 'Career Switch', value: 'career_switch' },
    { label: 'Career Growth', value: 'career_growth' },
    { label: 'Entrepreneurship', value: 'entrepreneurship' },
    { label: 'Research & Development', value: 'research' }
  ];

  const timeframeOptions = [
    { label: 'Within 6 months', value: '6_months' },
    { label: '6-12 months', value: '12_months' },
    { label: '1-2 years', value: '2_years' },
    { label: '2+ years', value: 'more_than_2_years' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <SoloCard className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Let's Define Your Career Goals</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <SoloSelect
          label="What is your primary career goal?"
          value={formData.careerGoal}
          onChange={(value) => setFormData(prev => ({ ...prev, careerGoal: value }))}
          options={careerGoalOptions}
          placeholder="Select your career goal"
        />

        <SoloTextArea
          label="Which industry or field interests you the most?"
          value={formData.targetIndustry}
          onChange={(value) => setFormData(prev => ({ ...prev, targetIndustry: value }))}
          placeholder="e.g., Technology, Healthcare, Finance, etc."
        />

        <SoloSelect
          label="When do you want to achieve this goal?"
          value={formData.timeframe}
          onChange={(value) => setFormData(prev => ({ ...prev, timeframe: value }))}
          options={timeframeOptions}
          placeholder="Select your timeframe"
        />

        <SoloTextArea
          label="Any additional career goals or aspirations?"
          value={formData.additionalGoals}
          onChange={(value) => setFormData(prev => ({ ...prev, additionalGoals: value }))}
          placeholder="Share any other career goals or aspirations you have..."
          rows={4}
        />

        <SoloButton
          type="submit"
          className="w-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Continue to Assessment
        </SoloButton>
      </form>
    </SoloCard>
  );
};

export default EndGoalForm;
