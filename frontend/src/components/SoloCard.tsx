import React from 'react';

interface SoloCardProps {
  children: React.ReactNode;
  className?: string;
}

const SoloCard: React.FC<SoloCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-4 rounded-lg shadow-md bg-white ${className}`}>
      {children}
    </div>
  );
};

export default SoloCard;
