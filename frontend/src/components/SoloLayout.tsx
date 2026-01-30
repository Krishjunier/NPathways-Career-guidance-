import React from 'react';

interface SoloLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const SoloLayout: React.FC<SoloLayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen p-4 ${className}`}>
      {children}
    </div>
  );
};

export default SoloLayout;
