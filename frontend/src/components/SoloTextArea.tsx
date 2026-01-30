import React from 'react';

interface SoloTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  rows?: number;
}

const SoloTextArea: React.FC<SoloTextAreaProps> = ({
  value,
  onChange,
  label,
  error,
  placeholder,
  rows = 4
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`px-4 py-2 rounded-md border resize-y ${error ? 'border-red-500' : 'border-gray-300'}`}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default SoloTextArea;
