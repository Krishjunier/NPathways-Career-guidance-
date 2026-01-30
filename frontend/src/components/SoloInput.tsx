import React from 'react';

interface SoloInputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  error?: string;
  list?: string;
}

const SoloInput: React.FC<SoloInputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  className,
  required = false,
  error
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className || ''}`}>
      {label && (
        <label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default SoloInput;
