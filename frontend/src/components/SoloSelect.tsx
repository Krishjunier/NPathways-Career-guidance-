import React from 'react';

interface SoloSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  label?: string;
  error?: string;
  placeholder?: string;
}

const SoloSelect: React.FC<SoloSelectProps> = ({
  value,
  onChange,
  options,
  label,
  error,
  placeholder
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`px-4 py-2 rounded-md border ${error ? 'border-red-500' : 'border-gray-300'}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default SoloSelect;
