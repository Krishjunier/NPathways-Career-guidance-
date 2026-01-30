import React from 'react';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

const OTPInput: React.FC<OTPInputProps> = ({ value, onChange, length = 6 }) => {
  return (
    <div className="flex gap-2">
      {/* OTP input boxes */}
    </div>
  );
};

export default OTPInput;
