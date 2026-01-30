import React from 'react';

interface SoloButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
}

const SoloButton: React.FC<SoloButtonProps> = ({ 
  children, 
  variant = 'primary',
  className = '',
  ...props 
}) => {
  return (
    <button
      className={`px-4 py-2 rounded-md ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default SoloButton;
