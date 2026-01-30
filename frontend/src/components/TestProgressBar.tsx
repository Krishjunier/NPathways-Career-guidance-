// src/components/TestProgressBar.tsx
import React from 'react';

interface TestProgressBarProps {
  currentStep: 1 | 2 | 3;
  stepNames?: string[];
}

export default function TestProgressBar({ 
  currentStep, 
  stepNames = ['RIASEC', 'Multiple Intelligence', 'Emotional Intelligence'] 
}: TestProgressBarProps) {
  const steps = [
    { number: 1, name: stepNames[0] },
    { number: 2, name: stepNames[1] },
    { number: 3, name: stepNames[2] },
  ];

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="d-flex flex-column align-items-center" style={{ flex: 1 }}>
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center mb-2 ${
                  currentStep === step.number
                    ? 'bg-primary text-white'
                    : currentStep > step.number
                    ? 'bg-success text-white'
                    : 'bg-light text-muted'
                }`}
                style={{
                  width: '40px',
                  height: '40px',
                  fontWeight: 'bold',
                  fontSize: '18px',
                }}
              >
                {currentStep > step.number ? '✓' : step.number}
              </div>
              <small
                className={`text-center ${
                  currentStep === step.number
                    ? 'text-primary fw-bold'
                    : currentStep > step.number
                    ? 'text-success'
                    : 'text-muted'
                }`}
                style={{ fontSize: '12px', maxWidth: '100px' }}
              >
                {step.name}
              </small>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`${
                  currentStep > step.number ? 'bg-success' : 'bg-light'
                }`}
                style={{
                  height: '3px',
                  flex: 1,
                  marginBottom: '35px',
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="text-center mt-3">
        <small className="text-muted">
          Section {currentStep} of 3 - {stepNames[currentStep - 1]}
        </small>
      </div>
    </div>
  );
}
